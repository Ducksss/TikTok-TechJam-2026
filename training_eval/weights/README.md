# Collaborator residual-head bundle

This directory records the original three-head Drive bundle used by the
selected SynthFlag runtime.

- [Team Drive folder](https://drive.google.com/drive/folders/1YPth1je92IaucRu3f8y50oxlAPcMqXuL)
- [Original three-head bundle](https://drive.google.com/file/d/1NwOQ1hEQqCgVctdoRuwamZYjp832Vkse/view?usp=drivesdk)
- Bundle SHA-256: `7a8acf6823cc08ba5e7a55def6c2147f95456a3e9f94c8d60d199e503208be54`

The exact 3,323,126-byte Drive download is preserved here as
`SynthFlag_TEST1_head_bundle_v1.zip`. Its three path-sanitized head binaries are
also tracked here exactly where the unchanged collaborator verifier expects
them. Identical runtime copies are tracked in `../../weights/`.
`head_bundle_manifest.json` pins the ZIP, distributable hashes,
source-artifact hashes, roles, route weights, and calibration boundary.

The project owner accepts the collaborator's rights-clearance attestation for
the heads and their training inputs. No replacement retraining is required for
this project release under that decision. The attestation is recorded as a
project decision rather than an independent license audit.

The bundle contains no upstream Expert 4 tensors and no benchmark pixels.

```bash
python training_eval/scripts/verify_bundle.py \
  training_eval/weights/head_bundle_manifest.json
```
