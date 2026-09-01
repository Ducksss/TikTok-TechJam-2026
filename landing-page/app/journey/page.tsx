/* oxlint-disable next/no-html-link-for-pages -- vinext's production next/link prefetch shim currently breaks route clicks; standard anchors keep public navigation reliable. */
import type { ReactNode } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Ban,
  Check,
  CircleDashed,
  FlaskConical,
  Gauge,
  Layers3,
  Microscope,
  ScanSearch,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import Image from 'next/image';

import { HashAnchorSync } from '../documentation/hash-anchor-sync';
import { ModelJourney } from '../documentation/architecture/model-journey';
import '../documentation/documentation.css';
import '../documentation/architecture/architecture.css';
import './journey.css';
import '../documentation/light-theme.css';

const contents = [
  ['day-one', 'Day 1 · Trust'],
  ['day-two', 'Day 2 · Robustness'],
  ['released-model', 'Released model'],
  ['day-three', 'Day 3 · Guardrails'],
  ['research-interview', 'Day 3 · Interview'],
  ['test1', 'Day 4 · TEST1'],
  ['roadmap', 'Roadmap'],
  ['status', 'What remains'],
] as const;

const backboneScreen = [
  { name: 'MoCo v3 Transformer', value: 0.706, note: 'Not selected' },
  { name: 'FatFormer', value: 0.771, note: undefined },
  { name: 'CLIP-RN50x64', value: 0.828, note: undefined },
  { name: 'DINOv2-L', value: 0.836, note: undefined },
  { name: 'DINOv3-7*', value: 0.839, note: 'Scope caveat if 7B' },
  { name: 'DINOv3-L', value: 0.842, note: 'High cost' },
] as const;

function StatusBadge({
  kind,
  children,
}: {
  kind: 'adopted' | 'rejected' | 'partial' | 'planned';
  children: ReactNode;
}) {
  return (
    <span className={`journey-status journey-status-${kind}`}>{children}</span>
  );
}

function DayHeader({
  day,
  date,
  title,
  question,
}: {
  day: string;
  date: string;
  title: string;
  question: string;
}) {
  return (
    <header className="journey-day-header">
      <div>
        <span>{day}</span>
        <small>{date}</small>
      </div>
      <div>
        <h2>{title}</h2>
        <p>
          <strong>Question:</strong> {question}
        </p>
      </div>
    </header>
  );
}

