# Reverse engineering checkpoint — October 2026

## Original package findings

The user-provided Android APKM contains 36 LPKG bundle pairs. The resource directory is decoded; static meshes and ETC1 textures can be extracted locally. The base APK is **not a complete game asset archive**: some character bundles are absent, and the game may have originally downloaded additional content.

## Animation investigation

Resource kind `0x9cfb296b` occurs in large numbers in character bundles. Many payloads have lengths divisible by 12. The new `tools/scan_animation_candidates.py` tests a narrow hypothesis: each 12-byte tuple begins with a monotonically increasing uint32 index and is followed by two finite float32 values.

On the supplied APKM, **5,479 records** satisfy this structural test, including:
- Leonardo: 1,177
- Karai: 970
- Newtralizer: 949
- Kraang Droid: 239
- Traag: 142

**Important:** These are candidate structured streams, not verified animation tracks. They may encode packed keyframes, transforms, timelines, or unrelated resource data. Their semantic format, bone mapping, time units, and interpolation are not established. No rigged or animated model has been recovered.

## Browser remake

- Added `src/BattleArena3D.tsx` with a real Three.js-rendered scene, orbit controls, mobile pointer targeting, active turn ring and synchronized HP indicators.
- The arena deliberately uses procedural placeholder figures. This is **not** a recreation of the original characters or arena.
- `src/ModelViewer.tsx` remains a local-only viewer for GLB models exported from user-provided files.

## Next validation gates

1. Identify metadata linking the 12-byte records to bones, named clips, or a skeleton hierarchy.
2. Decode inverse bind matrices and joint indices/weights, if present.
3. Export a test animation to glTF and verify playback against known poses.
4. Identify missing downloaded bundles before claiming complete character coverage.
5. Test GitHub Pages deployment and device performance.
