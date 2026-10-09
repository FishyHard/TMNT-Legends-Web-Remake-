#!/usr/bin/env python3
"""Find candidate keyframe streams in original user-supplied game data.

Heuristic only: matching frame numbers does NOT prove these are animations.
"""
import argparse,io,json,math,struct,zipfile
from pathlib import Path
from export_mesh_glb import records,resource

def scan(apkm):
 output=[]
 with zipfile.ZipFile(apkm) as z,zipfile.ZipFile(io.BytesIO(z.read('base.apk'))) as a:
  for name in a.namelist():
   if not name.endswith('.dhr'):continue
   h=a.read(name);d=a.read(name[:-4]+'.dsb');rs=records(h)
   candidates=0;examples=[];total=0
   for i,r in enumerate(rs):
    if r[0]!=0x9cfb296b or r[5]<24 or r[5]%12:continue
    total+=1;data=resource(h,d,r);n=len(data)//12
    frames=[struct.unpack_from('<I',data,j*12)[0] for j in range(n)]
    if frames!=list(range(n)):continue
    vals=[struct.unpack_from('<2f',data,j*12+4) for j in range(n)]
    if not all(math.isfinite(v) for pair in vals for v in pair):continue
    candidates+=1
    if len(examples)<3:examples.append({'record':i,'samples':n,'first_float_pair':vals[0]})
   output.append({'bundle':name.rsplit('/',1)[-1][:-4],
                  'records_of_kind':total,'sequential_12_byte_records':candidates,
                  'examples':examples})
 return output

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('apkm',type=Path)
 p.add_argument('--out',type=Path,default=Path('track_scan.json'))
 args=p.parse_args();result=scan(args.apkm)
 args.out.write_text(json.dumps(result,indent=2))
 print('Candidate records:',sum(r['sequential_12_byte_records'] for r in result))
