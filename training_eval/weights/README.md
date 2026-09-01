# Collaborator residual-head bundle

This directory records the final three-head Drive bundle used by the selected
SynthFlag runtime. Checkpoint bytes are distributed from Google Drive and are
not tracked in Git.

- [Team Drive folder](https://drive.google.com/drive/folders/1YPth1je92IaucRu3f8y50oxlAPcMqXuL)
- [Final three-head bundle](https://drive.google.com/file/d/1NwOQ1hEQqCgVctdoRuwamZYjp832Vkse/view?usp=drivesdk)
- Bundle SHA-256: `7a8acf6823cc08ba5e7a55def6c2147f95456a3e9f94c8d60d199e503208be54`

`head_bundle_manifest.json` pins the Drive file ID and URL, ZIP size and hash,
per-head hashes, source-artifact hashes, roles, route weights, and calibration
boundary. Download and extract the bundle into a temporary directory before
running the unchanged collaborator verifier against that extracted manifest.
Do not commit the ZIP or extracted `.pt` files.

The project owner accepts the collaborator's rights-clearance attestation for
the heads and their training inputs. No replacement retraining is required for
this project release under that decision. The attestation is recorded as a
project decision rather than an independent license audit.

The bundle contains no upstream Expert 4 tensors and no benchmark pixels.

The runtime copy/install procedure is documented in `../../weights/README.md`.
