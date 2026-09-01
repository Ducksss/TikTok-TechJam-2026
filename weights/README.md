# External checkpoint setup

SynthFlag does not commit model binaries. The selected TEST1 runtime requires
one upstream FeatDistill Expert 4 checkpoint and three project-trained residual
heads beside the checked-in identity manifest:

```text
weights/
├── manifest.json
├── Expert_4_siglip.pth
├── cifake_router_head.pt
├── general_epoch05_head.pt
└── general_epoch08_head.pt
```

Obtain `Expert_4_siglip.pth` from the FeatDistill authors' official checkpoint
release. The current public access location is Baidu Netdisk:

- share URL: <https://pan.baidu.com/s/1z4FfdeLJOu9PI0wks4vgqQ>
- extraction code: `4dqe`

The three-head TEST1 bundle is published separately:

- bundle: <https://drive.google.com/file/d/1NwOQ1hEQqCgVctdoRuwamZYjp832Vkse/view?usp=drivesdk>
- ZIP SHA-256: `7a8acf6823cc08ba5e7a55def6c2147f95456a3e9f94c8d60d199e503208be54`
- ZIP size: `3,323,126` bytes

Before deserialization, SynthFlag checks every filename, byte count, and SHA-256
digest against [`manifest.json`](manifest.json). PyTorch loads the upstream
checkpoint and every head with tensor-only safe deserialization and strict state
matching.

## Exact selected graph

- Native longest side `<= 64`: the CIFAKE router head corrects the frozen
  Expert 4 teacher margin with alpha `1.25`, then sigmoid produces the score.
- Native longest side `> 64`: the epoch-05 and epoch-08 corrected margins are
  blended `0.65 / 0.35`; the fixed boundary `-1.557959395647049` maps to score
  `0.5`.

## Rights and eligibility boundary

Expert 4 remains upstream FeatDistill research. Its redistribution permission
is not established by the source-code license. The three residual heads are a
research artifact pending a rights-clean retrain: the large-image lineage
contains unresolved training-data license rows documented in
[`submission/MODEL_CARD.md`](../submission/MODEL_CARD.md). Do not mirror or
represent these weights as commercially cleared, organizer-approved, or wholly
original SynthFlag research.
