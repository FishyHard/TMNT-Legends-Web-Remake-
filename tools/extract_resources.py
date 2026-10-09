#!/usr/bin/env python3
"""Inspect or locally extract resources from a user-provided TMNT Legends APKM.
Do not redistribute copyrighted game assets without permission.
"""
import argparse
import io
import json
import struct
import zipfile
from collections import Counter
from pathlib import Path

PVR3 = b"PVR\x03"

def records(header):
    if len(header) < 168 or header[4:8] != b"LPKG" or header[12:15] != b"HDR":
        raise ValueError("Invalid DHR header")
    count = struct.unpack_from("<I", header, 160)[0]
    if count > (len(header) - 168) // 24:
        raise ValueError("Resource count exceeds header length")
    return [struct.unpack_from("<6I", header, 168 + i * 24) for i in range(count)]

def inspect(apkm, output, extract=False):
    output.mkdir(parents=True, exist_ok=True)
    manifest = []
    with zipfile.ZipFile(apkm) as archive:
        with zipfile.ZipFile(io.BytesIO(archive.read("base.apk"))) as apk:
            names = set(apk.namelist())
            for header_path in sorted(x for x in names if x.endswith(".dhr")):
                data_path = header_path[:-4] + ".dsb"
                if data_path not in names:
                    continue
                h, d = apk.read(header_path), apk.read(data_path)
                if d[4:8] != b"LPKG" or d[12:16] != b"SDAT":
                    raise ValueError("Invalid data package: " + data_path)
                if h[40:44] != d[16:20] or h[96:112] != d[32:48]:
                    raise ValueError("Package identifier mismatch: " + header_path)
                bundle = header_path.rsplit("/", 1)[-1][:-4]
                secondary_base = struct.unpack_from("<I", h, 0x50)[0]
                secondary_size = struct.unpack_from("<I", h, 0x54)[0]
                for index, (kind, resource_id, storage, reserved, offset, length) in enumerate(records(h)):
                    # Storage 0/2 use the first data section; storage 1 normally uses the secondary section.
                    base = secondary_base if storage == 1 and secondary_size else 48
                    start, end = base + offset, base + offset + length
                    if not 0 <= start <= end <= len(d):
                        raise ValueError(f"Out-of-range record {bundle}:{index}")
                    payload = d[start:end]
                    is_pvr = payload.startswith(PVR3)
                    item = {"bundle": bundle, "index": index, "kind": f"{kind:08x}",
                            "resource_id": f"{resource_id:08x}", "storage": storage,
                            "offset": offset, "length": length, "absolute_offset": start,
                            "pvr_v3": is_pvr}
                    if is_pvr and len(payload) >= 52:
                        (_, flags, pixel_format, color_space, channel_type, height, width,
                         depth, surfaces, faces, mipmaps, metadata_size) = struct.unpack_from("<IIQ9I", payload)
                        item["texture"] = {"width": width, "height": height, "depth": depth,
                                           "faces": faces, "mipmaps": mipmaps,
                                           "pixel_format": f"{pixel_format:016x}"}
                    if extract and is_pvr:
                        folder = output / bundle
                        folder.mkdir(exist_ok=True)
                        filename = f"{index:05d}_{resource_id:08x}.pvr"
                        (folder / filename).write_bytes(payload)
                        item["local_file"] = str(Path(bundle) / filename)
                    manifest.append(item)
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    summary = {"resources": len(manifest), "pvr_textures": sum(x["pvr_v3"] for x in manifest),
               "storage_types": dict(Counter(str(x["storage"]) for x in manifest))}
    print(json.dumps(summary, indent=2))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("apkm", type=Path)
    parser.add_argument("--out", type=Path, default=Path("tmnt-resources"))
    parser.add_argument("--extract", action="store_true", help="Write PVR textures locally")
    args = parser.parse_args()
    inspect(args.apkm, args.out, args.extract)
