# SynthFlag model card

Last reviewed: **2026-09-01**

## Model summary

SynthFlag is the public product and submission name for an inference and
evidence package built around the released four-expert detector. The model
is a four-expert binary image classifier:

| Component | Architecture | Input | Output |
|---|---|---:|---|
| Expert 1 | CLIP ViT-L/14 vision encoder plus classifier head | 224 px | Fake-image probability |
| Expert 2 | CLIP ViT-L/14 vision encoder plus classifier head | 224 px | Fake-image probability |
| Expert 3 | SigLIP So400M Patch14 vision encoder plus classifier head | 384 px | Fake-image probability |
| Expert 4 | SigLIP So400M Patch14 vision encoder plus classifier head | 384 px | Fake-image probability |

The released inference path averages the four probabilities. The result is a
model score in `[0,1]`; it is not cryptographic provenance or proof that an
image is synthetic.

## Attribution and lineage

- Detector technical report: [Tu et al., arXiv:2603.21939](https://arxiv.org/abs/2603.21939)
- NTIRE 2026 challenge report: [Gushchin et al., arXiv:2604.11487](https://arxiv.org/abs/2604.11487)
- CLIP base architecture and model card: [OpenAI CLIP](https://github.com/openai/CLIP) and [`openai/clip-vit-large-patch14`](https://huggingface.co/openai/clip-vit-large-patch14)
- SigLIP base architecture and model card: [`google/siglip-so400m-patch14-384`](https://huggingface.co/google/siglip-so400m-patch14-384)

SynthFlag adds the public packaging, integrity checks, protected-evaluation
reporting, operating-point documentation, and responsible-use boundary. It
does not claim authorship of the architecture or checkpoints credited to Tu et
al.

## Intended uses

- Research and benchmark reproduction by authorized users.
- Triage of image collections, with human review of flagged cases.
- Studying robustness under compression, resizing, screenshots, blur, noise,
  and generator/domain shift.
- Demonstrating evidence-aware AI-image detection workflows.

## Out-of-scope uses

- Treating a score as conclusive proof of authorship or deception.
- Automated punishment, account suspension, takedown, hiring, admissions,
  credit, insurance, policing, immigration, or legal decisions.
- Surveillance, face recognition, identity inference, or demographic
  classification.
- Covert monitoring or processing images without a lawful basis.
- Untested deployment on a new domain, generator family, or media pipeline.

## Scores and operating points

The CLI writes a continuous score. Two documented decision thresholds are:

| Threshold | Role |
|---:|---|
| `0.5` | Released service default and fixed TEST1 reporting point; not a universal deployment cutoff |
| `0.2874746155139839` | Historical V1 calibration-frozen balanced research point; not the recommended low-FPR consequential threshold |

Changing a threshold changes classification trade-offs; it does not retrain
the model or change score ranking. Select a threshold from representative
development data, freeze it before protected evaluation, and report both
false-positive and false-negative costs.

For TikTok-like creator operations, SynthFlag prioritizes low false-positive
rates first. A false positive can wrongly question authentic work, interrupt
distribution or monetization, and create an appeal. A consequential-use
threshold should therefore be selected to meet a validated FPR cap first, then
reduce false negatives within that constraint. No universal consequential
threshold is claimed here.

## Evaluation evidence

TEST1 contains 15,000 unique public images across balanced CIFAKE, SID-Set, and
WildFake subsets, each scored clean and under one deterministic composite
corruption. Its 30,000 paired predictions produced descriptive macro ROC-AUC
`0.9324` clean and `0.8773` augmented. TEST1 reports TPR at 1% and 5% FPR to
support low-FPR operating analysis.

TEST1 evaluates a benchmark-only corrected-v2 Expert-4/router and stored-head
topology. It is not a measurement of the released four-expert probability mean,
the live service, or the TikTok hidden test. Its public suites were previously
inspected, so it is development evidence rather than a pristine blind holdout.

The Day 3 interview with Professor Ng Teck Khim motivated a separate
local-camera-statistics idea. Its brief exploratory prototype was not strong or
stable enough for a final metric and was not used in this model, TEST1, or final
model selection. The interview is future-work input, not evaluation evidence or
researcher endorsement.

Separately, the protected V1 final partition contains 7,998 images, balanced
between real and fake. The released probability mean achieved ROC-AUC `0.8505`.
At threshold `0.5`, balanced accuracy was `0.7763`; at the historical
calibration-frozen balanced threshold, balanced accuracy was `0.8061`. See
[BENCHMARKS.md](BENCHMARKS.md) for complete TEST1 and V1/V2 metrics and the
blocked V3 boundary.

These results establish performance only on the documented evaluation
conditions. They do not guarantee accuracy on a new generator, content domain,
capture pipeline, demographic group, or adversarial input.

## Data statement

No dataset pixels, private split rows, local paths, or per-image protected
scores are distributed in this Git repository. The full training-source
inventory for the upstream fine-tuned checkpoints was not independently
reconstructed from the public artifacts; consult the Tu et al. report and
checkpoint rights holder for authoritative training provenance.

Evaluation references include SID-Set, CIFAKE, WildFake, and COCO val2017.
Their access and redistribution terms differ. See
[DATASETS_AND_RIGHTS.md](DATASETS_AND_RIGHTS.md).

## Limitations and failure modes

- Compression, resizing, screenshots, filtering, blur, noise, and color
  changes can move scores.
- Performance can drop on unseen generators and unfamiliar image domains.
- Edited real images and photorealistic synthetic images can be confused.
- Dataset-specific artifacts can inflate apparent benchmark performance.
- A probability-like score is not necessarily calibrated on a new population.
- Thresholds encode a policy trade-off and may create unequal error costs.
- Adversarial optimization and laundering through repeated transformations
  were not established as safe operating conditions.

## Responsible operation

1. Keep the original image and relevant provenance metadata when lawful.
2. Record the model/checkpoint hashes, software versions, threshold, and
   preprocessing used for each run.
3. Present scores with uncertainty and limitations, not as a binary fact.
4. Require independent evidence and human review for consequential decisions.
5. For creator operations, constrain false-positive rate first and then reduce
   false negatives within the validated cap.
6. Monitor both errors by relevant domain and post-processing slices.
7. Stop or recalibrate when the deployment distribution materially changes.
8. Provide an appeal or correction path when results affect people.

## Security and integrity

The loader verifies expected checkpoint size and SHA-256 before deserialization
and uses `torch.load(..., weights_only=True)`. Bypassing hash checks should be
limited to trusted local development. Checkpoint hashes establish file
identity, not legitimacy, safety, or redistribution permission.

## License and redistribution

Repository code and original project documentation are under the repository's
[Apache License 2.0](../LICENSE). Third-party dependencies, base models,
fine-tuned checkpoints, papers, datasets, images, and trademarks retain their
own terms. The four `Expert_*.pth` files are excluded because no explicit
redistribution license for those fine-tuned files was located in the audited
public materials. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and
[RELEASE_AUDIT.md](RELEASE_AUDIT.md).

This document is a technical release record, not legal advice.