export default function JourneyPage() {
  return (
    <main className="docs-page atlas-page journey-page">
      <HashAnchorSync />
      <a className="docs-skip-link" href="#journey-content">
        Skip to the project journey
      </a>

      <header className="docs-topbar journey-topbar">
        <div className="docs-topbar-inner">
          <a className="docs-brand" href="/" aria-label="SynthFlag home">
            <span>
              <ScanSearch aria-hidden="true" />
            </span>
            SynthFlag
          </a>
          <nav aria-label="Primary navigation">
            <a aria-current="page" href="/journey">
              Journey
            </a>
            <a href="/documentation">Technical appendix</a>
            <a className="docs-try-link" href="/try">
              Try detector
            </a>
          </nav>
        </div>
      </header>

      <section className="journey-hero">
        <div className="docs-hero-grid" aria-hidden="true" />
        <div className="journey-hero-inner">
          <div className="journey-hero-copy">
            <p className="docs-eyebrow">
              Four-day technical timeline · 29 August–1 September 2026
            </p>
            <h1>Four days. One defensible detector.</h1>
            <p>
              We began by deciding what evidence to trust. We ended with a
              protected result, a rejected shortcut, a released four-expert
              product, and a 15,000-image public benchmark that keeps its model
              boundary and low-FPR tradeoff visible.
            </p>
            <div className="journey-hero-actions">
              <a className="journey-primary-link" href="#day-one">
                Follow the story <ArrowDown aria-hidden="true" />
              </a>
              <a href="/try">
                Try the detector <ArrowUpRight aria-hidden="true" />
              </a>
            </div>
          </div>

          <ol className="journey-hero-map" aria-label="Four-day storyline">
            <li>
              <span>Day 1</span>
              <strong>Choose what to trust</strong>
              <small>Backbones · ROC-AUC · protected baseline</small>
            </li>
            <li>
              <span>Day 2</span>
              <strong>Design for the real internet</strong>
              <small>Distortions · CLIP + SigLIP · patch routing</small>
            </li>
            <li>
              <span>Day 3</span>
              <strong>Reject shortcuts. Build the product.</strong>
              <small>Domain guardrails · integration · roadmap</small>
            </li>
            <li>
              <span>Day 4</span>
              <strong>Measure clean and damaged inputs</strong>
              <small>TEST1 · 15,000 sources · low-FPR policy</small>
            </li>
          </ol>
        </div>
      </section>

      <div className="journey-shell">
        <aside className="journey-toc" aria-label="On this page">
          <p>Judge route</p>
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
          <p className="journey-toc-note">
            One chronological story. Exact implementation detail remains in the
            appendix.
          </p>
        </aside>

        <article className="journey-content" id="journey-content">
          <section className="journey-section journey-day" id="day-one">
            <DayHeader
              day="Day 1"
              date="Saturday · 29 August"
              title="Choose the metric, then protect the answer."
              question="Which representations look promising—and how do we stop ourselves from grading on the test?"
            />

            <div className="journey-story-grid">
              <div className="journey-story-copy">
                <p className="journey-kicker">
                  Backbone exploration, metric selection, and a protected
                  baseline
                </p>
                <p>
                  We screened several visual representations, then chose ROC-AUC
                  as the primary ranking metric. The close exploratory scores
                  were a direction finder—not a final leaderboard.
                </p>
              </div>
              <div className="journey-principle">
                <ShieldCheck aria-hidden="true" />
                <div>
                  <strong>Evidence before excitement</strong>
                  <p>
                    Small score gaps need paired confidence intervals and an
                    attached protocol before they can support a model-selection
                    claim.
                  </p>
                </div>
              </div>
            </div>

            <div className="journey-backbone-panel">
              <div className="journey-panel-heading">
                <div>
                  <p>Team-recorded exploratory screen</p>
                  <h3>Useful direction. Not protected-final evidence.</h3>
                </div>
                <StatusBadge kind="partial">Descriptive</StatusBadge>
              </div>
              <div className="journey-backbone-chart">
                {backboneScreen.map((item) => (
                  <div className="journey-backbone-row" key={item.name}>
                    <div>
                      <strong>{item.name}</strong>
                      {item.note ? <small>{item.note}</small> : null}
                    </div>
                    <div className="journey-backbone-track" aria-hidden="true">
                      <span
                        style={{
                          width: `${Math.max(8, ((item.value - 0.68) / 0.18) * 100)}%`,
                        }}
                      />
                    </div>
                    <output>{item.value.toFixed(3)}</output>
                  </div>
                ))}
              </div>
              <p className="journey-footnote">
                *The recorded “DINOv3-7” label needs scope confirmation if it
                refers to a 7B model. Protocol details for this exploratory
                screen remain to be attached.
              </p>
            </div>

            <div className="journey-auc-card">
              <div>
                <Gauge aria-hidden="true" />
                <span>Why ROC-AUC?</span>
              </div>
              <p>
                An AUC of 0.842 means the system ranks a random generated image
                above a random real image about 84.2% of the time. It does
                <strong> not</strong> mean 84.2% accuracy at one threshold.
              </p>
            </div>

            <div className="journey-benchmark-band">
              <div>
                <strong>10,002</strong>
                <span>balanced images</span>
                <small>5,001 real · 5,001 generated</small>
              </div>
              <ArrowRight aria-hidden="true" />
              <div>
                <strong>2,004</strong>
                <span>calibration rows</span>
                <small>threshold and development only</small>
              </div>
              <ArrowRight aria-hidden="true" />
              <div>
                <strong>7,998</strong>
                <span>protected final rows</span>
                <small>duplicate-aware · hash-audited</small>
              </div>
            </div>

            <div className="journey-threshold-story">
              <div className="journey-panel-heading">
                <div>
                  <p>Protected final result</p>
                  <h3>Move the operating point—not the ranking model.</h3>
                </div>
                <StatusBadge kind="adopted">Adopted</StatusBadge>
              </div>
              <div className="journey-metric-comparison">
                <div>
                  <span>Threshold 0.5</span>
                  <strong>0.7763</strong>
                  <small>balanced accuracy · recall 0.5924</small>
                </div>
                <ArrowRight aria-hidden="true" />
                <div>
                  <span>Threshold 0.28747</span>
                  <strong>0.8061</strong>
                  <small>balanced accuracy · recall 0.7127</small>
                </div>
              </div>
              <p>
                The lower threshold caught 481 additional generated images and
                produced 238 more correct decisions overall. Precision moved
                from 0.9371 to 0.8764 and specificity from 0.9602 to 0.8995.
                ROC-AUC stayed 0.8505 because the ranking scores never changed.
                This is an explicit review tradeoff—not free accuracy.
              </p>
            </div>
          </section>

          <section className="journey-section journey-day" id="day-two">
            <DayHeader
              day="Day 2"
              date="Sunday · 30 August"
              title="Stress the pixels, then choose complementary views."
              question="What survives compression, resizing, screenshots, and unfamiliar generators?"
            />

            <div className="journey-robustness-grid">
              <article>
                <span>01</span>
                <strong>JPEG Q40</strong>
                <output>−0.0306</output>
                <small>ROC-AUC change</small>
              </article>
              <article>
                <span>02</span>
                <strong>Half downscale</strong>
                <output>−0.0239</output>
                <small>ROC-AUC change</small>
              </article>
              <article>
                <span>03</span>
                <strong>Screenshot-like</strong>
                <output>−0.0198</output>
                <small>ROC-AUC change</small>
              </article>
            </div>
            <p className="journey-footnote">
              Retrospective stress tests on the 2,004 calibration rows.
              Distortion losses varied by source dataset, so the pooled changes
              are not universal robustness guarantees.
            </p>

            <div className="journey-model-choice">
              <div className="journey-panel-heading">
                <div>
                  <p>Released architecture</p>
                  <h3>Two encoders. Four independent experts.</h3>
                </div>
                <StatusBadge kind="adopted">Released</StatusBadge>
              </div>
              <div className="journey-lanes">
                <article className="journey-lane journey-lane-clip">
                  <div>
                    <span>CLIP</span>
                    <strong>224 × 224</strong>
                  </div>
                  <ul>
                    <li>16 × 16 = 256 patches + CLS</li>
                    <li>24 transformer blocks</li>
                    <li>1,024-wide tokens → 768-D feature</li>
                    <li>Heads 1 and 2</li>
                  </ul>
                </article>
                <article className="journey-lane journey-lane-siglip">
                  <div>
                    <span>SigLIP</span>
                    <strong>384 × 384</strong>
                  </div>
                  <ul>
                    <li>27 × 27 = 729 patch tokens</li>
                    <li>Six-pixel bottom/right remainder</li>
                    <li>27 blocks · 1,152-D feature</li>
                    <li>Heads 3 and 4</li>
                  </ul>
                </article>
              </div>
              <p className="journey-credit-note">
                SynthFlag provides a repository-authored, checkpoint-compatible
                implementation of the published four-expert method described by
                Tu et al. It does not claim to originate the architecture,
                training method, or checkpoints. Different objectives,
                resolutions, feature widths, and checkpoints make the encoders
                plausibly complementary; this work does not claim it proved a
                “semantics versus texture” split.
              </p>
            </div>

            <div className="journey-policy-boundary">
              <div>
                <FlaskConical aria-hidden="true" />
                <h3>A library is not a training policy.</h3>
              </div>
              <div className="journey-policy-stats">
                <p>
                  <strong>12</strong>
                  <span>basic operations</span>
                </p>
                <p>
                  <strong>19</strong>
                  <span>active extended operations</span>
                </p>
                <p>
                  <strong>≈35</strong>
                  <span>candidate functions</span>
                </p>
              </div>
              <p>
                The proposed 20% clean / 40% basic / 40% extended mix is a
                training design only when connected to a reproducible pipeline.
                Not every candidate transform reached that state during the
                sprint.
              </p>
            </div>
          </section>

          <section
            className="journey-section journey-model-section"
            id="released-model"
          >
            <span
              aria-hidden="true"
              className="journey-anchor-alias"
              id="final-model"
            />
            <div className="journey-section-heading">
              <p>Released model · Visual walkthrough</p>
              <h2>Follow one image from patches to the score signal.</h2>
            </div>
            <p className="journey-section-intro">
              The interactive trace turns the exact CLIP and SigLIP patch
              mathematics into a visual story. Highlighted cells are example
              routes—not importance, attribution, or proof.
            </p>
            <ModelJourney />
            <a
              className="journey-static-handoff"
              href="/documentation#deep-model"
            >
              <span>
                <Layers3 aria-hidden="true" />
                <span>
                  <strong>Need every tensor and boundary?</strong>
                  <small>
                    Open the full static execution figure and structured table.
                  </small>
                </span>
              </span>
              <ArrowUpRight aria-hidden="true" />
            </a>
          </section>

          <section className="journey-section journey-day" id="day-three">
            <DayHeader
              day="Day 3"
              date="Monday · 31 August"
              title="Let unfamiliar datasets veto the shortcut."
              question="Can a tiny learned adapter improve the headline without learning dataset identity?"
            />

            <div className="journey-head-experiment">
              <div className="journey-panel-heading">
                <div>
                  <p>Frozen-encoder head experiment</p>
                  <h3>The pooled score rose. The transfer guardrails fell.</h3>
                </div>
                <StatusBadge kind="rejected">Rejected</StatusBadge>
              </div>
              <div className="journey-head-summary">
                <div>
                  <span>Trainable parameters</span>
                  <strong>986,120</strong>
                  <small>≈0.0673% of 1.465B total</small>
                </div>
                <ArrowRight aria-hidden="true" />
                <div>
                  <span>Grouped pooled OOF</span>
                  <strong>0.8661 → 0.9462</strong>
                  <small>tempting, but insufficient</small>
                </div>
              </div>
              <div className="journey-domain-guardrails">
                <div>
                  <span>Held-out CIFAKE</span>
                  <strong>−0.0553</strong>
                </div>
                <div>
                  <span>Held-out WildFake</span>
                  <strong>−0.0465</strong>
                </div>
                <div>
                  <span>Held-out SID-Set</span>
                  <strong>+0.0154</strong>
                </div>
                <div>
                  <span>Mean held-out change</span>
                  <strong>−0.0288</strong>
                </div>
              </div>
              <div className="journey-final-decision">
                <Ban aria-hidden="true" />
                <p>
                  <strong>Decision: do not promote.</strong> The adapter learned
                  shortcuts that looked excellent in pooled development but did
                  not travel reliably. A separate WildFake-excluded run has
                  training OOF numbers, but its actual holdout report is
                  unfinished and is not a generalization result.
                </p>
              </div>
            </div>

            <div className="journey-interview" id="research-interview">
              <div className="journey-interview-copy">
                <div className="journey-panel-heading">
                  <div>
                    <p>Research interview · Day 3</p>
                    <h3>
                      A camera-forensics idea arrived late—and stayed future
                      work.
                    </h3>
                  </div>
                  <StatusBadge kind="partial">Exploratory</StatusBadge>
                </div>
                <p>
                  We interviewed Professor Ng Teck Khim about the local
                  statistics created by camera color-filter mosaics and
                  demosaicing. The conversation suggested examining small-block
                  variance, cross-channel relationships, mosaic phase, and the
                  ways blur or adversarial post-processing can erase or imitate
                  those clues.
                </p>
                <p>
                  Because the interview happened on Day 3, we had little time to
                  research and test the idea. Our early local-statistics
                  prototype was not strong or stable enough to support a final
                  claim. It was not used in the released four-expert model,
                  TEST1, or final model selection, and no performance number is
                  reported for it.
                </p>
                <div className="journey-interview-links">
                  <a
                    download
                    href="/interviews/prof-ng-teck-khim-day3-transcript.txt"
                  >
                    Download interview transcript
                  </a>
                  <a href="/documentation#research-interview">
                    Read the research boundary{' '}
                    <ArrowUpRight aria-hidden="true" />
                  </a>
                </div>
              </div>
              <figure>
                <Image
                  alt="Professor Ng Teck Khim and the SynthFlag team during a Day 3 video research interview"
                  height={679}
                  loading="lazy"
                  src="/interviews/prof-ng-teck-khim-day3.png"
                  width={1280}
                />
                <figcaption>
                  Day 3 research call. The image and transcript document the
                  conversation; they are not model-performance evidence.
                </figcaption>
              </figure>
            </div>

            <div className="journey-product-build">
              <div className="journey-section-heading journey-subheading">
                <p>Product integration</p>
                <h2>Then turn evidence into a usable review tool.</h2>
              </div>
              <div className="journey-build-grid">
                <article>
                  <Check aria-hidden="true" />
                  <strong>Verified artifacts</strong>
                  <p>
                    Checkpoint hashes, model card, rights notes, release audit.
                  </p>
                </article>
                <article>
                  <Check aria-hidden="true" />
                  <strong>Reliable inference</strong>
                  <p>
                    FastAPI service, resumable batches, serialized accelerator
                    jobs.
                  </p>
                </article>
                <article>
                  <Check aria-hidden="true" />
                  <strong>Judge-facing product</strong>
                  <p>
                    Upload workflow, architecture visuals, and technical
                    appendix.
                  </p>
                </article>
                <article>
                  <CircleDashed aria-hidden="true" />
                  <strong>Deployment is separate</strong>
                  <p>
                    Service connectivity is a live operational state, not model
                    evidence.
                  </p>
                </article>
              </div>
            </div>
          </section>

          <section className="journey-section journey-day" id="test1">
            <DayHeader
              day="Day 4"
              date="Tuesday · 1 September"
              title="Measure the frozen candidate—and keep the model boundary visible."
              question="What survives a paired composite corruption, and what recall remains when false positives are tightly constrained?"
            />

            <div className="journey-story-grid">
              <div className="journey-story-copy">
                <p className="journey-kicker">
                  TEST1 · completed public-development evidence
                </p>
                <p>
                  We scored 15,000 unique public images from balanced CIFAKE,
                  SID-Set, and WildFake subsets twice: clean and under one
                  deterministic one-to-five-operation composite corruption. That
                  produced 30,000 paired predictions at a fixed 0.5 reporting
                  threshold, with no TEST1 threshold tuning.
                </p>
              </div>
              <div className="journey-principle">
                <ShieldCheck aria-hidden="true" />
                <div>
                  <strong>
                    Corrected-v2 benchmark model—not the live model
                  </strong>
                  <p>
                    TEST1 uses an Expert-4/router and stored-head topology. The
                    released product remains the four-expert arithmetic mean;
                    these values cannot be transferred to it.
                  </p>
                </div>
              </div>
            </div>

            <div className="journey-robustness-grid journey-test1-grid">
              <article>
                <span>01</span>
                <strong>CIFAKE</strong>
                <output>0.9816 → 0.9095</output>
                <small>clean to augmented ROC-AUC · delta −0.0721</small>
              </article>
              <article>
                <span>02</span>
                <strong>SID-Set</strong>
                <output>0.8691 → 0.8439</output>
                <small>clean to augmented ROC-AUC · delta −0.0252</small>
              </article>
              <article>
                <span>03</span>
                <strong>WildFake</strong>
                <output>0.9467 → 0.8785</output>
                <small>clean to augmented ROC-AUC · delta −0.0682</small>
              </article>
            </div>
            <p className="journey-footnote">
              Descriptive macro ROC-AUC: 0.9324 clean and 0.8773 augmented.
              Per-dataset values are primary; this is not a pooled leaderboard
              score or the TikTok hidden test.
            </p>

            <div className="journey-policy-boundary">
              <div>
                <Gauge aria-hidden="true" />
                <h3>For TikTok operations, constrain false positives first.</h3>
              </div>
              <div className="journey-policy-stats">
                <p>
                  <strong>0.4376–0.7564</strong>
                  <span>clean TPR range at 1% FPR</span>
                </p>
                <p>
                  <strong>0.2036–0.5608</strong>
                  <span>augmented TPR range at 1% FPR</span>
                </p>
                <p>
                  <strong>0.5 fixed</strong>
                  <span>reporting point · not tuned on TEST1</span>
                </p>
              </div>
              <p>
                A false positive can wrongly question authentic work, interrupt
                distribution or monetization, and create an appeal.
                Consequential policy should therefore meet a validated FPR cap
                first, then reduce false negatives within that constraint. The
                fixed 0.5 point does not meet one common FPR target across the
                six TEST1 cells, so it is diagnostic—not a universal moderation
                cutoff. Separate calibration, slice monitoring, human review,
                and appeals remain mandatory.
              </p>
            </div>
          </section>

          <section className="journey-section" id="roadmap">
            <div className="journey-section-heading">
              <p>Roadmap · Questions worth testing</p>
              <h2>The next ideas stay visibly on the research side.</h2>
            </div>
            <div className="journey-roadmap-grid">
              <article>
                <div>
                  <Microscope aria-hidden="true" />
                  <StatusBadge kind="planned">Proposed</StatusBadge>
                </div>
                <h3>Local camera statistics</h3>
                <p>
                  Professor Ng Teck Khim’s interview prompted a forensic line of
                  inquiry: examine 10 × 10 blocks, cross-channel correlations,
                  and local variance associated with camera acquisition, Bayer
                  sampling, and demosaicing.
                </p>
                <small>
                  Briefly prototyped on Day 3; the early signal was not strong
                  or stable enough for a final result.
                </small>
              </article>
              <article>
                <div>
                  <Smartphone aria-hidden="true" />
                  <StatusBadge kind="planned">Planned</StatusBadge>
                </div>
                <h3>Short-video extension</h3>
                <p>
                  Extract eight midpoint frames in the browser, score them with
                  the image detector, then summarize cautiously with a mean or
                  top-k signal and a visible timeline.
                </p>
                <small>No temporal understanding is claimed.</small>
              </article>
            </div>
            <p className="journey-roadmap-note">
              A staged adaptation ladder—heads, then LayerNorm, LoRA, and final
              blocks—was proposed. Only the head-only experiment was completed,
              and it was rejected.
            </p>
          </section>

          <section className="journey-section" id="status">
            <div className="journey-section-heading">
              <p>End-of-sprint truth</p>
              <h2>Shipped, unfinished, and deliberately not claimed.</h2>
            </div>
            <div className="journey-release-grid">
              <article>
                <StatusBadge kind="adopted">Released</StatusBadge>
                <h3>Four-expert image inference</h3>
                <p>
                  CLIP 1 → CLIP 2 → SigLIP 3 → SigLIP 4, fused by (P3 + P4 + P1
                  + P2) / 4.
                </p>
              </article>
              <article>
                <StatusBadge kind="adopted">Measured</StatusBadge>
                <h3>Protected operating point</h3>
                <p>
                  Threshold 0.28747 was measured on the separate 7,998-image
                  final set after calibration.
                </p>
              </article>
              <article>
                <StatusBadge kind="adopted">Measured</StatusBadge>
                <h3>TEST1 public benchmark</h3>
                <p>
                  15,000 unique public sources and 30,000 paired clean/augmented
                  predictions for the benchmark-only corrected-v2 topology.
                </p>
              </article>
              <article>
                <StatusBadge kind="partial">Incomplete</StatusBadge>
                <h3>27,265-image benchmark</h3>
                <p>
                  Extraction work does not equal a final benchmark. No final
                  independent AUC is claimed here.
                </p>
              </article>
              <article>
                <StatusBadge kind="partial">Blocked</StatusBadge>
                <h3>V3 evaluation</h3>
                <p>
                  The exact source needed for the planned evaluation was
                  unavailable, so the metric remains unreported.
                </p>
              </article>
            </div>
            <div className="journey-responsible-boundary">
              <ShieldCheck aria-hidden="true" />
              <p>
                <strong>Score signal—not proof.</strong> SynthFlag is a triage
                aid for human review. It does not prove authorship, localize
                manipulation, or replace provenance and contextual evidence. For
                creator operations, consequential policy constrains false
                positives first and preserves an appeal path.
              </p>
            </div>
          </section>

          <section
            className="journey-next"
            aria-labelledby="journey-next-title"
          >
            <div>
              <p className="docs-eyebrow">Continue with one clear choice</p>
              <h2 id="journey-next-title">
                Try the product—or audit the technical details.
              </h2>
            </div>
            <div>
              <a className="journey-primary-link" href="/try">
                Try SynthFlag <ArrowUpRight aria-hidden="true" />
              </a>
              <a href="/documentation">
                Open technical appendix <ArrowRight aria-hidden="true" />
              </a>
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}
