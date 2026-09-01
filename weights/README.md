# Model artifacts

The selected TEST1 scorer needs three small residual heads, not one file. The Drive bundle contains all three plus a hash and routing manifest.

- [Team Drive folder](https://drive.google.com/drive/folders/1YPth1je92IaucRu3f8y50oxlAPcMqXuL)
- [Download the three-head TEST1 bundle](https://drive.google.com/file/d/1NwOQ1hEQqCgVctdoRuwamZYjp832Vkse/view?usp=drivesdk)
- SHA-256 `7a8acf6823cc08ba5e7a55def6c2147f95456a3e9f94c8d60d199e503208be54`
- `head_bundle_manifest.json` pins both the distributable sanitized files and their original experiment-artifact hashes.
- The four large files already present in the folder are Tu et al. detector
  checkpoints. They are **not team-trained artifacts**, are not stored in Git,
  and need independent redistribution and competition-eligibility clearance.

The project owner accepts the collaborator's rights-clearance attestation for
the residual heads and their training inputs. That attestation was not
independently audited and does not clear redistribution of the Tu et al.
checkpoint or organizer eligibility. See
[`submission/DATASETS_AND_RIGHTS.md`](../submission/DATASETS_AND_RIGHTS.md).
