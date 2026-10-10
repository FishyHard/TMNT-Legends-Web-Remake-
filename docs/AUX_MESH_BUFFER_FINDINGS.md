# Mesh-associated auxiliary buffers: first cross-character evidence

Analysis of the user-provided 1.30.1 APKM identifies resource kind `0xcb2079d4` adjacent to validated mesh records. These buffers are **not decoded**. The eight leading uint32 words have a consistent pattern:

| Bundle | Resource | Bytes | First word | Second word |
| --- | ---: | ---: | ---: | ---: |
| Leonardo | 1656 | 101,752 | 52 | 3,088 |
| Karai | 1334 | 55,224 | 40 | 1,759 |
| Kraang Droid | 517 | 25,008 | 38 | 676 |
| Kraang Droid | 521 | 16,560 | 3 | 565 |
| Kraang Droid | 525 | 49,216 | 36 | 2,025 |
| Kraang Droid | 529 | 2,152 | 1 | 78 |
| Newtralizer | 1490 | 77,376 | 43 | 2,485 |
| Norman | 725 | 42,560 | 38 | 1,206 |
| Norman | 729 | 1,832 | 1 | 34 |
| Norman | 733 | 9,688 | 1 | 404 |
| Traag | 751 | 124,752 | 44 | 5,359 |

For Leonardo the second word, **3,088**, exactly matches the vertex count of the preceding original mesh. The first word, **52**, is close to the candidate skeleton's **54** joints. Similar patterns appear across characters.

The remaining header words include two repeated pairs; for Leonardo: `[52, 3088, 1, 2084, 3226, 2, 2084, 3226]`. Inspection of its binary payload reveals multiple structured regions with uint16-like indices, float32-like 3D positions, and values in the [0,1] range. These observations suggest mesh-related auxiliary data, **possibly** optimized geometry or skeletal influence information.

**Do not assume these are skin weights.** The interpretation needs testing against mesh vertex ordering and candidate skeleton joint indices.

Reproduce locally:

```bash
python tools/inspect_aux_mesh_buffers.py game.apkm --out aux_mesh_buffers.json
```

## Browser fixes

- The battle arena's model import selection now uses controlled React state.
- Imported mesh objects are registered for pointer raycasting, allowing a selected local GLB to receive targeting taps.
- The import remains local-only; original copyrighted assets are not uploaded or committed.

## Unresolved

The auxiliary data layout, skeletal parent hierarchy, vertex bone indices/weights, and animation binding remain unknown. No original skinned character animation is working yet.
