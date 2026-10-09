#!/usr/bin/env python3
"""Decode a local PVR v3 ETC1 texture to PNG. Requires Pillow; do not publish game assets."""
import argparse,struct
from pathlib import Path
from PIL import Image

TABLES=((2,8,-2,-8),(5,17,-5,-17),(9,29,-9,-29),(13,42,-13,-42),
        (18,60,-18,-60),(24,80,-24,-80),(33,106,-33,-106),(47,183,-47,-183))
def sign3(v):return v-8 if v>=4 else v
def clamp(v):return max(0,min(255,v))
def block(raw):
    hi,lo=struct.unpack('>II',raw)
    flip=hi&1
    if (hi>>1)&1:
        a=((hi>>27)&31,(hi>>19)&31,(hi>>11)&31)
        b=tuple(v+sign3((hi>>shift)&7) for v,shift in zip(a,(24,16,8)))
        if any(v<0 or v>31 for v in b):raise ValueError('Bad differential ETC1 block')
        colors=[tuple((v<<3)|(v>>2) for v in c) for c in (a,b)]
    else:
        colors=[tuple((hi>>s)&15 for s in shifts) for shifts in ((28,20,12),(24,16,8))]
        colors=[tuple((v<<4)|v for v in c) for c in colors]
    t0=(hi>>5)&7;t1=(hi>>2)&7
    result=[]
    for y in range(4):
        for x in range(4):
            i=x*4+y;code=(((lo>>(i+16))&1)<<1)|((lo>>i)&1)
            sub=(y>=2) if flip else (x>=2)
            delta=TABLES[t1 if sub else t0][code]
            result.append(tuple(clamp(v+delta) for v in colors[int(sub)]))
    return result

def convert(path,out):
    data=path.read_bytes()
    if data[:4]!=b'PVR\x03':raise ValueError('Not PVR v3')
    _,flags,fmt,cs,ct,h,w,depth,surfaces,faces,mips,meta=struct.unpack_from('<IIQ9I',data)
    if fmt!=6 or depth!=1 or surfaces!=1 or faces!=1:
        raise ValueError('Only ETC1 RGB 2D textures supported')
    start=52+meta;bw=(w+3)//4;bh=(h+3)//4
    if len(data)<start+bw*bh*8:raise ValueError('Truncated texture')
    im=Image.new('RGB',(w,h));px=im.load()
    for by in range(bh):
        for bx in range(bw):
            colors=block(data[start+(by*bw+bx)*8:start+(by*bw+bx+1)*8])
            for y in range(4):
                for x in range(4):
                    if bx*4+x<w and by*4+y<h:px[bx*4+x,by*4+y]=colors[y*4+x]
    out.parent.mkdir(parents=True,exist_ok=True);im.save(out)
    return (w,h)
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('pvr',type=Path)
    p.add_argument('--out',type=Path,default=Path('texture.png'))
    a=p.parse_args();print(convert(a.pvr,a.out))
