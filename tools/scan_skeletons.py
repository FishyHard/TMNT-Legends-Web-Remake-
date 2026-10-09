#!/usr/bin/env python3
"""Inspect probable 100-byte skeletal records from a user-supplied APKM."""
import argparse,io,json,math,struct,zipfile
from pathlib import Path
from export_mesh_glb import records,resource

def scan(apkm):
 report=[]
 with zipfile.ZipFile(apkm) as z,zipfile.ZipFile(io.BytesIO(z.read('base.apk'))) as a:
  for path in a.namelist():
   if not path.endswith('.dhr'):continue
   h=a.read(path);d=a.read(path[:-4]+'.dsb')
   for index,r in enumerate(records(h)):
    if r[0]!=0xddd8a92a:continue
    raw=resource(h,d,r)
    if len(raw)<24:continue
    count=struct.unpack_from('<I',raw,0)[0]
    if not 1<=count<=500 or len(raw)-24-count*100 not in (0,4):continue
    joints=[];valid=True
    for i in range(count):
     off=24+i*100
     identifier,link=struct.unpack_from('<2I',raw,off)
     mat=struct.unpack_from('<16f',raw,off+8)
     if not all(math.isfinite(v) for v in mat):valid=False;break
     if not all(abs(x-y)<.01 for x,y in zip((mat[3],mat[7],mat[11],mat[15]),(0,0,0,1))):valid=False;break
     joints.append({'id_hash':f'{identifier:08x}','link_candidate':link,
                    'matrix_rows':[list(mat[j:j+4]) for j in range(0,16,4)]})
    if valid:report.append({'bundle':path.rsplit('/',1)[-1][:-4],
                            'resource_index':index,'joint_count':count,
                            'trailing_bytes':len(raw)-24-count*100,
                            'links_in_range':all(j['link_candidate']==255 or j['link_candidate']<count for j in joints),
                            'joints':joints})
 return report

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('apkm',type=Path)
 p.add_argument('--out',type=Path,default=Path('skeleton_candidates.json'))
 args=p.parse_args();result=scan(args.apkm)
 args.out.write_text(json.dumps(result,indent=2))
 print('Candidate skeletons:',len(result))
