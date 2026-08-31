'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const stages = [
  {
    label: 'Decode once',
    title: 'Validate the file and convert it to RGB',
    detail:
      'The service checks the upload boundary, decodes one image, and produces the shared RGB source used by both model families.',
  },
  {
    label: 'Create two views',
    title: 'Build the native CLIP and SigLIP inputs',
    detail:
      'Bicubic resize and center crop produce a normalized 224 px CLIP tensor and a separately normalized 384 px SigLIP tensor.',
  },
  {
    label: 'Patchify',
    title: 'Turn pixels into visual tokens',
    detail:
      'CLIP creates 256 image patches plus one CLS token. SigLIP creates 729 patch tokens and does not add a CLS token.',
  },
  {
    label: 'Encode',
    title: 'Let each backbone exchange evidence across the image',
    detail:
      'CLIP applies 24 transformer blocks at width 1,024. SigLIP applies 27 blocks at width 1,152. The repeated blocks are summarized here, not omitted.',
  },
  {
    label: 'Pool features',
    title: 'Condense each token field into one feature vector',
    detail:
      'CLIP selects and projects its CLS representation to 768 features. SigLIP uses learned-probe attention pooling to produce 1,152 features.',
  },
  {
    label: 'Run four heads',
    title: 'Score four independent checkpoint-specific experts',
    detail:
      'The released call order is CLIP 1, CLIP 2, SigLIP 3, then SigLIP 4. Every 256-unit binary head produces its own class-one softmax signal.',
  },
  {
    label: 'Fuse',
    title: 'Average four signals into one review score',
    detail:
      'The exact released arithmetic is (P3 + P4 + P1 + P2) / 4. The result is a review signal—not proof, attribution, or localization.',
  },
] as const;

const lastStage = stages.length - 1;

