#!/usr/bin/env python3
"""Probe section offsets and numerical patterns in mesh auxiliary resources.

Only reports observations; never assumes bone weights without verification.
"""
import argparse,io,json,struct,zipfile
from pathlib import Path
from collections import Counter
from export_mesh_glb import records,resource

def inspect(data):
    if len(data)<256:return None
    h=struct.unpack_from('<8I',data)
    first=next((i for i in range(32,len(data)-3,4) if data[i:i+4]!=b'\0'*4),None)
    if first is None:return None
    candidates=[]
    for i in range(first,min(first+256,len(data)-4),4):
        value=struct.unpack_from('<I',data,i)[0]
        if value>=len(data):break
        candidates.append(value)
    chunks=[]
    for off in [first,512,1024,4096,8192,16384,32768,65536,90000]:
        if off+64>len(data):continue
        raw=data[off:off+64]
        floats=struct.unpack('<16f',raw)
        chunks.append({'offset':off,'u16_min_max':[min(struct.unpack('<32H',raw)),max(struct.unpack('<32H',raw))],
                       'finite_floats':sum(v==v and abs(v)<1e10 for v in floats),
                       'floats_in_0_1':sum(0<=v<=1 for v in floats),
                       'hex_preview':raw[:16].hex()})
    return {'header_u32':h,'bytes':len(data),'first_nonzero_after_header':first,
            'offset_table_candidates':candidates[:32],'sample_windows':chunks}

def scan(apkm,bundles):
    output=[]
    with zipfile.ZipFile(apkm) as z,zipfile.ZipFile(io.BytesIO(z.read('base.apk'))) as a:
        for bundle in bundles:
            h=a.read('assets/'+bundle+'.dhr');d=a.read('assets/'+bundle+'.dsb')
            for i,r in enumerate(records(h)):
                if r[0]!=0xcb2079d4:continue
                result=inspect(resource(h,d,r))
                if result:output.append({'bundle':bundle,'record':i,**result})
    return output
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('apkm',type=Path)
    p.add_argument('--bundles',nargs='+',default=['leonardo','karai_human','kraang_droid','newtralizer','norman','traag'])
    p.add_argument('--out',type=Path,default=Path('aux_sections.json'))
    a=p.parse_args();result=scan(a.apkm,a.bundles)
    a.out.write_text(json.dumps(result,indent=2))
    print('Inspected',len(result),'auxiliary mesh buffers')
