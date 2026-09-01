# SynthFlag model artifacts

The three project-trained residual heads used by the selected TEST1 runtime are
tracked in this directory:

```text
cifake_router_head.pt
general_epoch05_head.pt
general_epoch08_head.pt
```

- [Team Drive folder](https://drive.google.com/drive/folders/1YPth1je92IaucRu3f8y50oxlAPcMqXuL)
- [Original three-head TEST1 bundle](https://drive.google.com/file/d/1NwOQ1hEQqCgVctdoRuwamZYjp832Vkse/view?usp=drivesdk)
- Bundle SHA-256: `7a8acf6823cc08ba5e7a55def6c2147f95456a3e9f94c8d60d199e503208be54`

The exact 3,323,126-byte Drive ZIP, its extracted files, and the collaborator
bundle manifest are retained in `../training_eval/weights/`. Runtime copies of
the three heads are tracked here and pinned in `manifest.json`.

The project owner accepts the collaborator's attestation that these heads and
their training inputs are rights-cleared for project use. That is an accepted
teammate attestation, not an independent license audit.

The runtime also needs `Expert_4_siglip.pth`. That 1.7 GB frozen dependency is
not part of the collaborator head bundle and remains external because ordinary
GitHub blobs cannot carry it and its redistribution authorization and organizer
eligibility are separate questions. Any other large upstream detector
checkpoints in the Drive folder are likewise dependencies, not team-trained
artifacts.

Run the strict identity checks before inference:

```bash
python -c "from infer.checkpoints import verify_checkpoint_files; verify_checkpoint_files('weights')"
python training_eval/scripts/verify_bundle.py training_eval/weights/head_bundle_manifest.json
```
