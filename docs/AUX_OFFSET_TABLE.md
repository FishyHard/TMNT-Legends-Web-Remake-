# Auxiliary mesh offset table decoded structurally

Verified against the locally supplied TMNT Legends APKM.

Every one of the 11 inspected resources of kind `0xcb2079d4` begins with a 200-byte mostly zero header region. At **byte offset 200** there are **10 monotonically nondecreasing uint32 offsets** into the resource. Their first value is always **264**, and the remaining offsets vary with the mesh size.

| Bundle | Resource | First 3 offsets | Last offset | Resource length |
| --- | ---: | --- | ---: | ---: |
| Leonardo | 1656 | 264, 364, 464 | 88612 | 101752 |
| Karai | 1334 | 264, 340, 416 | 48320 | 55224 |
| Kraang Droid | 517 | 264, 336, 408 | 21648 | 25008 |
| Newtralizer | 1490 | 264, 348, 432 | 67588 | 77376 |
| Norman | 725 | 264, 336, 408 | 36872 | 42560 |
| Traag | 751 | 264, 348, 432 | 111700 | 124752 |

For Leonardo the full offset table is:

```
264, 364, 464, 25468, 31640, 38088, 50988, 75992, 82164, 88612
```

The difference between offsets 464 and 25468 is **25,004 bytes**. Another identical 25,004-byte region appears between 50,988 and 75,992. Other sections appear in repeated pairs. These are likely structured per-LOD or per-influence arrays, but their semantics have **not** been proven.

The resource header's second uint32 equals the matching original mesh vertex count, e.g. Leonardo 3,088. The first uint32 (52 for Leonardo) is near the candidate skeleton joint count (54). This is a strong association, not proof of skinning.

## Follow-up validation

1. Parse and compare corresponding paired sections byte-for-byte.
2. Test each section as float32, uint16 and packed 8-bit values.
3. Compare section element counts against declared vertex count, triangle count and skeleton joint count.
4. Establish bone indices and normalized weights before constructing a skinned glTF.
