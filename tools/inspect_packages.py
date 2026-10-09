#!/usr/bin/env python3
"""Read-only inventory of TMNT Legends APKM game resource pairs.

Usage: python tools/inspect_packages.py path/to/game.apkm --out report.json
Does not extract or redistribute copyrighted assets.
"""
import argparse
import io
import json
import struct
import zipfile
from pathlib import Path

def inspect(apkm: Path):
    with zipfile.ZipFile(apkm) as outer:
        with zipfile.ZipFile(io.BytesIO(outer.read("base.apk"))) as apk:
            names = set(apk.namelist())
            pairs = []
            for name in sorted(n for n in names if n.endswith(".dhr")):
                data_name = name[:-4] + ".dsb"
                if data_name not in names:
                    continue
                header = apk.read(name)
                data = apk.read(data_name)
                pairs.append({
                    "name": name.rsplit("/", 1)[-1][:-4],
                    "header_bytes": len(header),
                    "data_bytes": len(data),
                    "header_prefix_hex": header[:96].hex(),
                    "data_prefix_hex": data[:96].hex(),
                    "header_lpkg_offset": header.find(b"LPKG"),
                    "header_hdr_offset": header.find(b"HDR"),
                    "data_lpkg_offset": data.find(b"LPKG"),
                    "data_sdat_offset": data.find(b"SDAT"),
                    "header_first_16_u32_le": list(struct.unpack_from("<16I", header, 0)) if len(header) >= 64 else [],
                    "data_first_16_u32_le": list(struct.unpack_from("<16I", data, 0)) if len(data) >= 64 else [],
                })
            return {"source_file": apkm.name, "pairs": pairs, "pair_count": len(pairs)}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("apkm", type=Path)
    parser.add_argument("--out", type=Path, default=Path("package-report.json"))
    args = parser.parse_args()
    report = inspect(args.apkm)
    args.out.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Inspected {report['pair_count']} pairs -> {args.out}")

if __name__ == "__main__":
    main()
