# External checkpoint setup

SynthFlag does not ship model weights. To run checkpoint-backed inference, an
authorized user must supply four FeatDistill expert state dictionaries beside
the checked-in identity manifest:

```text
weights/
├── manifest.json
├── Expert_1_clip.pth
├── Expert_2_clip.pth
├── Expert_3_siglip.pth
└── Expert_4_siglip.pth
```

The current public download location is Baidu Netdisk:

- share URL: <https://pan.baidu.com/s/1z4FfdeLJOu9PI0wks4vgqQ>
- extraction code: `4dqe`

Before deserialization, SynthFlag checks every required filename, byte count,
and SHA-256 digest against [`manifest.json`](manifest.json). The implementation
constructs CLIP ViT-L/14 experts 1 and 2 and SigLIP So400M Patch14-384 experts 3
and 4 from configuration, then restores the complete expert state dictionaries
with strict key matching.

## Rights boundary

The external mirror is an access location, not a redistribution license. The
2026-08-31 release audit found no explicit permission to redistribute the four
fine-tuned checkpoint files. Do not upload, bundle, sell, or mirror them without
authorization from the checkpoint rights holder.

Licenses for the CLIP or SigLIP base implementations do not automatically cover
downstream fine-tuned weights. Review the [model card](../submission/MODEL_CARD.md),
[third-party notices](../submission/THIRD_PARTY_NOTICES.md), and
[release audit](../submission/RELEASE_AUDIT.md) before use or distribution.
