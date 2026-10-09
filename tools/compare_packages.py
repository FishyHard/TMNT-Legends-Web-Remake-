#!/usr/bin/env python3
"""Compare all DHR/DSB pairs in a user-supplied APKM without exporting assets."""
import argparse
import io
import json
import struct
import zipfile
from pathlib import Path

SIGNATURES = {
    "png": b"\x89PNG\r\n\x1a\n",
    "ktx": b"\xabKTX",
    "glb": b"glTF",
    "dds": b"DDS ",
}

def inspect(path):
    with zipfile.ZipFile(path) as container:
        with zipfile.ZipFile(io.BytesIO(container.read("base.apk"))) as apk:
            names = set(apk.namelist())
            pairs = []
            for header_path in sorted(p for p in names if p.endswith(".dhr")):
                data_path = header_path[:-4] + ".dsb"
                if data_path not in names:
                    continue
                h, d = apk.read(header_path), apk.read(data_path)
                pairs.append({
                    "name": header_path.split("/")[-1][:-4],
                    "header_size": len(h),
                    "data_size": len(d),
                    "header_magic": h[4:8].decode("ascii", "replace"),
                    "header_type": h[12:16].decode("ascii", "replace"),
                    "data_magic": d[4:8].decode("ascii", "replace"),
                    "data_type": d[12:16].decode("ascii", "replace"),
                    "matching_package_identifier": h[40:44] == d[16:20],
                    "matching_16_byte_value": h[96:112] == d[32:48],
                    "embedded_signatures": {name: d.find(sig) for name, sig in SIGNATURES.items()},
                    "header_first_24_words": list(struct.unpack_from("<24I", h, 0)),
                    "data_first_24_words": list(struct.unpack_from("<24I", d, 0)),
                })
            return {
                "pair_count": len(pairs),
                "all_package_ids_match": all(p["matching_package_identifier"] for p in pairs),
                "all_16_byte_values_match": all(p["matching_16_byte_value"] for p in pairs),
                "pairs": pairs,
            }

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("apkm", type=Path)
    parser.add_argument("--out", type=Path, default=Path("package-comparison.json"))
    args = parser.parse_args()
    result = inspect(args.apkm)
    args.out.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(f"Analyzed {result['pair_count']} package pairs. Report: {args.out}")
