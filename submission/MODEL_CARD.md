# SynthFlag model card

Last reviewed: **2026-08-31**

## Model summary

SynthFlag is the public product and submission name for an inference and
evidence package built around the released **FeatDistill** detector. The model
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

- FeatDistill technical report: [Tu et al., arXiv:2603.21939](https://arxiv.org/abs/2603.21939)
- NTIRE 2026 challenge report: [Gushchin et al., arXiv:2604.11487](https://arxiv.org/abs/2604.11487)
- CLIP base architecture and model card: [OpenAI CLIP](https://github.com/openai/CLIP) and [`openai/clip-vit-large-patch14`](https://huggingface.co/openai/clip-vit-large-patch14)
- SigLIP base architecture and model card: [`google/siglip-so400m-patch14-384`](https://huggingface.co/google/siglip-so400m-patch14-384)

SynthFlag adds the public packaging, integrity checks, protected-evaluation
reporting, operating-point documentation, and responsible-use boundary. It
does not claim authorship of the FeatDistill architecture or checkpoints.

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
| `0.5` | Released default operating point |
| `0.2874746155139839` | Calibration-frozen balanced operating point used in the SynthFlag evidence package |

Changing a threshold changes classification trade-offs; it does not retrain
the model or change score ranking. Select a threshold from representative
development data, freeze it before protected evaluation, and report both
false-positive and false-negative costs.

## Evaluation evidence

The protected V1 final partition contains 7,998 images, balanced between real
and fake. The released probability mean achieved ROC-AUC `0.8505`. At threshold
`0.5`, balanced accuracy was `0.7763`; at the calibration-frozen balanced
threshold, balanced accuracy was `0.8061`. See [BENCHMARKS.md](BENCHMARKS.md)
for complete metrics, V2 retrospective evidence, and the blocked V3 boundary.

These results establish performance only on the documented evaluation
conditions. They do not guarantee accuracy on a new generator, content domain,
capture pipeline, demographic group, or adversarial input.

## Data statement

No dataset pixels, private split rows, local paths, or per-image protected
scores are distributed in this Git repository. The full training-source
inventory for the upstream fine-tuned checkpoints was not independently
reconstructed from the public artifacts; consult the FeatDistill report and
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
5. Monitor false positives and false negatives by relevant domain slices.
6. Stop or recalibrate when the deployment distribution materially changes.
7. Provide an appeal or correction path when results affect people.

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
