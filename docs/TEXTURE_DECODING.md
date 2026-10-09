# Leonardo texture reconstruction

The original Leonardo PVR v3 texture is **512×512**, **ETC1 RGB** (PVR pixel format 6). The PVR contains 15 bytes of metadata and 131,072 bytes of ETC1 blocks. The 8-byte ETC1 block decoder has been tested against the user-supplied APKM and produces a recognizable Leonardo atlas: green skin, blue bandana, shell and equipment.

## Local steps

1. `python tools/extract_resources.py game.apkm --out tmnt-resources --extract`
2. `pip install pillow`
3. `python tools/decode_etc1.py tmnt-resources/leonardo/01649_b71c430b.pvr --out leonardo.png`
4. `python tools/export_mesh_glb.py game.apkm --bundle leonardo --out leonardo.glb`

To combine a GLB and PNG locally with trimesh:

```python
import trimesh
from PIL import Image
scene = trimesh.load('leonardo.glb')
mesh = next(iter(scene.geometry.values()))
mesh.visual = trimesh.visual.TextureVisuals(
    uv=mesh.visual.uv,
    material=trimesh.visual.material.PBRMaterial(
        baseColorTexture=Image.open('leonardo.png'),
        doubleSided=True, metallicFactor=0, roughnessFactor=1))
scene.export('leonardo_textured.glb')
```

A textured GLB was locally generated and reloaded successfully. Texture orientation and material correctness still require visual comparison in a 3D viewer. The original files are not committed or deployed.
