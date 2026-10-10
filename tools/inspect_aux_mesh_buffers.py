#!/usr/bin/env python3
"""Inspect additional mesh-associated buffers in user-supplied TMNT APKM.

This script deliberately does not guess bone weights from unknown fields.
"""
import argparse,io,json,struct,zipfile
from pathlib import Path
from export_mesh_glb import records,resource

def scan(apkm,bundles):
 out=[]
 with zipfile.ZipFile(apkm) as outer,zipfile.ZipFile(io.BytesIO(outer.read('base.apk'))) as apk:
  for bundle in bundles:
   h=apk.read('assets/'+bundle+'.dhr');d=apk.read('assets/'+bundle+'.dsb')
   rs=records(h)
   for i,r in enumerate(rs):
    if r[0]!=0xcb2079d4:continue
    raw=resource(h,d,r)
    if len(raw)<32:continue
    header=struct.unpack_from('<8I',raw)
    declared=header[1]
    if declared>100000:continue
    out.append({'bundle':bundle,'record':i,'length':len(raw),
                'header_u32':list(header),
                'declared_vertex_count':declared,
                'length_per_vertex':round(len(raw)/declared,4) if declared else None,
                'nonzero_bytes':sum(bool(x) for x in raw),
                'zero_prefix_after_header':next((j-32 for j in range(32,len(raw)) if raw[j]),len(raw)-32),
                'nearby_record_types':[f'{x[0]:08x}' for x in rs[max(0,i-3):i+4]]})
 return out

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument('apkm',type=Path)
 p.add_argument('--bundles',nargs='+',default=['leonardo','karai_human','kraang_droid','newtralizer','norman','traag'])
 p.add_argument('--out',type=Path,default=Path('aux_mesh_buffers.json'))
 args=p.parse_args()
 report=scan(args.apkm,args.bundles)
 args.out.write_text(json.dumps(report,indent=2))
 print('Associated buffers:',len(report))
