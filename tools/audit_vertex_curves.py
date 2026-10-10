#!/usr/bin/env python3
"""Audit vertex RGBA channels and candidate animation curves in a locally supplied APKM."""
import argparse,collections,io,json,math,struct,zipfile
from pathlib import Path
from export_mesh_glb import records,resource

def audit(apkm,bundles):
    report=[]
    with zipfile.ZipFile(apkm) as outer,zipfile.ZipFile(io.BytesIO(outer.read('base.apk'))) as apk:
        for bundle in bundles:
            h=apk.read('assets/'+bundle+'.dhr');d=apk.read('assets/'+bundle+'.dsb');rs=records(h)
            meshes=[];curves=[]
            for i,r in enumerate(rs):
                if r[0]==0x0e6a7b89 and i and rs[i-1][0]==0xadf3f363:
                    meta=resource(h,d,r);buf=resource(h,d,rs[i-1])
                    if len(meta)<32:continue
                    words=struct.unpack_from('<8I',meta)
                    if words[2]<3 or words[1]!=words[2]*36 or len(buf)<words[1]:continue
                    colors=collections.Counter(buf[j*36+24:j*36+28].hex() for j in range(words[2]))
                    meshes.append({'record':i-1,'vertices':words[2],'rgba_unique':len(colors),'rgba_top':colors.most_common(8)})
                elif r[0]==0x9cfb296b and r[5]>=36 and r[5]%12==0:
                    data=resource(h,d,r);n=len(data)//12
                    if any(struct.unpack_from('<I',data,j*12)[0]!=j for j in range(n)):continue
                    samples=[struct.unpack_from('<2f',data,j*12+4) for j in range(n)]
                    if not all(math.isfinite(v) for pair in samples for v in pair):continue
                    a,b=zip(*samples)
                    curves.append({'record':i,'samples':n,'ranges':[[min(a),max(a)],[min(b),max(b)]],'first_three':samples[:3]})
            report.append({'bundle':bundle,'meshes':meshes,'sequential_stream_count':len(curves),'sample_streams':curves[:8]})
    return report
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('apkm',type=Path)
    p.add_argument('--bundles',nargs='+',default=['leonardo','karai_human','kraang_droid','newtralizer','norman','traag'])
    p.add_argument('--out',type=Path,default=Path('vertex_curve_audit.json'))
    a=p.parse_args();data=audit(a.apkm,a.bundles);a.out.write_text(json.dumps(data,indent=2))
    print('Bundles',len(data),'meshes',sum(len(x['meshes']) for x in data),'candidate streams',sum(x['sequential_stream_count'] for x in data))
