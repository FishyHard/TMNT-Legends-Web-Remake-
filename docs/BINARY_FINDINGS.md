# Binary package comparison — 2026-10-10

Inspected the user-provided TMNT Legends v1.30.1 APKM locally. The APKM and its proprietary assets are not committed.

## Verified observations

- All **36** DHR/DSB pairs share a matching 4-byte package identifier: bytes 40–43 of DHR equal bytes 16–19 of DSB.
- All **36** pairs share a matching 16-byte value: bytes 96–111 of DHR equal bytes 32–47 of DSB.
- At offset 4, both formats contain `LPKG`. At offset 12, DHR contains `HDR\\0` and DSB contains `SDAT`.
- None of the 36 DSB packages contains literal PNG, KTX, or glTF magic signatures. This is a **signature scan only**; embedded resources may be compressed, encrypted, or stored in proprietary formats.
- Leonardo DHR size: **55,712 bytes**; DSB size: **1,576,752 bytes**.

## Implications

The shared fields give us cross-file validation when parsing the package directory. They do not yet reveal resource offsets, geometry layouts, or compression. Do not treat arbitrary binary fields as mesh positions.

## Next tests

1. Compare header fields and repeated structures across the 36 files.
2. Establish whether offsets are absolute, relative, virtual, or compressed.
3. Validate candidate entry boundaries against DSB length and content.
4. Identify mesh vertex buffers, indices, UVs, bones, and texture encodings using cross-validation.
5. Export a validated asset to glTF for Three.js only when decoding is confirmed.

Run `python tools/compare_packages.py path/to/game.apkm --out package-comparison.json`.
