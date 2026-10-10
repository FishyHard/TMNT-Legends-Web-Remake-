# Vertex colors and animation candidate audit — October 10, 2026

Reproducible local command:

```bash
python tools/audit_vertex_curves.py game.apkm --out vertex_curve_audit.json
```

## Mesh vertex format

The 36-byte mesh stride is:
- offset 0: XYZ (3 × float32)
- offset 12: normal (3 × float32)
- offset 24: **RGBA color (4 × uint8)**
- offset 28: UV (2 × float32)

For Leonardo, 3,071 / 3,088 vertices have RGBA `ffffffff`, 9 have `686868ff`, and 8 have `a4a4a4ff`. This strongly supports vertex-color interpretation and rules out treating this four-byte field as meaningful per-vertex joint indices.

## Validated inventory for six character bundles

| Bundle | Matching 36-byte mesh buffers | Sequential 12-byte candidate streams |
| --- | ---: | ---: |
| Leonardo | 1 | 1,177 |
| Karai | 3 | 970 |
| Kraang Droid | 5 | 239 |
| Newtralizer | 4 | 949 |
| Norman | 3 | 260 |
| Traag | 1 | 142 |
| **Total** | **17** | **3,737** |

Some of these 17 mesh buffers are small mesh components, not full characters. The 12-byte streams contain sequential uint32 sample indices and two finite floats, often varying smoothly; this does **not** prove they are animation curves. No clip duration, bone binding, interpolation or frame rate has been verified.

## Remake update

The Three.js battle arena supports local-only GLB imports for **any of the six fighters**, rather than Leonardo only. Choose the fighter and select a local GLB. This permits testing original recovered models in the running arena without committing or hosting original assets.

The imported geometry is static. Original rigging, animation and correct model-component assembly remain outstanding.
