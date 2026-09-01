# Attribution and distribution notice

## Upstream research and software

- The frozen Expert 4 dependency follows the upstream Expert 4 detector report and
  its
  attributed source lineage. Its separately hosted checkpoint remains external;
  redistribution authorization is unproven.
- SigLIP So400M Patch14-384: [Google model card](https://huggingface.co/google/siglip-so400m-patch14-384), Apache-2.0 base model. A base-model licence does not automatically license a later detector fine-tune.
- OpenAI CLIP ViT-L/14: [official repository](https://github.com/openai/CLIP), MIT. It appears only in the proposed clean-room plan and is not evidence that the plan was run.
- Local Statistics for Generative Image Detection: Yung Jer Wong and Teck Khim Ng, [arXiv:2310.16684](https://arxiv.org/abs/2310.16684). It informed proposed future work and is not deployed in TEST1.

## Team artifacts in this branch

The training/evaluation scripts, deterministic augmentation implementation, residual-head experiments, routing/stacking contract, TEST1 harness, reports and documentation are project artifacts. The three-head Drive bundle contains no upstream encoder tensors and no benchmark pixels.

The project owner accepts the collaborator's attestation that the current heads
and their training inputs are rights-cleared for project use. This status is
not an independent license audit and does not imply organizer clearance, NUS
endorsement, or authorship of the external Expert 4 dependency.

## Data

No training or evaluation pixels are committed. `benchmarks/test1/predictions.csv` contains labels, relative sample identifiers and model outputs only. Dataset licences and restrictions remain with their publishers; WildFake is documented as evaluation-only with commercial-use clearance unproven.
