# SynthFlag selected TEST1 architecture

![SynthFlag Expert 4 plus routed residual-head architecture](ARCHITECTURE.svg)

1. Record each input's native longest side before resizing.
2. Convert to RGB, bicubic-resize the short edge to 384 px, center-crop, and
   apply SigLIP normalization.
3. Frozen Tu et al. Expert 4 emits a 1,152-dimensional pooled feature and
   two teacher logits. The teacher margin is `logit[1] - logit[0]`.
4. Three project heads each compute a scalar correction from the same feature.
5. Native longest side `<=64` uses the CIFAKE head at alpha `1.25` and sigmoid.
6. Larger images blend epoch-05 and epoch-08 corrected margins `0.65 / 0.35`,
   subtract boundary `-1.557959395647049`, then apply sigmoid.
7. The CLI writes `predictions.csv`, `predictions.meta.json`, and atomic
   `predictions.json` records with `image_path` and `pred`.

| Contract | Value |
|---|---|
| Teacher | Tu et al. Expert 4, SigLIP So400M Patch14-384 |
| Feature | `[B,1152]` pooled output |
| Project head | `LayerNorm -> Linear(256) -> GELU -> Dropout -> Linear(1)` |
| Low route | Native longest side `<=64`, alpha `1.25` |
| Large route | `0.65 * margin05 + 0.35 * margin08` |
| Large boundary | `-1.557959395647049` maps to score `0.5` |
| Loaded parameters | `429,414,469` |

This is not the retired four-expert probability mean. It also is not a
clean-room model: Expert 4 remains upstream research and the current heads are
project artifacts whose rights-clearance attestation from the collaborator is
accepted by the project owner. That attestation is not an independent license
audit and does not clear Expert 4 redistribution or organizer eligibility.
