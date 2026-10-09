# Authentic asset recovery research

## Source
User-supplied TMNT Legends 1.30.1 APKM. The game package is not checked into this repository.

## Verified observations
- Base APK contains 36 matching .dhr/.dsb pairs.
- Leonardo: `assets/leonardo.dhr` is 55,712 bytes; `assets/leonardo.dsb` is 1,576,752 bytes.
- Leonardo .dhr begins `06 00 00 06 4c 50 4b 47` (LPKG at byte 4), and has HDR at byte 12.
- Leonardo .dsb has LPKG at byte 4 and SDAT at byte 12.
- The format has not yet been decoded to a validated mesh, skeleton, texture or animation.

## Next reverse-engineering experiments
1. Compare binary headers across all 36 pairs and identify stable fields and sizes.
2. Identify whether .dhr contains a resource directory with offsets and lengths into .dsb.
3. Check offsets against file boundaries and look for compression markers.
4. Validate a decoded asset by checking vertex/index counts, UV coordinates and texture dimensions.
5. Convert to glTF only after successful structural validation; load in Three.js.
6. Check whether full-resolution assets are separately downloaded by the app.

## Asset provenance
Keep game packages and recovered copyrighted assets out of the public repository. Publishing the original game's models, textures, audio or other copyrighted material requires appropriate permission. Use original or properly licensed assets for a publicly deployed build.

## How to run the inventory
`python tools/inspect_packages.py game.apkm --out package-report.json`

The report contains only structural metadata, not game assets.
