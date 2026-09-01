# SynthFlag TEST1 routed residual detector — model card

**Status:** frozen baseline; collaborator rights attestation accepted by project owner

**Date:** 1 September 2026

**Task:** rank real/non-AIGC (`0`) versus generated or AI-tampered (`1`) images

**Locked TikTok test:** not accessed

**Expert 4 redistribution and competition eligibility:** not established

## Model

The selected detector is one frozen upstream FeatDistill Expert 4 SigLIP
encoder/teacher plus three project-trained scalar residual heads:

```text
RGB image -> record native longest side -> SigLIP 384 px preprocessing
          -> frozen Expert 4 -> pooled 1152-D feature + teacher margin
              ├─ <=64 px: CIFAKE head, alpha 1.25 -> sigmoid
              └─ >64 px: 0.65 * epoch05 margin + 0.35 * epoch08 margin
                         -> fixed boundary -1.557959395647049 -> sigmoid
```

Each head is `LayerNorm(1152) -> Linear(256) -> GELU -> Dropout ->
Linear(1)` and has `297,729` parameters. The loaded graph has `429,414,469`
parameters: `428,521,282` in Expert 4 and `893,187` across the three heads.

## Artifact identities

| Component | Role | SHA-256 |
|---|---|---|
| `Expert_4_siglip.pth` | Frozen upstream encoder and teacher | `a7d2297e7fecace8ae95d8bbdca023b697cc395d7fde0d1bd90b23d0cf130ff4` |
| `cifake_router_head.pt` | Native longest side `<=64`, alpha `1.25` | `da8cdd81a14d112a7531837762fe3aad97ebfe07c8cdaa69da6d3c7dfe08b48e` |
| `general_epoch05_head.pt` | 65% large-image component | `98e03c194fc902560d965d1b28d4b1e245e3580d792ff2c086d5ab515588479c` |
| `general_epoch08_head.pt` | 35% large-image component | `b6a8d13d71ab05d0bb43477a4721a74e60d54d289ef483129e857b525dd08526` |

## Provenance

FeatDistill/UESTC supplied Expert 4 and its original detector training. The
three residual heads, native-size routing, fixed stack, TEST1 harness, service,
and product are project work. The heads do not make Expert 4 a clean-room or
wholly original detector.

## TEST1 evidence

TEST1 contains 15,000 unique public sources and 30,000 clean/composite scores.
Clean/composite AUC is `0.9816/0.9095` on CIFAKE, `0.8691/0.8439` on SID-Set,
and `0.9467/0.8785` on WildFake. See [`BENCHMARKS.md`](BENCHMARKS.md) for full
operating-point metrics and limitations.

## Intended use

The score may support research comparison, provenance checks, or a human-review
queue. It is not proof of authorship, a generator identifier, a manipulated
region mask, or an automatic enforcement verdict. Deployment thresholds require
population-specific calibration and explicit false-positive/false-negative
costs.

## Known limitations

- TEST1 is a public development diagnostic, not a locked TikTok test.
- The `<=64` branch is CIFAKE-specialized and benchmark-aware.
- Global pooling misses many locally tampered SID images.
- Composite corruption materially weakens CIFAKE and WildFake ranking; WildFake
  composite specificity is `0.6556` at score `0.5`.
- Scores may be miscalibrated at real platform prevalence.
- The benchmark replay does not establish end-to-end latency or VRAM.

## Rights and eligibility

The project owner accepts the collaborator's attestation that the residual
heads and their training inputs are rights-cleared for project use. This is an
accepted teammate attestation, not an independent license audit. The disclosed
large-image lineage includes a 9,311-image Open Images bulk tranche and 986
guided-diffusion/BigGAN sample pixels, 682 of which entered gradients.

Expert 4 redistribution authorization is unproven and the binary is not in Git.
Under the relayed Track 5 restriction against an existing AIGC detector, this
system may be ineligible unless organizers explicitly clear it.

## Required next step

Obtain explicit Expert 4 redistribution and organizer-eligibility clearance
before bundling the upstream checkpoint or claiming competition approval.
Preserve the collaborator's supporting rights records and required attribution
outside the public Git tree.
