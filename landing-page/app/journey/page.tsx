/* oxlint-disable next/no-html-link-for-pages -- vinext's production next/link prefetch shim currently breaks route clicks; standard anchors keep public navigation reliable. */
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Ban,
  Check,
  CircleDashed,
  FlaskConical,
  ScanSearch,
  ShieldCheck,
} from 'lucide-react';

import { HashAnchorSync } from '../documentation/hash-anchor-sync';
import { ModelJourney } from '../documentation/architecture/model-journey';
import '../documentation/documentation.css';
import '../documentation/architecture/architecture.css';
import './journey.css';

const contents = [
  ['challenge', 'The challenge'],
  ['decisions', 'Decision map'],
  ['v1', 'V1 · operating point'],
  ['v2', 'V2 · learned fusion'],
  ['robustness', 'Robustness'],
  ['final-model', 'Final model'],
  ['release', 'Release boundary'],
] as const;

const experimentCards = [
  {
    id: 'v1',
    number: '01',
    eyebrow: 'V1 · protected final evidence',
    title: 'Move the decision threshold—not the ranking model',
    status: 'Adopted',
    statusKind: 'adopted',
    question:
      'Could a frozen operating point recover more generated images without retraining the four experts?',
    change:
      'We selected 0.28747 on 2,004 calibration rows, froze it, then compared it with 0.5 on a separate 7,998-image final set.',
    evidence: (
      <div
        className="journey-metric-comparison"
        aria-label="V1 protected final comparison"
      >
        <div>
          <span>Released mean · threshold 0.5</span>
          <strong>0.7763</strong>
          <small>balanced accuracy · recall 0.5924</small>
        </div>
        <ArrowRight aria-hidden="true" />
        <div>
          <span>Same mean · threshold 0.28747</span>
          <strong>0.8061</strong>
          <small>balanced accuracy · recall 0.7127</small>
        </div>
      </div>
    ),
    note: 'ROC-AUC stayed 0.8505 because the scores did not change. Precision moved from 0.9371 to 0.8764: a deliberate review tradeoff, not a free improvement.',
    decision:
      'Keep the released mean and document both operating profiles. Never describe thresholding as a ranking gain.',
  },
  {
    id: 'v2',
    number: '02',
    eyebrow: 'V2 · development evidence only',
    title: 'Reject the clever fusion that did not travel',
    status: 'Rejected',
    statusKind: 'rejected',
    question:
      'Could a disagreement-aware learned fusion beat the equal mean across unfamiliar datasets?',
    change:
      'We evaluated logistic fusion with nested, duplicate-grouped cross-validation on the same 2,004 calibration rows. The protected V1 final rows stayed untouched.',
    evidence: (
      <div
        className="journey-metric-comparison journey-metric-rejected"
        aria-label="V2 pooled and transfer comparison"
      >
        <div>
          <span>Released equal mean</span>
          <strong>0.8661</strong>
          <small>pooled development ROC-AUC</small>
        </div>
        <ArrowRight aria-hidden="true" />
        <div>
          <span>Learned logistic fusion</span>
          <strong>0.8752</strong>
          <small>pooled · but every transfer guardrail failed</small>
        </div>
      </div>
    ),
    note: 'Leave-one-dataset-out changes were −0.0614 on CIFAKE, −0.2198 on SID_Set, and −0.0842 on WildFake.',
    decision:
      'Do not promote the learned rule. Generalization mattered more than the small pooled gain, so the equal mean remains production baseline.',
  },
] as const;

function StatusBadge({
  kind,
  children,
}: {
  kind: string;
  children: React.ReactNode;
}) {
  return (
    <span className={`journey-status journey-status-${kind}`}>{children}</span>
  );
}

function DecisionRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="journey-decision-row">
      <span>{label}</span>
      <div>{children}</div>
    </div>
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
              Project journey · evidence before claims
            </p>
            <h1>How SynthFlag became SynthFlag.</h1>
            <p>
              From an open-world detection problem to a released four-expert
              review signal—through the choices we adopted, the ideas we
              rejected, and the evidence we kept protected.
            </p>
            <div className="journey-hero-actions">
              <a className="journey-primary-link" href="#decisions">
                Follow the decisions <ArrowDown aria-hidden="true" />
              </a>
              <a href="/try">
                Try the detector <ArrowUpRight aria-hidden="true" />
              </a>
            </div>
          </div>

          <div
            className="journey-hero-map"
            aria-label="Project journey summary"
          >
            <div>
              <span>01</span>
              <strong>Start with the released detector</strong>
              <small>
                FeatDistill research lineage · four independent experts
              </small>
            </div>
            <div>
              <span>02</span>
              <strong>Stress every proposed change</strong>
              <small>
                Protected split · dataset transfer · corruption checks
              </small>
            </div>
            <div>
              <span>03</span>
              <strong>Ship the simplest rule that held up</strong>
              <small>Equal mean · explicit threshold · review signal</small>
            </div>
          </div>
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
            One narrative. Exact technical detail remains in the appendix.
          </p>
        </aside>

        <article className="journey-content" id="journey-content">
          <section className="journey-section journey-challenge" id="challenge">
            <div className="journey-section-heading">
              <p>01 · The challenge</p>
              <h2>A useful detector must survive more than one benchmark.</h2>
            </div>
            <div className="journey-challenge-grid">
              <p className="journey-lead">
                AI-image detection is open-world: generators, compression,
                screenshots, and source datasets keep changing. A pooled metric
                can look better while a method becomes less reliable on the next
                dataset.
              </p>
              <div className="journey-principle">
                <ShieldCheck aria-hidden="true" />
                <div>
                  <strong>Our rule</strong>
                  <p>
                    A change had to respect the protected final set and survive
                    dataset-transfer checks before it could replace the released
                    equal-mean model.
                  </p>
                </div>
              </div>
            </div>
            <p className="journey-credit-note">
              SynthFlag is our public review experience. Its detector follows
              the released FeatDistill architecture from UESTC research; this
              journey describes our validation and product decisions, not a
              claim that we originated that underlying detector.
            </p>
          </section>

          <section className="journey-section" id="decisions">
            <div className="journey-section-heading">
              <p>02 · Decision map</p>
              <h2>The shortest honest route from experiment to release.</h2>
            </div>
            <ol className="journey-decision-map">
              <li>
                <StatusBadge kind="protected">Protected final</StatusBadge>
                <strong>Freeze the operating point</strong>
                <p>
                  Choose on calibration rows; measure once on held-out rows.
                </p>
              </li>
              <li>
                <StatusBadge kind="rejected">Rejected</StatusBadge>
                <strong>Learned fusion</strong>
                <p>A pooled gain failed every dataset-transfer guardrail.</p>
              </li>
              <li>
                <StatusBadge kind="development">Development only</StatusBadge>
                <strong>Robustness probes</strong>
                <p>
                  Corruptions revealed failure modes, not solved invariance.
                </p>
              </li>
              <li>
                <StatusBadge kind="adopted">Released</StatusBadge>
                <strong>Equal mean + review context</strong>
                <p>
                  The simplest defensible score signal stayed in production.
                </p>
              </li>
            </ol>
          </section>

          {experimentCards.map((experiment) => (
            <section
              className="journey-section journey-experiment"
              id={experiment.id}
              key={experiment.id}
            >
              <div className="journey-experiment-topline">
                <div>
                  <span>{experiment.number}</span>
                  <p>{experiment.eyebrow}</p>
                </div>
                <StatusBadge kind={experiment.statusKind}>
                  {experiment.status}
                </StatusBadge>
              </div>
              <h2>{experiment.title}</h2>
              <div className="journey-decision-card">
                <DecisionRow label="Question">
                  <p>{experiment.question}</p>
                </DecisionRow>
                <DecisionRow label="Change">
                  <p>{experiment.change}</p>
                </DecisionRow>
                <DecisionRow label="Evidence">
                  {experiment.evidence}
                  <p className="journey-evidence-note">{experiment.note}</p>
                </DecisionRow>
                <DecisionRow label="Decision">
                  <p className="journey-final-decision">
                    <Check aria-hidden="true" />
                    {experiment.decision}
                  </p>
                </DecisionRow>
              </div>
            </section>
          ))}

          <section className="journey-section" id="robustness">
            <div className="journey-section-heading">
              <p>05 · Robustness</p>
              <h2>Find the fragile conditions—and say so plainly.</h2>
            </div>
            <div className="journey-robustness-grid">
              <div className="journey-robustness-copy">
                <StatusBadge kind="development">Development only</StatusBadge>
                <h3>Ranking fell most under three ordinary transformations.</h3>
                <p>
                  These are deterministic probes on development evidence. They
                  reveal where the released ranking is vulnerable; they do not
                  prove robustness to every edit or platform pipeline.
                </p>
              </div>
              <ol aria-label="Largest pooled ROC-AUC losses">
                <li>
                  <span>JPEG quality 40</span>
                  <strong>−0.0306</strong>
                </li>
                <li>
                  <span>Half downscale</span>
                  <strong>−0.0239</strong>
                </li>
                <li>
                  <span>Screenshot-like</span>
                  <strong>−0.0198</strong>
                </li>
              </ol>
            </div>
            <p className="journey-final-decision journey-inline-decision">
              <Check aria-hidden="true" />
              Decision: expose uncertainty and send borderline cases to human
              review. Do not turn a detector score into a provenance claim.
            </p>
          </section>

          <section
            className="journey-section journey-model-section"
            id="final-model"
          >
            <div className="journey-section-heading">
              <p>06 · The released path</p>
              <h2>Now follow one image through the model we kept.</h2>
            </div>
            <p className="journey-lead">
              The animation explains deterministic patch routing and serial
              expert order. Highlighted cells are examples—not attention,
              attribution, localization, or evidence that a dog is synthetic.
            </p>
            <ModelJourney />
            <aside className="journey-static-handoff">
              <div>
                <span>Static and print-friendly fallback</span>
                <strong>Need the complete execution graph?</strong>
                <p>
                  The technical appendix retains the downloadable SVG and its
                  structured text alternative at the original deep link.
                </p>
              </div>
              <a href="/documentation/architecture#deep-model">
                Open static model graph <ArrowUpRight aria-hidden="true" />
              </a>
            </aside>
          </section>

          <section className="journey-section" id="release">
            <div className="journey-section-heading">
              <p>07 · Release boundary</p>
              <h2>
                What is verified, what is withheld, and what is still blocked.
              </h2>
            </div>
            <div className="journey-release-grid">
              <article>
                <Check aria-hidden="true" />
                <StatusBadge kind="adopted">Released</StatusBadge>
                <h3>Four-expert equal mean</h3>
                <p>
                  Two CLIP and two SigLIP experts feed one score. The interface
                  frames it as a review signal—not proof.
                </p>
              </article>
              <article>
                <Ban aria-hidden="true" />
                <StatusBadge kind="protected">Protected</StatusBadge>
                <h3>Evidence stays bounded</h3>
                <p>
                  Public materials exclude private images, checkpoints,
                  per-image scores, and protected evaluation rows.
                </p>
              </article>
              <article>
                <CircleDashed aria-hidden="true" />
                <StatusBadge kind="blocked">Blocked</StatusBadge>
                <h3>V3 has no metric</h3>
                <p>
                  The exact organizer DALL-E Advanced 8,843-image source is
                  absent. We did not substitute another dataset or invent a
                  result.
                </p>
              </article>
            </div>
          </section>

          <section className="journey-next">
            <FlaskConical aria-hidden="true" />
            <div>
              <p>Ready to inspect the result?</p>
              <h2>Try the signal, then audit the details.</h2>
            </div>
            <div>
              <a className="journey-primary-link" href="/try">
                Try detector <ArrowUpRight aria-hidden="true" />
              </a>
              <a href="/documentation">
                Technical appendix <ArrowRight aria-hidden="true" />
              </a>
            </div>
          </section>
        </article>
      </div>

      <footer className="docs-footer journey-footer">
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
          <a href="/">Home</a>
          <a href="/documentation">Technical appendix</a>
          <a href="#challenge">Back to top</a>
        </div>
      </footer>
    </main>
  );
}
