# Skeleton quaternion validation — 2026-10-10

The user-provided TMNT Legends 1.30.1 APKM was re-analyzed with `tools/audit_skeleton_quaternions.py`.

## Independently checked binary layout

A resource of type `0xddd8a92a` contains:
- A 24-byte header with a candidate joint count at offset 0 and value 20 at offset 4.
- One 100-byte record per joint.
- Each record has a uint32 identifier, uint32 link/index candidate, 16 float32 affine matrix values, then **7 float32 values**.
- The last seven values separate into three position-like values and **four unit-length quaternion components**.

Across the six character samples checked, the maximum quaternion norm errors were:

| Bundle | Joints | Maximum abs(norm - 1) |
| --- | ---: | ---: |
| Leonardo | 54 | 0.000000060 |
| Karai | 42 | 0.000000113 |
| Kraang Droid | 41 | 0.000000075 |
| Newtralizer | 45 | 0.000000747 |
| Norman | 42 | 0.000000101 |
| Traag | 45 | 0.000000069 |

**20 candidate skeleton resources** passed the structural checks across the APKM.

This is strong evidence of a rotation quaternion field. The parent/link value is not yet proven to encode a hierarchy, and the 16-float matrix and 7-float transform do not simply agree under a naive axis permutation. Do **not** claim a working skinned rig or animation yet.

## Browser progress

The procedural Three.js battle arena now accepts a user-selected local GLB to replace Leonardo's stand-in geometry. This lets the recovered model appear **inside the battle scene**, without publishing original copyrighted meshes or textures. The model is still static and does not animate.

## Key remaining work

1. Identify what the joint link/index field means.
2. Establish the transform coordinate conventions.
3. Find per-vertex bone indices and skin weights.
4. Resolve 12-byte sampled data into actual named animation tracks.
5. Build rigged glTF with verifiable playback.
