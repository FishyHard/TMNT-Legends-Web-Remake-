# Original Leonardo geometry recovered

The user-provided TMNT Legends 1.30.1 APKM contains a mesh resource in the `leonardo` package.

## Verified binary structure

- Resource record **1654** (kind `adf3f363`) contains **111,168 bytes of vertices** followed by **22,236 bytes of 16-bit triangle indices**.
- Record **1655** (kind `0e6a7b89`) declares vertex bytes **111168**, vertex count **3088**, index bytes **22236**, index count **11118**, triangle count **3706**, and primitive mode **3**.
- Vertex stride is **36 bytes**: position (3 float32), normal (3 float32), packed color (uint32), UV (2 float32).
- All 3,088 indices referenced vertices are within range; all normals are unit length; all triangles are nondegenerate.
- Bounds: X -31.417 to 82.536; Y -0.801 to 152.182; Z -88.066 to 88.290.
- Exported local GLB is **122,092 bytes**. Tested loading the GLB with `trimesh`; it reports **3,088 vertices and 3,706 triangles**.

## Reproduction

```bash
python tools/export_mesh_glb.py game.apkm --bundle leonardo --out leonardo.glb
```

Open the resulting GLB using the website's **Original 3D model viewer**. The viewer reads files locally in the browser; it does not upload the model.

## Still outstanding

- Decode original ETC1 PVR texture and map it onto the model.
- Decode skeleton and animations; a static mesh alone is not a complete character.
- Verify orientation, material mapping and visual similarity in a renderer.
- Only distribute the original model/texture with appropriate permission.
