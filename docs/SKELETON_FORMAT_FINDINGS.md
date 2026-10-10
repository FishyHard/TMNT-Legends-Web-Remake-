# Skeleton candidate format — verified structural observations

Analysis of the user-provided TMNT Legends 1.30.1 APKM found **20 resources** of kind `0xddd8a92a` that fit a recurring matrix layout.

## Candidate structure

- 24-byte resource header; first uint32 is a candidate joint count.
- Then `joint_count` records of **100 bytes** each.
- Some resources have 4 trailing bytes.
- Each record starts with a 32-bit identifier/hash and a 32-bit link/index candidate.
- Next 64 bytes parse as a finite 4×4 float32 affine transform with homogeneous last column `(0,0,0,1)` in row-major interpretation.
- The final 28 bytes are **not decoded**.

Counts for character bundles: Leonardo **54**, Karai **42**, Newtralizer **45**, Kraang Droid **41**, Norman **42**, Traag **45**, Footbot **49**. Several VFX resources also fit this layout.

The 32-bit link/index candidate is `255` for one root-like entry and otherwise in range for all tested character bundles. However, it is usually zero, so its meaning as a parent index is **unconfirmed**. The matrices could be inverse bind matrices or another transform type; this is not yet proven.

Use `python tools/scan_skeletons.py game.apkm --out skeleton_candidates.json` to reproduce the analysis locally.

## Animation candidate streams

`tools/scan_animation_candidates.py` identifies **5,479** records of kind `0x9cfb296b` that fit a 12-byte repeated tuple structure beginning with a sequential uint32. This is **not yet a validated animation format**. Avoid exporting fabricated glTF animations.

## Browser work

The web prototype now includes `src/BattleArena3D.tsx`: a Three.js battle scene with lighting, mobile camera controls, HP bars, active-turn indicators and fighter selection. Fighters are procedural placeholders, **not original 3D models**. Original model assets remain local-only, with no unauthorized public redistribution.

## Outstanding

Joint hierarchy, bind poses, skin weights, animation keyframes, material binding, original arena, additional downloaded asset packs, and full game systems remain unresolved.
