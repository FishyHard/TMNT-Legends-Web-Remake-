# Validated LPKG resource directory and original textures

## Confirmed on the user-provided TMNT Legends 1.30.1 APKM

- 36 matching `.dhr` / `.dsb` bundles.
- `.dhr` has a resource count at offset **0xA0**, followed by **24-byte records starting at 0xA8**.
- Each record parses as six little-endian unsigned 32-bit integers: `kind, resource_id, storage, reserved, offset, length`.
- Three observed storage values: **0 (19,459 records), 1 (487), 2 (35,039)**.
- For storage 0/2, data offsets are relative to **DSB offset 48**; storage 1 uses the secondary section offset recorded in the DHR at **0x50** when its length at **0x54** is nonzero.
- All **54,985** record ranges validate against their corresponding DSB files with this interpretation.
- **765** resource slices begin with a genuine **PVR v3** texture header (`50 56 52 03`), including **one 512×512 texture in the Leonardo bundle**.
- PVR v3 is a texture container; it does **not** establish that a 3D character mesh has been recovered.

## Local inspection

```bash
python tools/extract_resources.py game.apkm --out tmnt-resources
python tools/extract_resources.py game.apkm --out tmnt-resources --extract
```

The first command writes metadata only. The second extracts PVR texture files **locally**. Do not commit the extracted files to the public repository or deploy them without appropriate rights.

## Next

1. Identify the other resource kind IDs, especially potential meshes and skeletons.
2. Parse PVR headers and pixel formats; use a compatible converter to view textures.
3. Correlate character bundle entries with meshes and animation structures.
4. Convert a validated character mesh and its licensed textures to glTF for the browser renderer.
