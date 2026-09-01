# Model artifacts

The selected TEST1 scorer needs three small residual heads, not one file. The Drive bundle contains all three plus a hash and routing manifest.

- [Team Drive folder](https://drive.google.com/drive/folders/1YPth1je92IaucRu3f8y50oxlAPcMqXuL)
- [Download the three-head TEST1 bundle](https://drive.google.com/file/d/1NwOQ1hEQqCgVctdoRuwamZYjp832Vkse/view?usp=drivesdk) 
- SHA-256 `7a8acf6823cc08ba5e7a55def6c2147f95456a3e9f94c8d60d199e503208be54`
- `head_bundle_manifest.json` pins both the distributable sanitized files and their original experiment-artifact hashes.
- The four large files already present in the folder are upstream FeatDistill expert checkpoints. They are **not team-trained artifacts**, are not stored in Git, and need independent redistribution/competition-eligibility clearance.

The head bundle is marked research-only pending a rights-clean retrain. The epoch-05/08 lineage contains both a 9,311-row Open Images bulk tranche that lacked item-by-item licence verification and a 986-row guided-diffusion/BigGAN licensing gap, as documented in `../docs/DATA_RIGHTS.md`.
