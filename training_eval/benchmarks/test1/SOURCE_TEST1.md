# TEST1 dataset and evaluation sources

## What TEST1 evaluated

TEST1 used **15,000 unique public images**:

- 5,000 from CIFAKE;
- 5,000 from SID-Set;
- 5,000 from WildFake.

Every image was evaluated twice:

1. as the original clean image;
2. with one deterministic composite augmentation.

This produced **30,000 predictions from 15,000 unique source images**. The augmented rows reuse the same source identities; they are not additional independent images.

TEST1 did **not** use the TikTok TechJam hidden evaluation set.

The binary label convention was:

- `0`: real/non-AIGC;
- `1`: AI-generated, fully synthetic, or AI-tampered.

## 1. CIFAKE

- Dataset split: official CIFAKE test split.
- Full official test pool: 20,000 images.
- TEST1 sample: 5,000 exact-byte-unique images.
- Class balance:
  - 2,500 real CIFAR-10-derived images;
  - 2,500 Stable Diffusion 1.4 generated images.
- Native resolution: every image is `32 × 32` pixels.
- Selection: exact-SHA deduplication followed by deterministic, score-blind salted-hash sampling of 2,500 images per class.
- Clean images were not pre-upscaled outside the model's normal preprocessor.

This is a 5,000-image subset rather than the complete 20,000-image CIFAKE test split.

All CIFAKE images activate the detector's specialised native-longest-side `≤64` branch. Consequently, the CIFAKE result is benchmark-aware and must not be presented as pure unknown-domain generalisation.

Protocol identity: `cifake_official/benchmark5000_v1/protocol.json`. The local
dataset manifest is intentionally excluded because it resolves benchmark
pixels and local source paths.

## 2. SID-Set

- Dataset split: public SID-Set **validation** split.
- The separately distributed official test split was not used.
- Full public validation pool: 30,000 rows across 34 official Parquet shards.
- TEST1 sample: 5,000 exact-byte-unique images.
- Class composition:
  - 2,500 real images (`SID label 0`);
  - 1,250 fully synthetic images (`SID label 1`);
  - 1,250 AI-tampered images (`SID label 2`).
- For binary evaluation, SID labels 1 and 2 were combined into the positive/AI class.
- Native longest side: 768–1,024 pixels; median 1,024 pixels.
- Selection: deterministic, score-blind cluster sampling of official Parquet row groups, followed by salted-hash row sampling within each SID label.
- Original image bytes were extracted from the official Parquet files without Hugging Face preview re-encoding.

SID is the most manipulation-oriented TEST1 source because half of its positive examples are locally tampered rather than completely generated. It is nevertheless a public validation benchmark, not a hidden test.

Protocol identity: `sid_validation_cluster5000_v1/protocol.json`. The local
dataset manifest is intentionally excluded because it resolves benchmark
pixels and local source paths.

## 3. WildFake

- Dataset split: WildFake official 20% test metadata.
- Complete metadata pool: 714,156 rows.
- TEST1 sample: 5,000 exact-byte-unique images.
- Class balance:
  - 2,500 real images;
  - 2,500 AI-generated images.
- Native longest side: 128–5,177 pixels; median approximately 200 pixels.
- Selection: deterministic, score-blind salted-hash sampling, exact-byte deduplication, and hierarchical balancing by source/generator and architecture.

### WildFake real-image sources

The 2,500 real images were distributed across six sources:

| Source | Images |
|---|---:|
| ImageNet | 417 |
| FFHQ | 417 |
| CelebA-HQ | 417 |
| LAION-5B | 417 |
| Church | 416 |
| AFHQ | 416 |

### WildFake generated-image sources

The 2,500 generated images were balanced across three broad generator families:

| Family | Images |
|---|---:|
| Diffusion-based | 834 |
| Other generative architectures | 833 |
| GAN-based | 833 |

The sample covers 15 individual architectures:

- Diffusion: ADM, DDPM, DDIM, Imagen, and VQDM.
- GAN: BigGAN, DF-GAN, GigaGAN, StarGAN, StyleGAN, and GALIP.
- Other: VQGAN, VQVAE, MAGE, and MAE.

DALL-E, Midjourney, and Stable Diffusion fake strata were excluded. Real COCO images were also excluded. This reduced overlap with earlier organizer demonstrations and documented upstream-detector source families, but it does not prove zero exposure through Expert 4 or SigLIP pretraining.

Protocol identity: `wildfake_official_test5000_v1/protocol.json`. The local
dataset manifest is intentionally excluded because it resolves benchmark
pixels and local source paths.

## Clean and augmented evaluation

Each source image contributed exactly two aligned views:

- `clean`: the unmodified source image;
- `composite_standard`: one deterministic 1–5-operation corruption recipe.

For each of the three datasets:

| Number of transformations | Source images |
|---:|---:|
| 1 | 1,000 |
| 2 | 1,000 |
| 3 | 1,000 |
| 4 | 1,000 |
| 5 | 1,000 |

The composite recipes used six transformation families:

| Family | Possible severity/settings |
|---|---|
| JPEG compression | Quality 90, 70, 50, or 30 |
| Gaussian blur | Sigma 0.5, 1.0, or 2.0 |
| Resize round trip | Scale 0.5 or 0.25, then bicubic resize back |
| Gaussian noise | Sigma 0.02, 0.05, or 0.10 |
| Colour jitter | Brightness, contrast, or saturation multiplied by 0.8 or 1.2 |
| Centre-crop round trip | Retain 80%, then bicubic resize back |

The recipes were:

- deterministic;
- generated without model scores;
- generated without using the class label;
- applied symmetrically to real and AI images;
- applied in memory, without saving separate augmented image files.

TEST1 did **not** cover harder NTIRE-style operations such as neural compression, invisible watermark insertion, watermark removal, adversarial attacks, or a complete 36-transformation corruption pipeline.

## What TEST1 does and does not establish

An accurate description is:

> TEST1 evaluates the frozen detector on balanced, score-blind 5,000-image subsets from CIFAKE's official test split, SID-Set's public validation split, and WildFake's official test metadata. Each of the 15,000 unique source images is evaluated clean and under one deterministic 1–5-operation composite corruption, producing 30,000 total predictions.

Do not claim that:

- TEST1 used the TikTok hidden test;
- it evaluated the complete CIFAKE, SID-Set, or WildFake collections;
- SID was an official hidden test;
- 30,000 predictions represented 30,000 independent images;
- the three suites were completely unseen throughout model development;
- dataset-external evaluation proves zero generator-family, pixel-level, or backbone-pretraining exposure.

These public suites were inspected during earlier development. TEST1 is therefore a reproducible development benchmark rather than a pristine blind holdout.
