/* oxlint-disable next/no-html-link-for-pages -- vinext's production next/link prefetch shim currently breaks route clicks; standard anchors keep public navigation reliable. */
import { ArrowUpRight, Download, ScanSearch } from 'lucide-react';
import Image from 'next/image';
import type { ReactNode } from 'react';

import { HashAnchorSync } from './hash-anchor-sync';
import { PrintButton } from './print-button';
import './documentation.css';

const paperUrl = 'https://arxiv.org/html/2604.11487v1';
const repositoryUrl = 'https://github.com/Ducksss/TikTok-TechJam-2026';

const contents = [
  ['overview', 'In one minute'],
  ['user-flow', 'User flow'],
  ['image-processing', 'Image processing'],
  ['architecture', 'Architecture'],
  ['ensemble', 'Ensemble score'],
  ['training', 'Training'],
  ['robustness', 'Robustness'],
  ['results', 'Results'],
  ['considerations', 'Considerations'],
  ['sources', 'Sources'],
] as const;

type EvidenceKind = 'paper' | 'code' | 'guidance';

function EvidenceTag({
  children,
  kind,
}: {
  children: ReactNode;
  kind: EvidenceKind;
}) {
  return (
    <span className={`docs-evidence docs-evidence-${kind}`}>{children}</span>
  );
}

function FigureBlock({
  alternative,
  alt,
  file,
  number,
  title,
}: {
  alternative: ReactNode;
  alt: string;
  file: string;
  number: string;
  title: string;
}) {
  return (
    <figure className="docs-figure">
      <div className="docs-figure-toolbar">
        <figcaption>
          <span>Figure {number}</span>
          {title}
        </figcaption>
        <a className="docs-download" download href={`/diagrams/${file}`}>
          <Download aria-hidden="true" />
          Download SVG
        </a>
      </div>
      <div className="docs-figure-frame">
        <Image
          alt={alt}
          height={900}
          loading="lazy"
          src={`/diagrams/${file}`}
          unoptimized
          width={1440}
        />
      </div>
      <details className="docs-text-alternative">
        <summary>Read the text alternative</summary>
        <div>{alternative}</div>
      </details>
    </figure>
  );
}

function SectionHeading({
  children,
  kicker,
}: {
  children: ReactNode;
  kicker: string;
}) {
  return (
    <div className="docs-section-heading">
      <p>{kicker}</p>
      <h2>{children}</h2>
    </div>
  );
}

