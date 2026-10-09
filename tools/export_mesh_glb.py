#!/usr/bin/env python3
"""Export validated original meshes from a user-provided APKM as GLB. Never redistribute assets."""
import argparse, io, json, math, struct, zipfile
from pathlib import Path

def records(h):
    n=struct.unpack_from('<I',h,160)[0]
    if h[4:8]!=b'LPKG' or 168+24*n>len(h): raise ValueError('Bad resource directory')
    return [struct.unpack_from('<6I',h,168+24*i) for i in range(n)]

def resource(h,d,r):
    kind,identifier,storage,reserved,offset,length=r
    base=struct.unpack_from('<I',h,80)[0] if storage==1 and struct.unpack_from('<I',h,84)[0] else 48
    start=base+offset
    if start+length>len(d): raise ValueError('Resource outside DSB')
    return d[start:start+length]

def parse(meta,raw):
    _,vb,nv,_,ib,ni,mode,nt=struct.unpack_from('<8I',meta)
    if mode!=3 or vb!=nv*36 or ib!=ni*2 or ni!=nt*3 or len(raw)!=vb+ib:
        raise ValueError('Unsupported mesh layout')
    pos=[];normal=[];uv=[]
    for i in range(nv):
        p=i*36
        xyz=struct.unpack_from('<3f',raw,p)
        n=struct.unpack_from('<3f',raw,p+12)
        t=struct.unpack_from('<2f',raw,p+28)
        if not all(math.isfinite(v) for v in xyz+n+t) or abs(sum(v*v for v in n)-1)>.05:
            raise ValueError('Invalid vertex')
        pos.extend(xyz);normal.extend(n);uv.extend(t)
    idx=struct.unpack_from('<'+str(ni)+'H',raw,vb)
    if max(idx)>=nv or any(len(set(idx[i:i+3]))!=3 for i in range(0,ni,3)):
        raise ValueError('Invalid triangle indices')
    return pos,normal,uv,idx

def glb(mesh,out):
    pos,norm,uv,indices=mesh
    blob=bytearray();views=[];accessors=[]
    def add(data,component,typ,count,target,limits=None):
        blob.extend(b'\0'*(-len(blob)%4));start=len(blob);blob.extend(data)
        v=len(views);views.append({'buffer':0,'byteOffset':start,'byteLength':len(data),'target':target})
        a={'bufferView':v,'componentType':component,'type':typ,'count':count}
        if limits: a['min'],a['max']=limits
        accessors.append(a);return len(accessors)-1
    xyz=list(zip(*(iter(pos),)*3))
    bounds=([min(p[i] for p in xyz) for i in range(3)],[max(p[i] for p in xyz) for i in range(3)])
    p=add(struct.pack('<'+str(len(pos))+'f',*pos),5126,'VEC3',len(xyz),34962,bounds)
    n=add(struct.pack('<'+str(len(norm))+'f',*norm),5126,'VEC3',len(xyz),34962)
    t=add(struct.pack('<'+str(len(uv))+'f',*uv),5126,'VEC2',len(xyz),34962)
    ix=add(struct.pack('<'+str(len(indices))+'H',*indices),5123,'SCALAR',len(indices),34963)
    doc={'asset':{'version':'2.0','generator':'LPKG mesh decoder'},'buffers':[{'byteLength':len(blob)}],
         'bufferViews':views,'accessors':accessors,'materials':[{'doubleSided':True}],
         'meshes':[{'primitives':[{'attributes':{'POSITION':p,'NORMAL':n,'TEXCOORD_0':t},'indices':ix,'material':0}]}],
         'nodes':[{'mesh':0}],'scenes':[{'nodes':[0]}],'scene':0}
    js=json.dumps(doc,separators=(',',':')).encode();js+=b' '*(-len(js)%4)
    blob.extend(b'\0'*(-len(blob)%4))
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_bytes(struct.pack('<4sII',b'glTF',2,28+len(js)+len(blob))+struct.pack('<I4s',len(js),b'JSON')+js+struct.pack('<I4s',len(blob),b'BIN\0')+blob)
    return {'vertices':len(xyz),'triangles':len(indices)//3,'bounds':bounds,'file':str(out)}

def export(apkm,bundle,out):
    with zipfile.ZipFile(apkm) as z:
        with zipfile.ZipFile(io.BytesIO(z.read('base.apk'))) as a:
            hp=next(n for n in a.namelist() if n.endswith('/'+bundle+'.dhr'))
            h,d=a.read(hp),a.read(hp[:-4]+'.dsb')
    if h[40:44]!=d[16:20] or h[96:112]!=d[32:48]:raise ValueError('Mismatched packages')
    rs=records(h);found=[]
    for i in range(1,len(rs)):
        if rs[i][0]!=0x0e6a7b89 or rs[i-1][0]!=0xadf3f363:continue
        try:found.append((i,parse(resource(h,d,rs[i]),resource(h,d,rs[i-1]))))
        except (ValueError,struct.error):pass
    if not found:raise ValueError('No validated mesh found')
    return [glb(mesh,out if len(found)==1 else out.with_name(out.stem+'_'+str(i)+'.glb')) for i,mesh in found]

if __name__=='__main__':
    a=argparse.ArgumentParser();a.add_argument('apkm',type=Path)
    a.add_argument('--bundle',default='leonardo');a.add_argument('--out',type=Path,default=Path('leonardo.glb'))
    args=a.parse_args();print(json.dumps(export(args.apkm,args.bundle,args.out),indent=2))
