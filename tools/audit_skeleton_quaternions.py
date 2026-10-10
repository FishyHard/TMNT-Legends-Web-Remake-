#!/usr/bin/env python3
"""Audit probable skeleton transforms in a locally supplied TMNT Legends APKM.

Writes metadata only; does not redistribute original game assets.
"""
import argparse,io,json,math,struct,zipfile
from pathlib import Path
from export_mesh_glb import records,resource

def analyze(data):
    if len(data)<124:return None
    count,header_size=struct.unpack_from('<2I',data)
    if not 1<=count<=500 or header_size!=20 or len(data)-24-100*count not in (0,4):return None
    links=[];errors=[];hashes=[]
    for i in range(count):
        start=24+100*i
        identifier,link=struct.unpack_from('<2I',data,start)
        matrix=struct.unpack_from('<16f',data,start+8)
        xyzquat=struct.unpack_from('<7f',data,start+72)
        if not all(math.isfinite(x) for x in matrix+xyzquat):return None
        if max(abs(a-b) for a,b in zip((matrix[3],matrix[7],matrix[11],matrix[15]),(0,0,0,1)))>.02:return None
        links.append(link);hashes.append(identifier)
        errors.append(abs(math.sqrt(sum(q*q for q in xyzquat[3:]))-1))
    return {'joints':count,'root_markers':links.count(255),'link_values':sorted(set(links)),
            'all_links_in_range_or_255':all(v==255 or v<count for v in links),
            'unique_joint_ids':len(set(hashes)),
            'max_quaternion_unit_error':max(errors)}

def scan(apkm):
    report=[]
    with zipfile.ZipFile(apkm) as outer:
        with zipfile.ZipFile(io.BytesIO(outer.read('base.apk'))) as apk:
            for name in apk.namelist():
                if not name.endswith('.dhr'):continue
                h=apk.read(name);d=apk.read(name[:-4]+'.dsb')
                for index,r in enumerate(records(h)):
                    if r[0]!=0xddd8a92a:continue
                    result=analyze(resource(h,d,r))
                    if result:report.append({'bundle':Path(name).stem,'resource_index':index,**result})
    return report

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('apkm',type=Path)
    p.add_argument('--out',type=Path,default=Path('skeleton_report.json'))
    args=p.parse_args();report=scan(args.apkm)
    args.out.write_text(json.dumps(report,indent=2),encoding='utf-8')
    print('Validated skeleton candidates:',len(report))
