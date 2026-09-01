/* oxlint-disable next/no-html-link-for-pages -- standard anchors preserve production route reliability. */
import { ArrowUpRight, ScanSearch } from 'lucide-react';
import type { ReactNode } from 'react';

import { HashAnchorSync } from './hash-anchor-sync';
import { PrintButton } from './print-button';
import './documentation.css';
import './architecture/architecture.css';
import './light-theme.css';

const contentGroups = [
  {
    label: 'Selected runtime',
    links: [
      ['overview', 'In one minute'],
      ['input', 'Input and preprocessing'],
      ['architecture', 'Expert 4 and heads'],
      ['routing', 'Route and score'],
    ],
  },
  {
    label: 'Evidence',
    links: [
      ['test1', 'TEST1 results'],
      ['limits', 'Limits and rights'],
      ['operations', 'Runtime and outputs'],
      ['sources', 'Sources'],
    ],
  },
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
    <main className="docs-page atlas-page">
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
            <a href="/journey">Journey</a>
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
            <span aria-current="page">Technical appendix</span>
          </nav>
          <div className="docs-hero-copy">
            <p className="docs-eyebrow">
              Selected TEST1 graph · source checked
            </p>
            <h1>One frozen teacher. Three residual heads. Two routes.</h1>
            <p>
              The current detector records native image size, extracts one Tu et
              al. Expert 4 representation, and applies a fixed routed
              correction. This guide keeps its evidence and rights limits next
              to the technical details.
            </p>
          </div>
          <div className="docs-hero-stats" aria-label="System summary">
            <div>
              <strong>01</strong>
              <span>frozen Expert 4</span>
            </div>
            <div>
              <strong>03</strong>
              <span>residual heads</span>
            </div>
            <div>
              <strong>0–1</strong>
              <span>review signal</span>
            </div>
          </div>
        </div>
      </section>

      <div className="docs-shell">
        <aside className="docs-toc" aria-label="On this page">
          <p>On this page</p>
          <div className="docs-toc-groups">
            {contentGroups.map((group, groupIndex) => (
              <section key={group.label} aria-labelledby={`toc-${groupIndex}`}>
                <h2 id={`toc-${groupIndex}`}>{group.label}</h2>
                <ol>
                  {group.links.map(([id, label], index) => (
                    <li key={id}>
                      <a href={`#${id}`}>
                        <span>
                          {String(groupIndex + 1).padStart(2, '0')}.
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        {label}
                      </a>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
          <div className="docs-toc-note">
            <span aria-hidden="true" />
            Public development evidence
          </div>
        </aside>

        <article id="documentation-content" className="docs-content">
          <nav className="docs-route-index" aria-label="SynthFlag guides">
            <a href="/journey">
              <span>Judge narrative</span>
              <strong>Project journey</strong>
              <ArrowUpRight aria-hidden="true" />
            </a>
            <a href="#routing">
              <span>Executable contract</span>
              <strong>Exact score route</strong>
              <ArrowUpRight aria-hidden="true" />
            </a>
            <a href="/try">
              <span>Interactive surface</span>
              <strong>Try detector</strong>
              <ArrowUpRight aria-hidden="true" />
            </a>
          </nav>

          <section id="overview" className="docs-section docs-overview">
            <SectionHeading kicker="Start here">In one minute</SectionHeading>
            <div className="docs-lead-grid">
              <p className="docs-lead">
                SynthFlag uses a frozen upstream Tu et al. Expert 4 SigLIP
                encoder and teacher head. Three project-trained lightweight
                heads correct that teacher margin. Native images at most 64 px
                use a specialist; larger images use a fixed two-head stack.
              </p>
              <div className="docs-score-card">
                <span>Example output</span>
                <strong>0.78</strong>
                <div aria-hidden="true">
                  <span />
                </div>
                <p>Higher means a stronger AI-positive model signal.</p>
              </div>
            </div>
            <div className="docs-answer-grid">
              <div>
                <span>01</span>
                <h3>What goes in?</h3>
                <p>One image, eight browser-sampled frames, or a CLI folder.</p>
              </div>
              <div>
                <span>02</span>
                <h3>What happens?</h3>
                <p>
                  One 384 px SigLIP view is scored through a native-size route.
                </p>
              </div>
              <div>
                <span>03</span>
                <h3>What comes out?</h3>
                <p>
                  A continuous score, plus traceable batch or frame metadata.
                </p>
              </div>
              <div>
                <span>04</span>
                <h3>What does it prove?</h3>
                <p>Nothing alone. It is a review signal, not origin proof.</p>
              </div>
            </div>
          </section>

          <section id="input" className="docs-section">
            <SectionHeading kicker="01 · Preserve native context">
              Record size, then create one SigLIP view
            </SectionHeading>
            <div className="docs-explainer-grid">
              <div className="docs-explainer">
                <EvidenceTag kind="code">Released code</EvidenceTag>
                <p className="docs-section-lead">
                  Routing uses the original longest side, so dimensions are
                  recorded before RGB conversion and resize.
                </p>
                <ul>
                  <li>Decode and validate the image.</li>
                  <li>
                    Record <code>max(native width, native height)</code>.
                  </li>
                  <li>Bicubic-resize the short edge to 384 px.</li>
                  <li>
                    Center-crop to 384 square and normalize with mean/std 0.5.
                  </li>
                </ul>
              </div>
              <div className="docs-does-not-prove">
                <p>Input contract</p>
                <ul>
                  <li>RGB pixels only</li>
                  <li>no EXIF or provenance metadata</li>
                  <li>no random inference augmentation</li>
                  <li>video audio and motion are not analyzed</li>
                </ul>
              </div>
            </div>
          </section>

          <section id="architecture" className="docs-section">
            <SectionHeading kicker="02 · Frozen teacher + project heads">
              The selected graph
            </SectionHeading>
            <div className="docs-explainer-grid">
              <div className="docs-explainer">
                <EvidenceTag kind="paper">Upstream lineage</EvidenceTag>
                <EvidenceTag kind="code">Released code</EvidenceTag>
                <p className="docs-section-lead">
                  Expert 4 produces a pooled 1,152-dimensional feature and two
                  teacher logits. Each residual head adds one learned scalar to
                  the detached teacher margin.
                </p>
                <ul>
                  <li>
                    <strong>Teacher:</strong> Tu et al. Expert 4, SigLIP So400M
                    Patch14-384.
                  </li>
                  <li>
                    <strong>Margin:</strong> <code>logit[1] - logit[0]</code>.
                  </li>
                  <li>
                    <strong>Head:</strong> LayerNorm → Linear(256) → GELU →
                    Dropout → Linear(1).
                  </li>
                  <li>
                    297,729 parameters per head; 429,414,469 loaded total.
                  </li>
                </ul>
              </div>
              <div
                className="docs-equation"
                aria-label="corrected margin formula"
              >
                <span>corrected margin =</span>
                <strong>teacher + α × residual(feature)</strong>
              </div>
            </div>
          </section>

          <section id="routing" className="docs-section">
            <SectionHeading kicker="03 · Deterministic route">
              The exact score conversion
            </SectionHeading>
            <div className="docs-consideration-grid">
              <div>
                <EvidenceTag kind="code">≤64 px route</EvidenceTag>
                <h3>CIFAKE specialist</h3>
                <p>
                  <code>score = sigmoid(teacher + 1.25 × residual_low)</code>
                </p>
              </div>
              <div>
                <EvidenceTag kind="code">&gt;64 px route</EvidenceTag>
                <h3>Fixed two-head stack</h3>
                <p>
                  Blend corrected epoch-05 and epoch-08 margins 0.65 / 0.35,
                  then subtract <code>-1.557959395647049</code> before sigmoid.
                </p>
              </div>
            </div>
            <p className="docs-section-lead">
              TEST1 reports threshold metrics at score 0.5. That convention is
              not a universal production threshold or calibration guarantee.
            </p>
          </section>

          <section id="test1" className="docs-section">
            <SectionHeading kicker="04 · Public development diagnostic">
              TEST1 results
            </SectionHeading>
            <div className="docs-results-grid">
              <div>
                <span>CIFAKE AUC</span>
                <strong>0.9816</strong>
                <p>clean · 0.9095 composite</p>
              </div>
              <div>
                <span>SID-Set AUC</span>
                <strong>0.8691</strong>
                <p>clean · 0.8439 composite</p>
              </div>
              <div>
                <span>WildFake AUC</span>
                <strong>0.9467</strong>
                <p>clean · 0.8785 composite</p>
              </div>
            </div>
            <p className="docs-section-lead">
              TEST1 contains 15,000 unique public sources and 30,000 aligned
              clean/composite evaluations. It is not TikTok&apos;s hidden test.
              The public suites were previously inspected and native resolution
              sends all TEST1 CIFAKE images to the specialist.
            </p>
          </section>

          <section id="limits" className="docs-section">
            <SectionHeading kicker="05 · Keep the boundary attached">
              Limitations, rights, and eligibility
            </SectionHeading>
            <div className="docs-consideration-grid">
              <div>
                <EvidenceTag kind="guidance">Owner accepted</EvidenceTag>
                <h3>Collaborator rights attestation</h3>
                <p>
                  The collaborator attests that the residual heads and training
                  inputs are rights-cleared for project use. The project owner
                  accepts that assurance; it was not independently audited here.
                </p>
              </div>
              <div>
                <EvidenceTag kind="guidance">Upstream dependency</EvidenceTag>
                <h3>Expert 4 remains upstream</h3>
                <p>
                  Its redistribution permission is unproven, and an existing
                  AIGC detector may require explicit organizer clearance.
                </p>
              </div>
              <div>
                <EvidenceTag kind="guidance">Error profile</EvidenceTag>
                <h3>Both errors matter</h3>
                <p>
                  SID misses many local tamper positives; composite WildFake
                  produces 861 false positives at the reported boundary.
                </p>
              </div>
              <div>
                <EvidenceTag kind="guidance">Interpretation</EvidenceTag>
                <h3>Use review and provenance</h3>
                <p>
                  Do not infer creator, generator, edit location, or authentic
                  provenance from one score.
                </p>
              </div>
            </div>
          </section>

          <section id="operations" className="docs-section">
            <SectionHeading kicker="06 · Product contract">
              Service, video frames, and batch records
            </SectionHeading>
            <div className="docs-answer-grid">
              <div>
                <span>API</span>
                <h3>One cached model</h3>
                <p>
                  One active and one queued request; prediction is serialized.
                </p>
              </div>
              <div>
                <span>VIDEO</span>
                <h3>Eight local samples</h3>
                <p>Only midpoint PNG frames cross the upload boundary.</p>
              </div>
              <div>
                <span>CLI</span>
                <h3>Resumable output</h3>
                <p>CSV, atomic Track 5 JSON, and run metadata.</p>
              </div>
              <div>
                <span>CHECKS</span>
                <h3>Four file identities</h3>
                <p>Expert 4 and all three heads pass size/hash verification.</p>
              </div>
            </div>
          </section>

          <section id="sources" className="docs-section docs-sources">
            <SectionHeading kicker="Trace the evidence">
              Sources and downloads
            </SectionHeading>
            <div className="docs-source-list">
              <a
                href="https://arxiv.org/html/2603.21939v1"
                rel="noreferrer"
                target="_blank"
              >
                <span>Upstream method</span>
                <strong>Tu et al. technical report</strong>
                <ArrowUpRight aria-hidden="true" />
              </a>
              <a
                href="https://github.com/Ducksss/TikTok-TechJam-2026"
                rel="noreferrer"
                target="_blank"
              >
                <span>Released source</span>
                <strong>TikTok-TechJam-2026 repository</strong>
                <ArrowUpRight aria-hidden="true" />
              </a>
              <a href="/journey">
                <span>Judge narrative</span>
                <strong>Project journey and decisions</strong>
                <ArrowUpRight aria-hidden="true" />
              </a>
            </div>
            <p className="docs-source-note">
              The retired 18-diagram four-expert atlas remains in repository
              history as baseline documentation. It is not the selected runtime
              contract; current behavior is defined by the Expert 4 plus
              three-head implementation and manifest.
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
          <a href="/journey">Journey</a>
          <a href="/try">Try detector</a>
          <a href="#overview">Back to top</a>
        </div>
      </footer>
    </main>
  );
}
