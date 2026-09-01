# SynthFlag model artifacts

Checkpoint bytes are not stored in Git. The team Google Drive release is the
final distribution source for the selected TEST1 runtime:

- [Download the final three-head bundle](https://drive.google.com/file/d/1NwOQ1hEQqCgVctdoRuwamZYjp832Vkse/view?usp=drivesdk)
- [Download `Expert_4_siglip.pth`](https://drive.google.com/file/d/1wK-1vDTCs8oojIu1qjimgr9wLAUsbdrh/view?usp=drivesdk)
- [Open the team Drive folder](https://drive.google.com/drive/folders/1YPth1je92IaucRu3f8y50oxlAPcMqXuL)

The final head bundle is exactly 3,323,126 bytes with SHA-256
`7a8acf6823cc08ba5e7a55def6c2147f95456a3e9f94c8d60d199e503208be54`.
Extract it into this directory, then add the separately downloaded Expert 4
file so the local layout is:

```text
weights/
├── README.md
├── Expert_4_siglip.pth
├── cifake_router_head.pt
├── general_epoch05_head.pt
└── general_epoch08_head.pt
```

Do not add the ZIP or extracted checkpoints to Git. Expected filenames, byte
sizes, and SHA-256 digests are pinned in
`../infer/checkpoint_manifest.json`; the runtime uses that packaged manifest
when no local `manifest.json` is present and rejects a mismatched download.

The project owner accepts the collaborator's attestation that these heads and
their training inputs are rights-cleared for project use. That is an accepted
teammate attestation, not an independent license audit.

`Expert_4_siglip.pth` is a 1.7 GB frozen upstream dependency, not part of the
project head bundle. Its redistribution authorization and organizer eligibility
remain separate questions. The other upstream checkpoints in the Drive folder
are not used by the selected runtime.

Run the strict identity checks before inference:

```bash
python -c "from infer.checkpoints import verify_checkpoint_files; verify_checkpoint_files('weights')"
```

The head-bundle identity and per-file routing metadata are also recorded in
`../training_eval/weights/head_bundle_manifest.json` for release audit.
