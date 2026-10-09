# Leonardo geometry candidate investigation

Using the validated 24-byte directory, neighboring resources in `leonardo.dsb` were inspected (offsets resolved using `tools/extract_resources.py`).

| Record index | Kind hash | Storage | Bytes | Observation |
|---|---|---:|---:|---|
| 1648 | `ddd8a92a` | 0 | 5,424 | Contains 4×4 identity-like float matrices |
| 1649 | `adf3f363` | 1 | 131,139 | Valid PVR v3 texture, 512×512 |
| 1653 | `7cbe7595` | 0 | 124 | Structured numeric metadata |
| 1654 | `adf3f363` | 0 | 133,404 | Float-heavy buffer; candidate vertex data |
| 1655 | `0e6a7b89` | 0 | 164 | Structured metadata with several sizes/counts |
| 1656 | `cb2079d4` | 0 | 101,752 | Candidate geometry/index data |
| 1657 | `5a0e3722` | 0 | 52 | Contains float values consistent with bounding information |

The 1649 texture has a verified PVR v3 header. **No 3D geometry has yet been structurally validated**, so the other descriptions are hypotheses, not confirmed formats.

## Investigation next

- Correlate record 1655 integer fields with lengths/strides of 1654 and 1656.
- Check whether 1654 contains interleaved position, normal, UV, tangent and color streams.
- Check whether 1656 contains an index buffer, mesh groups, or another serialization format.
- Verify geometry with finite float bounds, index range constraints, and triangle winding.
- Only export glTF after these checks pass.

Original resource data is not committed to this public repository.