export default function Documentation() {
  return (
    <main className="docs-page">
      <HashAnchorSync />
      <a className="docs-skip-link" href="#documentation-content">
        Skip to documentation
      </a>

      <header className="docs-topbar">
        <div className="docs-topbar-inner">
          <a className="docs-brand" href="/" aria-label="SynthFlag home">
            <span>
              <ScanSearch aria-hidden="true" />
            </span>
            SynthFlag
          </a>
          <nav aria-label="Documentation utilities">
            <a href={paperUrl} rel="noreferrer" target="_blank">
              Paper <ArrowUpRight aria-hidden="true" />
            </a>
            <a href={repositoryUrl} rel="noreferrer" target="_blank">
              Repository <ArrowUpRight aria-hidden="true" />
            </a>
            <PrintButton />
            <a className="docs-try-link" href="/try">
              Try detector
            </a>
          </nav>
        </div>
      </header>

      <section className="docs-hero">
        <div className="docs-hero-grid" aria-hidden="true" />
        <div className="docs-hero-inner">
          <nav className="docs-breadcrumb" aria-label="Breadcrumb">
            <a href="/">SynthFlag</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Documentation</span>
          </nav>
          <div className="docs-hero-copy">
            <p className="docs-eyebrow">Technical guide · plain language</p>
            <h1>How four vision experts turn pixels into one useful signal.</h1>
            <p>
              A guided explanation of what SynthFlag does, how the released
              detector processes an image, where the evidence comes from, and
              what its score cannot prove.
            </p>
          </div>
          <div className="docs-hero-stats" aria-label="System summary">
            <div>
              <strong>04</strong>
              <span>independent experts</span>
            </div>
            <div>
              <strong>02</strong>
              <span>vision families</span>
            </div>
            <div>
              <strong>0–1</strong>
              <span>fake-class score</span>
            </div>
          </div>
        </div>
      </section>

      <div className="docs-shell">
        <aside className="docs-toc" aria-label="On this page">
          <p>On this page</p>
          <ol>
            {contents.map(([id, label], index) => (
              <li key={id}>
                <a href={`#${id}`}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {label}
                </a>
              </li>
            ))}
          </ol>
          <div className="docs-toc-note">
            <span aria-hidden="true" />
            Public guide · no setup required
          </div>
        </aside>

        <article id="documentation-content" className="docs-content">
          <section id="overview" className="docs-section docs-overview">
            <SectionHeading kicker="Start here">In one minute</SectionHeading>
            <div className="docs-lead-grid">
              <p className="docs-lead">
                SynthFlag is a research detector that compares an image with
                patterns learned from real and AI-generated examples. It asks
                four independently trained models for a fake-class probability
                and averages their answers.
              </p>
              <div className="docs-score-card">
                <span>Example output</span>
                <strong>0.78</strong>
                <div aria-hidden="true">
                  <span />
                </div>
                <p>
                  Higher means more similar to learned generated-image patterns.
                </p>
              </div>
            </div>
            <div className="docs-answer-grid">
              <div>
                <span>01</span>
                <h3>What goes in?</h3>
                <p>
                  One image in the website, or a folder of images in the
                  released CLI.
                </p>
              </div>
              <div>
                <span>02</span>
                <h3>What happens?</h3>
                <p>
                  CLIP and SigLIP experts inspect differently sized views of the
                  same pixels.
                </p>
              </div>
              <div>
                <span>03</span>
                <h3>What comes out?</h3>
                <p>
                  A continuous, probability-like <code>P(fake)</code> score from
                  0 to 1.
                </p>
              </div>
              <div>
                <span>04</span>
                <h3>What does it prove?</h3>
                <p>
                  Nothing by itself. The score is a signal for review, not proof
                  of origin.
                </p>
              </div>
            </div>
            <div className="docs-evidence-key" aria-label="Evidence label key">
              <p>How to read this guide</p>
              <div>
                <EvidenceTag kind="paper">Paper fact</EvidenceTag>
                <span>Reported by the NTIRE challenge paper.</span>
              </div>
              <div>
                <EvidenceTag kind="code">Released code</EvidenceTag>
                <span>Verified in the packaged inference implementation.</span>
              </div>
              <div>
                <EvidenceTag kind="guidance">Practical guidance</EvidenceTag>
                <span>Recommended interpretation or deployment practice.</span>
              </div>
            </div>
          </section>

          <section id="user-flow" className="docs-section">
            <SectionHeading kicker="01 · From input to record">
              The user flow has two entry points
            </SectionHeading>
            <div className="docs-explainer-grid">
              <div className="docs-explainer">
                <EvidenceTag kind="code">Released code</EvidenceTag>
                <p className="docs-section-lead">
                  The website is designed for a quick, single-image check. The
                  command-line workflow is built for folders and traceable batch
                  output. Both reach the same four-expert model, but their input
                  and output interfaces differ.
                </p>
                <ul>
                  <li>
                    <strong>Web:</strong> JPEG, PNG, or WebP up to 10 MB.
                  </li>
                  <li>
                    <strong>CLI:</strong> recursive folder discovery across five
                    common formats.
                  </li>
                  <li>
                    <strong>Integrity:</strong> all four checkpoint sizes and
                    SHA-256 hashes are checked before weights load.
                  </li>
                  <li>
                    <strong>Batch record:</strong> resumable CSV scores plus run
                    metadata.
                  </li>
                </ul>
                <details className="docs-technical">
                  <summary>Technical details · interfaces and outputs</summary>
                  <p>
                    The web API returns JSON for one image. The CLI discovers
                    JPEG, PNG, BMP, WebP, and TIFF files, then writes{' '}
                    <code>predictions.csv</code> with
                    <code>image_name,score</code> and a{' '}
                    <code>predictions.meta.json</code> sidecar. Checkpoint
                    verification happens in the released CLI before
                    deserialization.
                  </p>
                </details>
              </div>
              <FigureBlock
                alternative={
                  <ol>
                    <li>Choose a single web image or a CLI folder.</li>
                    <li>
                      The CLI verifies four checkpoint files against its
                      manifest.
                    </li>
                    <li>Decode each image and convert it to RGB.</li>
                    <li>Create CLIP and SigLIP model views.</li>
                    <li>
                      Run four experts and take each fake-class probability.
                    </li>
                    <li>
                      Return a 0–1 score; the CLI also records CSV and metadata.
                    </li>
                  </ol>
                }
                alt="Two entry paths—single web image and CLI folder—converge on checkpoint verification, RGB decoding, dual preprocessing, four experts, and a continuous fake-class score."
                file="01-user-flow.svg"
                number="01"
                title="Released inference user flow"
              />
            </div>
          </section>

          <section id="image-processing" className="docs-section">
            <SectionHeading kicker="02 · Same pixels, native views">
              Why the image is processed twice
            </SectionHeading>
            <div className="docs-explainer-grid">
              <div className="docs-explainer">
                <EvidenceTag kind="code">Released code</EvidenceTag>
                <p className="docs-section-lead">
                  CLIP and SigLIP were pretrained with different image
                  conventions. SynthFlag preserves those conventions instead of
                  forcing both families to see one generic resize and
                  normalization.
                </p>
                <ul>
                  <li>The source is decoded once into three-channel RGB.</li>
                  <li>
                    CLIP receives a bicubic resize and 224 px center crop.
                  </li>
                  <li>
                    SigLIP receives a bicubic resize and 384 px center crop.
                  </li>
                  <li>
                    Each lane applies its own fixed channel normalization.
                  </li>
                </ul>
                <details className="docs-technical">
                  <summary>Technical details · exact normalization</summary>
                  <p>
                    <strong>CLIP mean:</strong> (0.48145466, 0.4578275,
                    0.40821073)
                    <br />
                    <strong>CLIP std:</strong> (0.26862954, 0.26130258,
                    0.27577711)
                  </p>
                  <p>
                    <strong>SigLIP mean and std:</strong> (0.5, 0.5, 0.5)
                  </p>
                  <p>
                    The fixed order is resize → center crop → tensor →
                    normalize. No random degradation is applied during released
                    inference.
                  </p>
                </details>
              </div>
              <FigureBlock
                alternative={
                  <p>
                    An RGB image splits into two deterministic lanes. The CLIP
                    lane resizes the short edge to 224 pixels, center-crops to
                    224 square, converts to a tensor, and applies CLIP channel
                    statistics. The SigLIP lane repeats the process at 384
                    pixels with mean and standard deviation of 0.5 for every
                    channel.
                  </p>
                }
                alt="RGB image splitting into a 224-pixel CLIP preprocessing lane and a 384-pixel SigLIP preprocessing lane, with exact normalization values."
                file="02-image-processing.svg"
                number="02"
                title="Backbone-specific image processing"
              />
            </div>
          </section>

          <section id="architecture" className="docs-section">
            <SectionHeading kicker="03 · Four independent experts">
              The model architecture
            </SectionHeading>
            <div className="docs-explainer-grid">
              <div className="docs-explainer">
                <EvidenceTag kind="paper">Paper fact</EvidenceTag>
                <EvidenceTag kind="code">Released code</EvidenceTag>
                <p className="docs-section-lead">
                  Two CLIP experts and two SigLIP experts form the ensemble.
                  Every expert has its own complete encoder, feature vector,
                  lightweight binary head, and independently restored
                  checkpoint.
                </p>
                <ul>
                  <li>
                    <strong>Experts 1–2:</strong> CLIP ViT-L/14 at 224 px.
                  </li>
                  <li>
                    <strong>Experts 3–4:</strong> SigLIP So400M Patch14-384 at
                    384 px.
                  </li>
                  <li>
                    Each head reduces its feature to two logits: real and fake.
                  </li>
                  <li>
                    The paper reports approximately 10 GB peak GPU memory.
                  </li>
                </ul>
                <details className="docs-technical">
                  <summary>Technical details · dimensions and heads</summary>
                  <p>
                    CLIP uses a 1024-wide encoder and its 768-dimensional
                    projected <code>image_embeds</code>; head: 768 → 256 → 2.
                  </p>
                  <p>
                    SigLIP uses a 1152-dimensional <code>pooler_output</code>;
                    head: 1152 → 256 → 2.
                  </p>
                  <p>
                    Both heads are Linear → ReLU → Dropout(0.3) → Linear. The
                    paper’s memory figure is author-reported, not a measurement
                    from this site.
                  </p>
                </details>
                <a
                  className="docs-architecture-link"
                  href="/documentation/architecture"
                >
                  Explore the engineering architecture atlas
                  <ArrowUpRight aria-hidden="true" />
                </a>
              </div>
              <FigureBlock
                alternative={
                  <p>
                    Experts 1 and 2 are separate CLIP ViT-L/14 models. Each
                    receives a 224-pixel view, produces a 768-dimensional
                    projected image embedding, and passes it through a
                    768-to-256-to-2 classifier. Experts 3 and 4 are separate
                    SigLIP So400M Patch14-384 models. Each receives a 384-pixel
                    view, produces a 1152-dimensional pooled feature, and passes
                    it through a 1152-to-256-to-2 classifier. Every head uses
                    ReLU and dropout 0.3 between linear layers.
                  </p>
                }
                alt="Four expert architecture showing two CLIP ViT-L/14 models and two SigLIP So400M Patch14-384 models, their feature sizes, heads, and two-logit outputs."
                file="03-model-architecture.svg"
                number="03"
                title="Four-expert architecture"
              />
            </div>
          </section>

          <section id="ensemble" className="docs-section">
            <SectionHeading kicker="04 · Equal-weight probability fusion">
              How four answers become one score
            </SectionHeading>
            <div className="docs-explainer-grid">
              <div className="docs-explainer">
                <EvidenceTag kind="code">Released code</EvidenceTag>
                <p className="docs-section-lead">
                  Each expert produces two raw logits. Softmax turns them into
                  class probabilities, and class index 1 is the fake-image
                  class. The four fake-class probabilities are averaged with
                  equal weight.
                </p>
                <div
                  className="docs-equation"
                  aria-label="P fake equals P three plus P four plus P one plus P two, divided by four"
                >
                  <span>P(fake) =</span>
                  <strong>(P₃ + P₄ + P₁ + P₂) / 4</strong>
                </div>
                <ul>
                  <li>
                    No majority vote, learned fusion weights, or test-time
                    augmentation.
                  </li>
                  <li>The result stays continuous from 0 to 1.</li>
                  <li>
                    Four independently trained variants provide complementary
                    opinions; the paper does not claim that exactly four are
                    necessary.
                  </li>
                </ul>
                <details className="docs-technical">
                  <summary>
                    Technical details · softmax and score meaning
                  </summary>
                  <p>
                    For two logits <code>z₀</code> and <code>z₁</code>, the
                    fake-class probability is{' '}
                    <code>exp(z₁) / (exp(z₀) + exp(z₁))</code>. The released
                    implementation evaluates the arithmetic mean in the order
                    shown above.
                  </p>
                  <p>
                    The site calls this a probability-like score because no
                    calibration guarantee is reported. A threshold is a separate
                    deployment choice.
                  </p>
                </details>
              </div>
              <FigureBlock
                alternative={
                  <p>
                    CLIP experts 1 and 2 output P1 and P2. SigLIP experts 3 and
                    4 output P3 and P4. Each is the softmax probability for
                    class 1. The released code computes P3 plus P4 plus P1 plus
                    P2, divided by four. The output is a continuous P(fake)
                    score where higher means more fake-like to the model.
                  </p>
                }
                alt="Four equal-weight expert probabilities flowing into an exact unweighted arithmetic mean and a zero-to-one P fake score."
                file="04-ensemble-flow.svg"
                number="04"
                title="Exact probability ensemble"
              />
            </div>
          </section>

          <section id="training" className="docs-section">
            <SectionHeading kicker="05 · Training-only method">
              How self-distillation works
            </SectionHeading>
            <div className="docs-explainer-grid">
              <div className="docs-explainer">
                <EvidenceTag kind="paper">Paper fact</EvidenceTag>
                <p className="docs-section-lead">
                  The NTIRE report describes a two-stage training strategy.
                  First, each expert learns the binary task for two epochs. Then
                  the epoch-2 model becomes a fixed teacher for the same model’s
                  intermediate features.
                </p>
                <ul>
                  <li>
                    <strong>Stage 1:</strong> two epochs of
                    real-versus-generated training.
                  </li>
                  <li>
                    <strong>Snapshot:</strong> epoch-2 feature maps become fixed
                    dense targets.
                  </li>
                  <li>
                    <strong>Stage 2:</strong> current features align with those
                    targets while binary supervision continues.
                  </li>
                  <li>
                    <strong>Inference:</strong> the teacher path and alignment
                    objective disappear.
                  </li>
                </ul>
                <details className="docs-technical">
                  <summary>
                    Technical details · what is and is not specified
                  </summary>
                  <p>
                    The paper specifies dense feature alignment but does not
                    name the exact feature layers, alignment-loss formula, loss
                    weight, optimizer, or Stage 2 duration. This guide
                    deliberately does not infer those values. The released
                    repository packages inference rather than the trainer.
                  </p>
                </details>
              </div>
              <FigureBlock
                alternative={
                  <p>
                    Stage 1 trains an expert for exactly two epochs on real and
                    generated labels. Its epoch-2 checkpoint is frozen. During
                    Stage 2, the same training image passes through the fixed
                    reference and the current trainable model. Dense
                    intermediate features are aligned while the binary objective
                    remains. This reference path is used only for training and
                    is absent from inference.
                  </p>
                }
                alt="Two-stage training flow: two-epoch binary training, a fixed epoch-2 feature target, and dense feature alignment during Stage 2, clearly marked training only."
                file="05-training-self-distillation.svg"
                number="05"
                title="Feature-level self-distillation"
              />
            </div>
          </section>

          <section id="robustness" className="docs-section">
            <SectionHeading kicker="06 · Evidence under image damage">
              Robustness and its limits
            </SectionHeading>
            <div className="docs-explainer-grid">
              <div className="docs-explainer">
                <EvidenceTag kind="paper">Paper fact</EvidenceTag>
                <p className="docs-section-lead">
                  The NTIRE benchmark tests a realistic problem: images are
                  often cropped, recompressed, blurred, resized, watermarked, or
                  otherwise changed before a detector sees them. Robust-track
                  images receive one to five chained distortions.
                </p>
                <ul>
                  <li>108,750 real and 185,750 generated images.</li>
                  <li>42 generators overall; 20 represented in training.</li>
                  <li>36 transformation types across challenge stages.</li>
                  <li>
                    Real and generated images use the same degradation pipeline.
                  </li>
                </ul>
                <details className="docs-technical">
                  <summary>Technical details · challenge protocol</summary>
                  <p>
                    Half of each class in the validation and test splits is
                    assigned to the robust track. The primary metric is robust
                    ROC-AUC on distorted images; clean ROC-AUC is secondary.
                    ROC-AUC evaluates ranking across thresholds, not accuracy at
                    one cutoff.
                  </p>
                  <p>
                    The challenge transformations are benchmark context. The
                    repository does not claim to ship every organizer
                    transformation or the upstream training corpus.
                  </p>
                </details>
              </div>
              <FigureBlock
                alternative={
                  <p>
                    The challenge contains 108,750 real images and 185,750
                    generated images from 42 generators. Robust images receive
                    one to five randomly sampled consecutive distortions drawn
                    from 36 transformation types across challenge stages. UESTC
                    reports average clean ROC-AUC 0.9729 and robust ROC-AUC
                    0.8679. Deployment notes warn that the score neither
                    identifies a generator nor proves provenance and that new
                    domains can shift performance.
                  </p>
                }
                alt="NTIRE challenge scale and degradation pipeline, UESTC average clean and robust ROC-AUC, and deployment boundaries."
                file="06-robustness-evidence.svg"
                number="06"
                title="Robustness evidence and boundaries"
              />
            </div>
          </section>

          <section id="results" className="docs-section">
            <SectionHeading kicker="Reported evidence · NTIRE Table 3">
              UESTC results, without rounding away detail
            </SectionHeading>
            <div className="docs-results-intro">
              <p className="docs-section-lead">
                SynthFlag packages the released FeatDistill detector; the NTIRE
                challenge report describes the corresponding submission under
                the team name UESTC. These challenge results are benchmark
                evidence, not a promise for every future image.
              </p>
              <EvidenceTag kind="paper">Paper fact</EvidenceTag>
            </div>
            <div className="docs-table-wrap">
              <table>
                <caption>UESTC metrics reported in NTIRE 2026 Table 3</caption>
                <thead>
                  <tr>
                    <th scope="col">Split</th>
                    <th scope="col">Clean ROC-AUC</th>
                    <th scope="col">Robust ROC-AUC</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Open test</th>
                    <td>0.9693</td>
                    <td>0.8558</td>
                  </tr>
                  <tr>
                    <th scope="row">Hidden test</th>
                    <td>0.9764</td>
                    <td>0.8800</td>
                  </tr>
                  <tr className="docs-average-row">
                    <th scope="row">Average</th>
                    <td>0.9729</td>
                    <td>0.8679</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="docs-callout">
              <strong>How to read the gap</strong>
              <p>
                The 0.1050 clean-to-robust difference shows that image
                transformations materially affect ranking performance. It does
                not tell us that every transformed image will fail, and it does
                not select an operating threshold.
              </p>
            </div>
          </section>

          <section id="considerations" className="docs-section">
            <SectionHeading kicker="Before using the score">
              Considerations for responsible use
            </SectionHeading>
            <div className="docs-consideration-grid">
              <div>
                <EvidenceTag kind="guidance">Practical guidance</EvidenceTag>
                <h3>Use it as triage</h3>
                <p>
                  Let the score prioritize review or contribute one signal among
                  several. Do not use it as the sole basis for a consequential
                  decision.
                </p>
              </div>
              <div>
                <EvidenceTag kind="guidance">Practical guidance</EvidenceTag>
                <h3>Validate your domain</h3>
                <p>
                  Measure clean and post-processed performance on the actual
                  sources, formats, and generators your team expects.
                </p>
              </div>
              <div>
                <EvidenceTag kind="guidance">Practical guidance</EvidenceTag>
                <h3>Choose thresholds separately</h3>
                <p>
                  ROC-AUC does not choose a cutoff. Select one using
                  target-population error costs, then monitor drift.
                </p>
              </div>
              <div>
                <EvidenceTag kind="guidance">Practical guidance</EvidenceTag>
                <h3>Retain context</h3>
                <p>
                  Keep the original image, model version, score, and review
                  outcome so a later decision is auditable.
                </p>
              </div>
            </div>
            <div className="docs-does-not-prove">
              <p>The score cannot prove</p>
              <ul>
                <li>who created an image</li>
                <li>which generator produced it</li>
                <li>where an image was edited</li>
                <li>whether provenance metadata is authentic</li>
              </ul>
            </div>

            <div id="glossary" className="docs-glossary">
              <h3>Glossary</h3>
              <dl>
                <div>
                  <dt>Backbone</dt>
                  <dd>
                    A large pretrained vision model used to extract useful image
                    representations.
                  </dd>
                </div>
                <div>
                  <dt>Feature</dt>
                  <dd>
                    A numeric representation of patterns the model has extracted
                    from pixels.
                  </dd>
                </div>
                <div>
                  <dt>Softmax</dt>
                  <dd>
                    A function that turns a set of logits into class
                    probabilities that sum to one.
                  </dd>
                </div>
                <div>
                  <dt>Ensemble</dt>
                  <dd>
                    Multiple independently trained models whose outputs are
                    combined.
                  </dd>
                </div>
                <div>
                  <dt>Probability-like score</dt>
                  <dd>
                    The model’s fake-class output. It lies between 0 and 1 but
                    is not claimed to be calibrated.
                  </dd>
                </div>
                <div>
                  <dt>Self-distillation</dt>
                  <dd>
                    A training method where a model learns from feature targets
                    produced by an earlier version of itself.
                  </dd>
                </div>
                <div>
                  <dt>Degradation</dt>
                  <dd>
                    A transformation such as blur, compression, crop, noise, or
                    resizing that changes image pixels.
                  </dd>
                </div>
                <div>
                  <dt>ROC-AUC</dt>
                  <dd>
                    A threshold-independent measure of how well scores rank
                    positive examples above negative ones.
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <section id="sources" className="docs-section docs-sources">
            <SectionHeading kicker="Trace the evidence">
              Sources and reusable assets
            </SectionHeading>
            <div className="docs-source-list">
              <a href={paperUrl} rel="noreferrer" target="_blank">
                <span>Primary paper</span>
                <strong>NTIRE 2026 challenge report</strong>
                <ArrowUpRight aria-hidden="true" />
              </a>
              <a href={repositoryUrl} rel="noreferrer" target="_blank">
                <span>Released implementation · team access</span>
                <strong>TikTok-TechJam-2026 repository</strong>
                <ArrowUpRight aria-hidden="true" />
              </a>
              <a href="/documentation/architecture">
                <span>Engineering deep dive</span>
                <strong>
                  Serving, runtime, integrity, tensor, release, and operations
                </strong>
                <ArrowUpRight aria-hidden="true" />
              </a>
              <a href="/diagrams/01-user-flow.svg" download>
                <span>Asset directory</span>
                <strong>
                  Download the first SVG, then browse all six figures above
                </strong>
                <Download aria-hidden="true" />
              </a>
            </div>
            <p className="docs-source-note">
              Paper claims in this guide were checked against Sections 2 and
              8.2, Figure 7, and Table 3 of the challenge report. Implementation
              details were checked against the released inference model, CLI,
              architecture notes, and model card.
            </p>
          </section>
        </article>
      </div>

      <footer className="docs-footer">
        <div>
          <a className="docs-brand" href="/">
            <span>
              <ScanSearch aria-hidden="true" />
            </span>
            SynthFlag
          </a>
          <p>From pixels to evidence.</p>
        </div>
        <div>
          <a href="/try">Try detector</a>
          <a href="#overview">Back to top</a>
        </div>
      </footer>
    </main>
  );
}