export function ModelJourney() {
  const root = useRef<HTMLDivElement>(null);
  const replayTween = useRef<gsap.core.Tween | null>(null);
  const replaying = useRef(false);
  const [activeStage, setActiveStage] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);

  useEffect(() => {
    const element = root.current;
    if (!element) return;

    const media = gsap.matchMedia();
    media.add(
      '(min-width: 900px) and (prefers-reduced-motion: no-preference)',
      () => {
        const trigger = ScrollTrigger.create({
          trigger: element,
          start: 'top 18%',
          end: 'bottom 82%',
          scrub: 0.65,
          onUpdate: (self) => {
            if (replaying.current) return;
            setActiveStage(
              Math.min(lastStage, Math.floor(self.progress * stages.length)),
            );
          },
        });

        return () => trigger.kill();
      },
    );

    return () => {
      replayTween.current?.kill();
      media.revert();
    };
  }, []);

  const selectStage = useCallback((stage: number) => {
    replayTween.current?.kill();
    replaying.current = false;
    setIsReplaying(false);
    setActiveStage(Math.max(0, Math.min(lastStage, stage)));
  }, []);

  const replay = useCallback(() => {
    replayTween.current?.kill();
    const playhead = { stage: 0 };
    replaying.current = true;
    setIsReplaying(true);
    setActiveStage(0);
    replayTween.current = gsap.to(playhead, {
      stage: lastStage,
      duration: 7.2,
      ease: 'none',
      snap: { stage: 1 },
      onUpdate: () => setActiveStage(Math.round(playhead.stage)),
      onComplete: () => {
        replaying.current = false;
        setIsReplaying(false);
      },
    });
  }, []);

  const stage = stages[activeStage];

  return (
    <div
      className="model-journey"
      data-stage={activeStage}
      ref={root}
      tabIndex={-1}
    >
      <div className="model-journey-sticky">
        <div className="journey-heading">
          <div>
            <p>Interactive execution trace</p>
            <h3>Follow one image through the released model</h3>
          </div>
          <span>Illustrative walkthrough—not a model prediction</span>
        </div>

        <div className="journey-stage" aria-hidden="true">
          <svg viewBox="0 0 1200 650" role="presentation">
            <defs>
              <clipPath id="journey-input-clip">
                <rect x="37" y="204" width="174" height="174" rx="20" />
              </clipPath>
              <clipPath id="journey-clip-crop">
                <rect x="280" y="100" width="128" height="128" rx="15" />
              </clipPath>
              <clipPath id="journey-siglip-crop">
                <rect x="280" y="419" width="128" height="128" rx="15" />
              </clipPath>
              <pattern
                id="journey-grid-blue"
                width="16"
                height="16"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M16 0H0V16"
                  fill="none"
                  stroke="#8fb7ff"
                  strokeWidth="1"
                />
              </pattern>
              <pattern
                id="journey-grid-gold"
                width="10.666"
                height="10.666"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M10.666 0H0V10.666"
                  fill="none"
                  stroke="#ffd270"
                  strokeWidth="0.8"
                />
              </pattern>
              <filter
                id="journey-glow"
                x="-80%"
                y="-80%"
                width="260%"
                height="260%"
              >
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <path
              className="journey-rail rail-clip"
              d="M212 291 C245 291 248 164 280 164 H1008"
            />
            <path
              className="journey-rail rail-siglip"
              d="M212 291 C245 291 248 483 280 483 H1008"
            />
            <path
              className="journey-rail rail-fusion"
              d="M1012 164 C1070 164 1050 278 1105 310"
            />
            <path
              className="journey-rail rail-fusion"
              d="M1012 483 C1070 483 1050 348 1105 320"
            />

            <g className="journey-node journey-input">
              <rect x="25" y="150" width="198" height="286" rx="25" />
              <image
                clipPath="url(#journey-input-clip)"
                href="/architecture/dog-input.jpg"
                x="37"
                y="204"
                width="174"
                height="174"
                preserveAspectRatio="xMidYMid slice"
              />
              <text x="48" y="181" className="node-kicker">
                INPUT · ONE IMAGE
              </text>
              <text x="48" y="403" className="node-title">
                validated · decoded · RGB
              </text>
              <circle className="journey-scan-dot" cx="200" cy="182" r="5" />
            </g>

            <g className="journey-node journey-view journey-view-clip">
              <rect x="268" y="67" width="152" height="212" rx="22" />
              <image
                clipPath="url(#journey-clip-crop)"
                href="/architecture/dog-input.jpg"
                x="280"
                y="100"
                width="128"
                height="128"
                preserveAspectRatio="xMidYMid slice"
              />
              <rect
                className="journey-patch-grid clip-grid"
                x="280"
                y="100"
                width="128"
                height="128"
                rx="15"
              />
              <text x="290" y="91" className="node-kicker">
                CLIP VIEW
              </text>
              <text x="290" y="252" className="node-title">
                224 × 224
              </text>
            </g>

            <g className="journey-node journey-view journey-view-siglip">
              <rect x="268" y="386" width="152" height="212" rx="22" />
              <image
                clipPath="url(#journey-siglip-crop)"
                href="/architecture/dog-input.jpg"
                x="280"
                y="419"
                width="128"
                height="128"
                preserveAspectRatio="xMidYMid slice"
              />
              <rect
                className="journey-patch-grid siglip-grid"
                x="280"
                y="419"
                width="128"
                height="128"
                rx="15"
              />
              <text x="290" y="410" className="node-kicker">
                SIGLIP VIEW
              </text>
              <text x="290" y="571" className="node-title">
                384 × 384
              </text>
            </g>

            <g className="journey-node journey-token journey-token-clip">
              <rect x="462" y="92" width="136" height="144" rx="20" />
              <text x="480" y="121" className="node-kicker">
                TOKENS
              </text>
              <text x="480" y="160" className="node-number">
                256 + CLS
              </text>
              <text x="480" y="190" className="node-caption">
                [B,257,1024]
              </text>
            </g>
            <g className="journey-node journey-token journey-token-siglip">
              <rect x="462" y="411" width="136" height="144" rx="20" />
              <text x="480" y="440" className="node-kicker">
                TOKENS
              </text>
              <text x="480" y="479" className="node-number">
                729
              </text>
              <text x="480" y="509" className="node-caption">
                [B,729,1152]
              </text>
            </g>

            <g className="journey-node journey-transformer journey-transformer-clip">
              <rect x="638" y="80" width="150" height="168" rx="20" />
              <rect x="652" y="66" width="122" height="168" rx="18" />
              <rect x="666" y="52" width="94" height="168" rx="16" />
              <text x="682" y="102" className="node-kicker">
                TRANSFORMER
              </text>
              <text x="682" y="148" className="node-number">
                ×24
              </text>
              <text x="682" y="181" className="node-caption">
                width 1,024
              </text>
            </g>
            <g className="journey-node journey-transformer journey-transformer-siglip">
              <rect x="638" y="399" width="150" height="168" rx="20" />
              <rect x="652" y="385" width="122" height="168" rx="18" />
              <rect x="666" y="371" width="94" height="168" rx="16" />
              <text x="682" y="421" className="node-kicker">
                TRANSFORMER
              </text>
              <text x="682" y="467" className="node-number">
                ×27
              </text>
              <text x="682" y="500" className="node-caption">
                width 1,152
              </text>
            </g>

            <g className="journey-node journey-pool journey-pool-clip">
              <rect x="824" y="101" width="128" height="126" rx="63" />
              <text x="888" y="143" textAnchor="middle" className="node-kicker">
                CLS POOL
              </text>
              <text x="888" y="179" textAnchor="middle" className="node-number">
                768
              </text>
              <text
                x="888"
                y="203"
                textAnchor="middle"
                className="node-caption"
              >
                features
              </text>
            </g>
            <g className="journey-node journey-pool journey-pool-siglip">
              <rect x="824" y="420" width="128" height="126" rx="63" />
              <text x="888" y="457" textAnchor="middle" className="node-kicker">
                PROBE POOL
              </text>
              <text x="888" y="493" textAnchor="middle" className="node-number">
                1,152
              </text>
              <text
                x="888"
                y="517"
                textAnchor="middle"
                className="node-caption"
              >
                features
              </text>
            </g>

            <g className="journey-heads journey-heads-clip">
              <g className="journey-head head-one">
                <rect x="978" y="88" width="76" height="65" rx="12" />
                <text
                  x="1016"
                  y="115"
                  textAnchor="middle"
                  className="node-kicker"
                >
                  CLIP 1
                </text>
                <text
                  x="1016"
                  y="139"
                  textAnchor="middle"
                  className="node-title"
                >
                  P1
                </text>
              </g>
              <g className="journey-head head-two">
                <rect x="978" y="174" width="76" height="65" rx="12" />
                <text
                  x="1016"
                  y="201"
                  textAnchor="middle"
                  className="node-kicker"
                >
                  CLIP 2
                </text>
                <text
                  x="1016"
                  y="225"
                  textAnchor="middle"
                  className="node-title"
                >
                  P2
                </text>
              </g>
            </g>
            <g className="journey-heads journey-heads-siglip">
              <g className="journey-head head-three">
                <rect x="978" y="411" width="76" height="65" rx="12" />
                <text
                  x="1016"
                  y="438"
                  textAnchor="middle"
                  className="node-kicker"
                >
                  SIG 3
                </text>
                <text
                  x="1016"
                  y="462"
                  textAnchor="middle"
                  className="node-title"
                >
                  P3
                </text>
              </g>
              <g className="journey-head head-four">
                <rect x="978" y="497" width="76" height="65" rx="12" />
                <text
                  x="1016"
                  y="524"
                  textAnchor="middle"
                  className="node-kicker"
                >
                  SIG 4
                </text>
                <text
                  x="1016"
                  y="548"
                  textAnchor="middle"
                  className="node-title"
                >
                  P4
                </text>
              </g>
            </g>

            <g className="journey-fusion">
              <rect x="1080" y="255" width="105" height="130" rx="52" />
              <text
                x="1132"
                y="298"
                textAnchor="middle"
                className="node-kicker"
              >
                MEAN
              </text>
              <text
                x="1132"
                y="330"
                textAnchor="middle"
                className="node-number"
              >
                ÷ 4
              </text>
              <text
                x="1132"
                y="358"
                textAnchor="middle"
                className="node-caption"
              >
                one signal
              </text>
              <g className="journey-particles" filter="url(#journey-glow)">
                <circle r="5" className="particle particle-one">
                  <animateMotion
                    dur="1.8s"
                    repeatCount="indefinite"
                    path="M-116 -200 C-55 -200 -70 -70 0 0"
                  />
                </circle>
                <circle r="5" className="particle particle-two">
                  <animateMotion
                    begin="0.3s"
                    dur="1.8s"
                    repeatCount="indefinite"
                    path="M-116 -114 C-55 -114 -70 -45 0 0"
                  />
                </circle>
                <circle r="5" className="particle particle-three">
                  <animateMotion
                    begin="0.6s"
                    dur="1.8s"
                    repeatCount="indefinite"
                    path="M-116 124 C-55 124 -70 45 0 0"
                  />
                </circle>
                <circle r="5" className="particle particle-four">
                  <animateMotion
                    begin="0.9s"
                    dur="1.8s"
                    repeatCount="indefinite"
                    path="M-116 210 C-55 210 -70 70 0 0"
                  />
                </circle>
              </g>
            </g>
          </svg>

          <div className="journey-execution-order">
            <span>Released execution order</span>
            <strong>CLIP 1 → CLIP 2 → SigLIP 3 → SigLIP 4</strong>
          </div>
        </div>

        <div className="journey-caption">
          <div className="journey-progress" aria-hidden="true">
            <span
              style={{ width: `${((activeStage + 1) / stages.length) * 100}%` }}
            />
          </div>
          <div
            className="journey-caption-copy"
            aria-live="polite"
            aria-atomic="true"
          >
            <span>
              {String(activeStage + 1).padStart(2, '0')} /{' '}
              {String(stages.length).padStart(2, '0')} · {stage.label}
            </span>
            <h4>{stage.title}</h4>
            <p>{stage.detail}</p>
          </div>
          <div
            className="journey-controls"
            aria-label="Execution trace controls"
          >
            <Button
              aria-label="Previous execution stage"
              className="journey-control"
              disabled={activeStage === 0}
              onClick={() => selectStage(activeStage - 1)}
              size="icon"
              variant="outline"
            >
              <ArrowLeft aria-hidden="true" />
            </Button>
            <Button
              className="journey-replay"
              disabled={isReplaying}
              onClick={replay}
              variant="outline"
            >
              <RotateCcw aria-hidden="true" />
              {isReplaying ? 'Playing' : 'Replay'}
            </Button>
            <Button
              aria-label="Next execution stage"
              className="journey-control"
              disabled={activeStage === lastStage}
              onClick={() => selectStage(activeStage + 1)}
              size="icon"
              variant="outline"
            >
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </div>

        <p className="journey-boundary-note">
          The branches show logical data flow. The released model executes the
          four experts serially in the order shown; this visualization does not
          imply concurrent inference.
        </p>

        <ol
          className="journey-static-steps"
          aria-label="Static execution trace"
        >
          {stages.map((item, index) => (
            <li key={item.label}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
