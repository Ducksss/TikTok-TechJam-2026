# SynthFlag architecture

![SynthFlag four-expert inference architecture](ARCHITECTURE.svg)

## Accessible walkthrough

1. The CLI recursively discovers JPEG, PNG, BMP, WebP, and TIFF images. Each
   successfully decoded image is converted to RGB.
2. A checkpoint preflight verifies the expected byte size and SHA-256 digest
   of all four FeatDistill expert state dictionaries before any checkpoint is
   deserialized.
3. Every image is preprocessed along two deterministic paths:
   - the CLIP path bicubic-resizes and center-crops to 224 pixels, then uses the
     released CLIP normalization;
   - the SigLIP path bicubic-resizes and center-crops to 384 pixels, then
     normalizes each RGB channel with mean `0.5` and standard deviation `0.5`.
4. Experts 1 and 2 each use a CLIP ViT-L/14 vision encoder with a 768-dimensional
   projected feature and a `768 -> 256 -> 2` classification head.
5. Experts 3 and 4 each use a SigLIP So400M Patch14-384 vision encoder with an
   1,152-dimensional pooled feature and a `1152 -> 256 -> 2` classification
   head.
6. Each two-logit output is converted with softmax, and class index 1 is treated
   as `P(fake)`. The final score is the exact arithmetic mean
   `(P3 + P4 + P1 + P2) / 4`, preserving the released implementation's addition
   order.
7. The CLI writes `predictions.csv` with `image_name,score`, an atomic
   completed-run `predictions.json` array with Track 5 `image_path,pred`
   records, and a `predictions.meta.json` provenance record. Runs can resume
   safely when the input root and checkpoint identity are unchanged.

## Components

| Component | Released implementation |
|---|---|
| CLIP experts | 24 transformer layers, 16 heads, 14-pixel patches, 224-pixel input |
| SigLIP experts | 27 transformer layers, 16 heads, 14-pixel patches, 384-pixel input |
| Classification heads | Linear, ReLU, dropout 0.3, linear to two logits |
| Fusion | Unweighted arithmetic mean of four fake-class probabilities |
| Training in this repository path | None; inference-only |
| Default CLI decision | None; the CLI outputs continuous scores |

## Score versus decision

The released CLI deliberately emits a score rather than a hard label. The
historical default decision threshold is `0.5`. V1 selected
`0.2874746155139839` on calibration data for a more balanced operating point,
then evaluated it once on protected final data. Changing this threshold changes
recall, precision, specificity, F1, and balanced accuracy; it cannot change
ROC-AUC because it does not change score ordering.

The V2 disagreement-aware stack is not part of this production diagram. It was
retained as retrospective experimental evidence only after failing every
leave-one-dataset-out guardrail.
