'use client';

/* oxlint-disable next/no-html-link-for-pages -- vinext's production next/link prefetch shim currently breaks route clicks; standard anchors keep public navigation reliable. */

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  Eye,
  Layers,
  ScanSearch,
  ShieldCheck,
  SlidersHorizontal,
  Waypoints,
} from 'lucide-react';
import Image from 'next/image';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Keep the document on native browser scrolling. ScrollTrigger observes that
// scroll position; it is intentionally not proxied through Lenis or another
// virtual-scrolling layer.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const proofPoints = [
  ['01', 'frozen Expert 4'],
  ['03', 'residual heads'],
  ['02', 'native-size routes'],
  ['0–1', 'review signal'],
];

const experts = [
  {
    id: '01',
    family: 'Expert 4',
    encoder: 'Frozen SigLIP teacher',
    input: '384 px',
    head: '1152-D + 2 logits',
  },
  {
    id: '02',
    family: 'Low-res',
    encoder: 'CIFAKE specialist',
    input: '≤ 64 px native',
    head: '1152 → 256 → 1',
  },
  {
    id: '03',
    family: 'Epoch 05',
    encoder: 'Large-image residual',
    input: '65% stack',
    head: '1152 → 256 → 1',
  },
  {
    id: '04',
    family: 'Epoch 08',
    encoder: 'Large-image residual',
    input: '35% stack',
    head: '1152 → 256 → 1',
  },
];

const scanStages = [
  ['01', 'Capture', 'Record native size and prepare one SigLIP image view.'],
  ['02', 'Correct', 'Apply the specialist or fixed two-head residual route.'],
  ['03', 'Resolve', 'Convert the corrected margin into one review signal.'],
];

const featurePoints = [
  ['16%', '24%'],
  ['32%', '42%'],
  ['48%', '19%'],
  ['64%', '54%'],
  ['78%', '31%'],
  ['26%', '69%'],
  ['54%', '76%'],
  ['83%', '66%'],
];

export default function Home() {
  const page = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = page.current;
    if (!root) return;

    let cleanupMotion: (() => void) | undefined;
    const context = gsap.context(() => {
      const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      const isMobile = window.matchMedia('(max-width: 899px)').matches;
      const heroScoreValue = root.querySelector<HTMLElement>(
        '[data-hero-score-value]',
      );
      const scoreValue = root.querySelector<HTMLElement>('[data-score-value]');
      const showFinalScores = () => {
        if (heroScoreValue) heroScoreValue.textContent = '0.78';
        if (scoreValue) scoreValue.textContent = '0.78';
      };

      if (reduceMotion) {
        gsap.set(root.querySelectorAll('[data-motion]'), { clearProps: 'all' });
        showFinalScores();
        return;
      }

      const intro = gsap.timeline({
        defaults: {
          duration: isMobile ? 0.62 : 0.9,
          ease: 'power3.out',
        },
      });
      intro
        .from('[data-hero-kicker]', {
          autoAlpha: 0,
          y: isMobile ? 14 : 24,
        })
        .from(
          '[data-hero-word]',
          {
            rotate: isMobile ? 0.4 : 2,
            stagger: isMobile ? 0.055 : 0.1,
            yPercent: isMobile ? 72 : 115,
          },
          '-=0.48',
        )
        .from(
          '[data-hero-copy]',
          { autoAlpha: 0, y: isMobile ? 16 : 26 },
          '-=0.46',
        )
        .from(
          '[data-hero-card]',
          {
            autoAlpha: 0,
            rotate: isMobile ? 0.6 : 2.5,
            scale: isMobile ? 0.98 : 0.94,
            y: isMobile ? 24 : 54,
          },
          '-=0.6',
        )
        .from(
          '[data-proof]',
          { autoAlpha: 0, stagger: 0.07, y: isMobile ? 16 : 28 },
          '-=0.4',
        );

      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
        gsap.from(element, {
          autoAlpha: 0,
          duration: isMobile ? 0.68 : 1,
          ease: 'power3.out',
          filter: `blur(${isMobile ? 3 : 8}px)`,
          scrollTrigger: {
            start: 'top 84%',
            toggleActions: 'play none none reverse',
            trigger: element,
          },
          y: isMobile ? 24 : 52,
        });
      });

      gsap.utils
        .toArray<HTMLElement>('[data-stagger-group]')
        .forEach((group) => {
          const items = group.querySelectorAll('[data-stagger-item]');
          gsap.fromTo(
            items,
            {
              autoAlpha: 0,
              filter: `blur(${isMobile ? 3 : 6}px)`,
              rotate: isMobile ? 0.35 : 1.2,
              y: isMobile ? 22 : 44,
            },
            {
              autoAlpha: 1,
              duration: isMobile ? 0.62 : 0.85,
              ease: 'power3.out',
              filter: 'blur(0px)',
              rotate: 0,
              stagger: isMobile ? 0.07 : 0.11,
              scrollTrigger: {
                start: 'top 82%',
                toggleActions: 'play none none reverse',
                trigger: group,
              },
              y: 0,
            },
          );
        });

      const media = gsap.matchMedia();
      media.add('(min-width: 900px)', () => {
        const heroScore = { value: 0 };
        const score = { value: 0 };
        if (heroScoreValue) heroScoreValue.textContent = '0.00';
        if (scoreValue) scoreValue.textContent = '0.00';

        const scanStageElements =
          gsap.utils.toArray<HTMLElement>('[data-scan-stage]');
        gsap.set(scanStageElements, { autoAlpha: 0.38 });

        const scanTimeline = gsap.timeline({
          scrollTrigger: {
            end: 'bottom bottom',
            scrub: 0.8,
            start: 'top top',
            trigger: '[data-scan-hero]',
          },
        });
        scanTimeline
          .fromTo(
            '[data-scan-line]',
            { autoAlpha: 0.4, top: '7%' },
            { autoAlpha: 1, duration: 0.62, ease: 'none', top: '76%' },
            0,
          )
          .fromTo(
            '[data-feature-map]',
            { autoAlpha: 0, clipPath: 'inset(0 100% 0 0)' },
            {
              autoAlpha: 0.82,
              clipPath: 'inset(0 0% 0 0)',
              duration: 0.42,
              ease: 'none',
            },
            0.12,
          )
          .fromTo(
            '[data-feature-point]',
            { autoAlpha: 0, scale: 0.7 },
            {
              autoAlpha: 1,
              duration: 0.25,
              ease: 'power2.out',
              scale: 1,
              stagger: { amount: 0.25, from: 'random' },
            },
            0.2,
          )
          .fromTo(
            '[data-scan-result]',
            { autoAlpha: 0.55, y: 26 },
            { autoAlpha: 1, duration: 0.34, ease: 'power2.out', y: 0 },
            0.56,
          )
          .to(
            heroScore,
            {
              duration: 0.4,
              ease: 'none',
              onUpdate: () => {
                if (heroScoreValue) {
                  heroScoreValue.textContent = heroScore.value.toFixed(2);
                }
              },
              value: 0.78,
            },
            0.54,
          );

        if (scanStageElements.length === 3) {
          scanTimeline
            .to(scanStageElements[0], { autoAlpha: 1, duration: 0.12 }, 0)
            .to(scanStageElements[0], { autoAlpha: 0.38, duration: 0.1 }, 0.26)
            .to(scanStageElements[1], { autoAlpha: 1, duration: 0.12 }, 0.26)
            .to(scanStageElements[1], { autoAlpha: 0.38, duration: 0.1 }, 0.58)
            .to(scanStageElements[2], { autoAlpha: 1, duration: 0.12 }, 0.58);
        }

        const scoreTimeline = gsap.timeline({
          scrollTrigger: {
            end: 'bottom 58%',
            scrub: 0.7,
            start: 'top 82%',
            trigger: '[data-score-card]',
          },
        });
        scoreTimeline
          .to(
            score,
            {
              duration: 1,
              ease: 'none',
              onUpdate: () => {
                if (scoreValue) scoreValue.textContent = score.value.toFixed(2);
              },
              value: 0.78,
            },
            0,
          )
          .fromTo(
            '[data-score-fill]',
            { width: '0%' },
            { duration: 1, ease: 'none', width: '78%' },
            0,
          )
          .fromTo(
            '[data-score-knob]',
            { left: '0%' },
            { duration: 1, ease: 'none', left: '78%' },
            0,
          );

        gsap.to('[data-hero-orb]', {
          ease: 'none',
          scrollTrigger: {
            end: 'bottom top',
            scrub: 1.2,
            start: 'top top',
            trigger: '[data-hero-section]',
          },
          xPercent: -18,
          yPercent: 34,
        });

        gsap.to('[data-method-rail]', {
          ease: 'none',
          scaleX: 1,
          scrollTrigger: {
            end: 'bottom 42%',
            scrub: 0.6,
            start: 'top 78%',
            trigger: '[data-experts]',
          },
          transformOrigin: 'left center',
        });

        const verdictSteps = gsap.utils.toArray<HTMLElement>(
          '[data-verdict-step]',
        );
        gsap.set(verdictSteps, { autoAlpha: 0, y: 34 });
        const verdictTimeline = gsap.timeline({
          scrollTrigger: {
            end: 'bottom bottom',
            scrub: 0.8,
            start: 'top top',
            trigger: '[data-verdict-section]',
          },
        });
        verdictTimeline
          .fromTo(
            '[data-verdict-card]',
            { scale: 0.94 },
            { duration: 0.2, ease: 'none', scale: 1 },
            0,
          )
          .to(verdictSteps[0], { autoAlpha: 1, duration: 0.12, y: 0 }, 0.06)
          .to(verdictSteps[0], { autoAlpha: 0, duration: 0.1, y: -24 }, 0.27)
          .to(verdictSteps[1], { autoAlpha: 1, duration: 0.12, y: 0 }, 0.3)
          .to(verdictSteps[1], { autoAlpha: 0, duration: 0.1, y: -24 }, 0.52)
          .to(verdictSteps[2], { autoAlpha: 1, duration: 0.14, y: 0 }, 0.56)
          .fromTo(
            '[data-verdict-actions]',
            { autoAlpha: 0, y: 24 },
            { autoAlpha: 1, duration: 0.16, y: 0 },
            0.72,
          );
      });

      media.add('(max-width: 899px)', () => {
        showFinalScores();
        gsap.fromTo(
          '[data-feature-map]',
          { autoAlpha: 0.28 },
          {
            autoAlpha: 0.62,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: {
              start: 'top 78%',
              toggleActions: 'play none none reverse',
              trigger: '[data-hero-card]',
            },
          },
        );
      });

      cleanupMotion = () => {
        media.revert();
        showFinalScores();
      };
    }, root);

    return () => {
      cleanupMotion?.();
      context.revert();
    };
  }, []);

  return (
    <main
      ref={page}
      className="min-h-screen overflow-x-clip bg-[#eff4ff] text-[#111827]"
    >
      <section
        data-hero-section
        className="hero-grid relative min-h-[880px] bg-[#0040c1] px-4 pb-8 pt-4 text-white sm:px-6 lg:px-8"
      >
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div
            data-hero-orb
            className="hero-orb absolute -right-40 top-20 h-[620px] w-[620px] rounded-full"
          />
          <div className="absolute -bottom-44 left-[10%] h-[480px] w-[480px] rounded-full border border-white/15" />
          <div className="absolute -bottom-32 left-[15%] h-[360px] w-[360px] rounded-full border border-white/15" />
        </div>

        <header className="relative z-20 mx-auto flex max-w-[1480px] items-center justify-between rounded-full border border-white/35 bg-white/10 px-3 py-3 backdrop-blur-xl sm:px-5">
          <a
            className="flex items-center gap-3"
            href="#top"
            aria-label="SynthFlag home"
          >
            <span className="grid size-9 place-items-center rounded-full bg-white text-[#0040c1]">
              <ScanSearch className="size-[18px]" strokeWidth={2.6} />
            </span>
            <span className="font-display text-lg font-semibold tracking-[-0.04em]">
              SynthFlag
            </span>
          </a>

          <nav
            className="hidden items-center gap-7 text-sm text-white/80 md:flex"
            aria-label="Primary navigation"
          >
            <a className="transition-colors hover:text-white" href="/journey">
              Journey
            </a>
            <a
              className="transition-colors hover:text-white"
              href="/documentation"
            >
              Technical appendix
            </a>
          </nav>

          <a
            className={cn(
              buttonVariants(),
              'h-10 rounded-full bg-white px-4 text-[#0040c1] hover:bg-[#eff4ff]',
            )}
            href="/try"
          >
            <span className="hidden sm:inline">Try detector</span>
            <ArrowUpRight className="size-4" />
          </a>
        </header>

        <div
          id="top"
          data-scan-hero
          className="relative z-10 mx-auto grid max-w-[1480px] gap-14 pb-20 pt-20 lg:min-h-[150vh] lg:grid-cols-[minmax(0,1.15fr)_minmax(390px,.62fr)] lg:items-start lg:pb-28 lg:pt-28"
        >
          <div>
            <div
              data-hero-kicker
              data-motion
              className="mb-8 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-white/70 sm:text-xs"
            >
              <span className="h-px w-8 bg-[#8eb3ff]" />
              Robust AI-image detection / NTIRE 2026
            </div>
            <h1 className="font-display text-[clamp(4.2rem,10.6vw,10.8rem)] font-semibold uppercase leading-[0.76] tracking-[-0.075em]">
              <span className="hero-line-mask block">
                <span data-hero-line className="block">
                  <span data-hero-word data-motion className="inline-block">
                    From
                  </span>{' '}
                  <span data-hero-word data-motion className="inline-block">
                    pixels
                  </span>
                </span>
              </span>
              <span className="hero-line-mask mt-[.08em] block">
                <span data-hero-line className="block text-[#8eb3ff]">
                  <span data-hero-word data-motion className="inline-block">
                    to
                  </span>{' '}
                  <span data-hero-word data-motion className="inline-block">
                    evidence.
                  </span>
                </span>
              </span>
            </h1>
            <div
              data-hero-copy
              data-motion
              className="mt-10 grid max-w-3xl gap-7 border-t border-white/25 pt-7 sm:grid-cols-[1fr_auto] sm:items-end"
            >
              <p className="max-w-xl text-base leading-7 text-white/75 sm:text-lg">
                One frozen upstream teacher and three project-trained residual
                heads turn an image into one inspectable review signal.
              </p>
              <a
                className="group flex items-center gap-3 font-mono text-xs uppercase tracking-[0.16em]"
                href="#method"
              >
                See the signal
                <span className="grid size-10 place-items-center rounded-full border border-white/45 transition-transform group-hover:translate-x-1 group-hover:translate-y-1">
                  <ArrowDownRight className="size-4" />
                </span>
              </a>
            </div>

            <ol className="mt-20 hidden max-w-3xl border-t border-white/20 lg:grid lg:grid-cols-3">
              {scanStages.map(([number, label, copy]) => (
                <li
                  key={number}
                  data-scan-stage
                  data-motion
                  className="border-white/20 py-6 pr-6 first:border-0 lg:border-l lg:px-6 lg:first:pl-0"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#8eb3ff]">
                    {number} / {label}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-white/70">{copy}</p>
                </li>
              ))}
            </ol>
          </div>

          <div
            data-hero-visual
            className="relative lg:sticky lg:top-24 lg:pb-2"
          >
            <div className="absolute -left-8 -top-8 hidden rounded-full bg-[#b7cfff] px-4 py-2 font-mono text-[10px] uppercase tracking-[.14em] text-[#002c88] lg:block">
              Multi-signal read
            </div>
            <div
              data-hero-card
              data-motion
              className="detector-card overflow-hidden rounded-[30px] border border-white/40 bg-[#f8fbff] p-3 text-[#111827] shadow-[0_32px_100px_rgba(0,20,80,.34)] will-change-transform"
            >
              <div className="relative min-h-[410px] overflow-hidden rounded-[22px] bg-[#d8e6ff] p-5 sm:min-h-[475px] sm:p-6">
                <Image
                  src="/architecture/dog-input.jpg"
                  alt="Illustrative dog image used to demonstrate the detector signal path"
                  fill
                  priority
                  sizes="(min-width: 1024px) 36vw, 100vw"
                  className="absolute inset-0 h-full w-full object-cover opacity-95"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#001a4d]/10 via-[#001a4d]/0 to-[#001a4d]/85" />
                <div
                  data-feature-map
                  data-motion
                  className="feature-map-grid absolute inset-0 opacity-60"
                  aria-hidden="true"
                >
                  {featurePoints.map(([left, top], index) => (
                    <span
                      key={`${left}-${top}`}
                      data-feature-point
                      className="feature-point absolute size-3 rounded-full border border-white/80 bg-[#8eb3ff]"
                      style={{ left, top, opacity: 0.55 + index * 0.05 }}
                    />
                  ))}
                </div>
                <div
                  data-scan-line
                  data-motion
                  className="scan-line absolute inset-x-0 top-[38%] h-px bg-white shadow-[0_0_22px_4px_rgba(255,255,255,.75)]"
                />
                <div className="relative flex items-start justify-between">
                  <span className="rounded-full border border-white/60 bg-[#001a4d]/55 px-3 py-2 font-mono text-[10px] uppercase tracking-[.14em] text-white backdrop-blur-md">
                    Signal capture 01
                  </span>
                  <span className="size-3 rounded-full bg-[#b7cfff] shadow-[0_0_0_6px_rgba(183,207,255,.22)]" />
                </div>
                <div
                  data-scan-result
                  data-motion
                  className="absolute inset-x-5 bottom-5 rounded-[18px] border border-white/45 bg-white/90 p-5 shadow-lg backdrop-blur-xl sm:inset-x-6 sm:bottom-6"
                >
                  <div className="mb-5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[.14em] text-[#4b5563]">
                    <span>Illustrative output</span>
                    <span>selected graph / v1</span>
                  </div>
                  <div className="flex items-end justify-between gap-6">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[.13em] text-[#4b5563]">
                        Fake probability
                      </p>
                      <p
                        data-hero-score-value
                        className="font-display text-[4.4rem] font-semibold leading-none tracking-[-.07em] text-[#0040c1]"
                      >
                        0.78
                      </p>
                    </div>
                    <div
                      className="mb-2 grid grid-cols-4 gap-1"
                      aria-hidden="true"
                    >
                      {[52, 68, 44, 76].map((height, index) => (
                        <span
                          key={height}
                          className="flex h-20 w-3 items-end rounded-full bg-[#d1e0ff]"
                        >
                          <span
                            className="w-full rounded-full bg-[#0040c1]"
                            style={{
                              height: `${height}%`,
                              opacity: 0.62 + index * 0.1,
                            }}
                          />
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto grid max-w-[1480px] overflow-hidden rounded-[26px] border border-white/25 bg-[#002f94]/75 backdrop-blur-md sm:grid-cols-2 lg:grid-cols-4">
          {proofPoints.map(([value, label], index) => (
            <div
              key={label}
              data-proof
              data-motion
              className={`p-6 sm:p-7 ${index !== 0 ? 'border-t border-white/20 sm:border-l sm:border-t-0' : ''}`}
            >
              <p className="font-display text-4xl font-semibold tracking-[-0.06em] text-[#b7cfff]">
                {value}
              </p>
              <p className="mt-2 text-sm text-white/68">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#111827] px-4 py-24 text-white sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-[1480px]">
          <div
            data-reveal
            data-motion
            className="grid gap-12 lg:grid-cols-[.62fr_1.38fr] lg:items-start"
          >
            <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[.18em] text-[#8eb3ff]">
              <span className="grid size-7 place-items-center rounded-full border border-[#6199ff]/55">
                01
              </span>
              The problem
            </div>
            <div>
              <p className="font-display text-[clamp(3rem,7vw,7.7rem)] font-medium leading-[.9] tracking-[-.065em]">
                AI images rarely arrive{' '}
                <span className="text-[#6199ff]">lab-clean.</span>
              </p>
              <div className="mt-12 grid gap-8 border-t border-white/15 pt-8 md:grid-cols-2">
                <p className="max-w-xl text-lg leading-8 text-white/72">
                  Screenshots, compression, resizing, noise, and everyday edits
                  can blur the visual traces that detectors learn to recognize.
                </p>
                <p className="max-w-xl text-lg leading-8 text-white/72">
                  SynthFlag answers with a fixed native-size route over one
                  upstream representation and a consistent score interface.
                </p>
              </div>
            </div>
          </div>

          <div
            data-stagger-group
            className="mt-24 grid gap-px overflow-hidden rounded-[30px] border border-white/15 bg-white/15 md:grid-cols-3"
          >
            {[
              [
                Eye,
                'See differently',
                'Expert 4 extracts one pooled representation and teacher margin from the image.',
              ],
              [
                Layers,
                'Fuse carefully',
                'A native-size route selects the specialist or fixed two-head margin stack.',
              ],
              [
                ShieldCheck,
                'Report responsibly',
                'The score supports investigation; it does not prove an image’s origin.',
              ],
            ].map(([Icon, title, copy]) => {
              const FeatureIcon = Icon as typeof Eye;
              return (
                <article
                  key={String(title)}
                  data-stagger-item
                  data-motion
                  className="bg-[#111827] p-7 sm:p-9"
                >
                  <FeatureIcon
                    className="size-7 text-[#8eb3ff]"
                    strokeWidth={1.7}
                  />
                  <h2 className="mt-14 font-display text-3xl font-semibold tracking-[-.045em]">
                    {String(title)}
                  </h2>
                  <p className="mt-4 max-w-sm text-sm leading-7 text-white/60">
                    {String(copy)}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="method" className="px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-[1480px]">
          <div
            data-reveal
            data-motion
            className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:items-end"
          >
            <div>
              <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[.18em] text-[#0040c1]">
                <span className="grid size-7 place-items-center rounded-full border border-[#0040c1]/35">
                  02
                </span>
                The method
              </div>
              <h2 className="mt-7 font-display text-[clamp(3.7rem,7vw,7.8rem)] font-semibold leading-[.84] tracking-[-.07em] text-[#0040c1]">
                Two routes.
                <br />
                One score.
              </h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-[#4b5563] lg:justify-self-end">
              A frozen Tu et al. Expert 4 supplies a 1,152-dimensional feature
              and teacher margin. Three compact residual heads correct that
              margin through a deterministic native-size route before sigmoid
              produces a signal in the range 0–1.
            </p>
          </div>

          <div data-experts className="relative mt-16">
            <div
              data-method-rail
              className="signal-rail absolute left-[8%] right-[8%] top-10 hidden h-px origin-left scale-x-0 bg-[#8eb3ff] lg:block"
              aria-hidden="true"
            />
            <div
              data-stagger-group
              className="relative grid gap-4 lg:grid-cols-4"
            >
              {experts.map((expert, index) => (
                <article
                  key={expert.id}
                  data-stagger-item
                  data-motion
                  className="group relative min-h-[340px] overflow-hidden rounded-[26px] border border-[#b7cfff] bg-white p-6 transition-transform duration-300 hover:-translate-y-2 sm:p-7"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-[.16em] text-[#6b7280]">
                      Component / {expert.id}
                    </span>
                    <span className="relative z-10 grid size-9 place-items-center rounded-full bg-[#d1e0ff] font-display font-semibold text-[#0040c1]">
                      {index + 1}
                    </span>
                  </div>
                  <div className="mt-16">
                    <p className="font-display text-4xl font-semibold tracking-[-.055em] text-[#0040c1]">
                      {expert.family}
                    </p>
                    <p className="mt-1 text-sm text-[#4b5563]">
                      {expert.encoder}
                    </p>
                  </div>
                  <dl className="mt-10 grid gap-3 border-t border-[#d1e0ff] pt-5 font-mono text-[10px] uppercase tracking-[.12em]">
                    <div className="flex justify-between gap-4">
                      <dt className="text-[#6b7280]">Input</dt>
                      <dd>{expert.input}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-[#6b7280]">Head</dt>
                      <dd>{expert.head}</dd>
                    </div>
                  </dl>
                  <div
                    className="absolute -bottom-16 -right-16 size-40 rounded-full border-[28px] border-[#eff4ff] transition-transform duration-500 group-hover:scale-125"
                    aria-hidden="true"
                  />
                </article>
              ))}
            </div>
          </div>

          <div
            data-reveal
            data-motion
            className="mt-6 grid overflow-hidden rounded-[26px] bg-[#0040c1] text-white lg:grid-cols-[1.4fr_.6fr]"
          >
            <div className="flex min-h-56 items-center gap-7 p-7 sm:p-10">
              <Waypoints
                className="hidden size-12 shrink-0 text-[#8eb3ff] sm:block"
                strokeWidth={1.4}
              />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[.17em] text-[#8eb3ff]">
                  Routed detector interface
                </p>
                <p className="mt-3 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-5xl">
                  One representation enters. One review signal leaves.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-white/20 bg-[#002f94] p-7 lg:border-l lg:border-t-0 sm:p-10">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[.15em] text-white/55">
                  Output range
                </p>
                <p className="mt-2 font-display text-6xl font-semibold tracking-[-.07em] text-[#b7cfff]">
                  0–1
                </p>
              </div>
              <ArrowRight className="size-9 text-white/65" />
            </div>
          </div>
        </div>
      </section>

      <section
        id="evidence"
        className="bg-white px-4 py-24 sm:px-6 sm:py-32 lg:px-8"
      >
        <div className="mx-auto max-w-[1480px]">
          <div className="evidence-grid grid gap-16 lg:grid-cols-[.88fr_1.12fr] lg:items-start">
            <div data-reveal data-motion>
              <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[.18em] text-[#0040c1]">
                <span className="grid size-7 place-items-center rounded-full border border-[#0040c1]/35">
                  03
                </span>
                Read the evidence
              </div>
              <h2 className="mt-7 font-display text-[clamp(3.7rem,7vw,7.4rem)] font-semibold leading-[.86] tracking-[-.07em]">
                A score,
                <br />
                not a sentence.
              </h2>
              <p className="mt-8 max-w-xl text-lg leading-8 text-[#4b5563]">
                SynthFlag returns a continuous fake-image probability. How that
                score becomes a decision depends on the use case, operating
                point, and consequences of being wrong.
              </p>
              <ul className="mt-9 space-y-4">
                {[
                  'Preserve the raw probability for review.',
                  'Choose thresholds outside protected evaluation data.',
                  'For creator operations, constrain false positives first.',
                  'Pair model output with provenance and human judgment.',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm leading-6 text-[#4b5563]"
                  >
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#d1e0ff] text-[#0040c1]">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div
              data-score-card
              data-motion
              className="evidence-visual rounded-[34px] bg-[#111827] p-5 text-white shadow-[0_28px_80px_rgba(17,24,39,.18)] sm:p-8"
            >
              <div className="rounded-[26px] border border-white/15 p-6 sm:p-9">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[.16em] text-white/55">
                  <span>Illustrative score anatomy</span>
                  <SlidersHorizontal className="size-4" />
                </div>
                <div className="mt-16 flex items-end justify-between gap-5">
                  <p
                    data-score-value
                    className="font-display text-[clamp(5rem,12vw,9rem)] font-semibold leading-none tracking-[-.08em] text-[#8eb3ff]"
                  >
                    0.78
                  </p>
                  <p className="mb-4 max-w-36 text-right text-xs leading-5 text-white/55">
                    Example only.
                    <br />
                    Not a benchmark result.
                  </p>
                </div>
                <div className="mt-10">
                  <div className="relative h-3 rounded-full bg-white/10">
                    <div
                      data-score-fill
                      className="absolute inset-y-0 left-0 w-[78%] rounded-full bg-gradient-to-r from-[#6199ff] to-[#d1e0ff]"
                    />
                    <div
                      data-score-knob
                      className="absolute left-[78%] top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[5px] border-[#111827] bg-white shadow-[0_0_0_2px_#8eb3ff]"
                    />
                  </div>
                  <div className="mt-4 flex justify-between font-mono text-[10px] uppercase tracking-[.14em] text-white/45">
                    <span>0.00 / lower</span>
                    <span>1.00 / higher</span>
                  </div>
                </div>
                <div className="mt-12 grid gap-px overflow-hidden rounded-[18px] bg-white/15 sm:grid-cols-3">
                  {[
                    ['Value', '0.78'],
                    ['Type', 'Probability'],
                    ['Source', '4 experts'],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-[#111827] p-4">
                      <p className="font-mono text-[9px] uppercase tracking-[.15em] text-white/40">
                        {label}
                      </p>
                      <p className="mt-2 text-sm text-white/85">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div
            data-reveal
            data-motion
            className="mt-20 overflow-hidden rounded-[32px] border border-[#b7cfff] bg-[#eff4ff]"
          >
            <div className="grid gap-10 border-b border-[#b7cfff] p-7 sm:p-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[.17em] text-[#0040c1]">
                  TEST1 · public development benchmark
                </p>
                <h3 className="mt-4 max-w-4xl font-display text-[clamp(2.7rem,5vw,5.4rem)] font-semibold leading-[.9] tracking-[-.06em] text-[#111827]">
                  15,000 sources. Clean and damaged.
                </h3>
              </div>
              <p className="max-w-xl text-sm leading-7 text-[#4b5563] lg:justify-self-end">
                One deterministic composite corruption per public source
                produced 30,000 paired predictions for the selected Expert 4
                plus three-head runtime shown above.
              </p>
            </div>
            <dl className="grid gap-px bg-[#b7cfff] sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['15,000', 'unique public images'],
                ['30,000', 'paired predictions'],
                ['0.9324', 'macro clean ROC-AUC'],
                ['0.8773', 'macro augmented ROC-AUC'],
              ].map(([value, label]) => (
                <div key={label} className="bg-white p-6 sm:p-7">
                  <dt className="font-mono text-[10px] uppercase tracking-[.13em] text-[#6b7280]">
                    {label}
                  </dt>
                  <dd className="mt-5 font-display text-5xl font-semibold tracking-[-.06em] text-[#0040c1]">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="grid gap-px bg-[#b7cfff] lg:grid-cols-3">
              {[
                ['CIFAKE', '0.9816 → 0.9095'],
                ['SID-Set', '0.8691 → 0.8439'],
                ['WildFake', '0.9467 → 0.8785'],
              ].map(([dataset, auc]) => (
                <div
                  key={dataset}
                  className="flex items-end justify-between gap-5 bg-[#f8fbff] p-6 sm:p-7"
                >
                  <div>
                    <p className="font-display text-2xl font-semibold tracking-[-.04em]">
                      {dataset}
                    </p>
                    <p className="mt-2 text-xs text-[#6b7280]">
                      Clean → augmented ROC-AUC
                    </p>
                  </div>
                  <strong className="font-mono text-sm text-[#0040c1]">
                    {auc}
                  </strong>
                </div>
              ))}
            </div>
            <div className="grid gap-7 bg-[#111827] p-7 text-white sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
              <p className="max-w-4xl text-sm leading-7 text-white/70">
                For TikTok-like creator operations, constrain false positives
                first: a wrong flag can question authentic work, interrupt
                distribution or monetization, and create an appeal. TEST1
                reports TPR at 1% and 5% FPR. Its fixed 0.5 point is diagnostic,
                not a universal moderation cutoff.
              </p>
              <a
                className="flex items-center gap-3 font-mono text-xs uppercase tracking-[.14em] text-[#b7cfff] hover:text-white"
                href="/documentation#test1"
              >
                Inspect TEST1 <ArrowUpRight className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f6f8fc] px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-[1480px]">
          <div
            data-reveal
            data-motion
            className="overflow-hidden rounded-[36px] border border-[#d7e2f8] bg-white"
          >
            <div className="grid lg:grid-cols-[1.03fr_.97fr]">
              <div className="relative min-h-[320px] overflow-hidden bg-[#111827] lg:min-h-[540px]">
                <Image
                  alt="Professor Ng Teck Khim and the SynthFlag team during a Day 3 video research interview"
                  className="object-cover"
                  fill
                  sizes="(min-width: 1024px) 52vw, 100vw"
                  src="/interviews/prof-ng-teck-khim-day3.png"
                />
              </div>
              <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
                <p className="font-mono text-[10px] uppercase tracking-[.17em] text-[#0040c1]">
                  Day 3 · research interview
                </p>
                <h2 className="mt-5 max-w-3xl font-display text-[clamp(2.8rem,5vw,5.7rem)] font-semibold leading-[.9] tracking-[-.06em] text-[#111827]">
                  A promising clue. Not a final result.
                </h2>
                <p className="mt-7 max-w-2xl text-sm leading-7 text-[#4b5563]">
                  Professor Ng Teck Khim introduced us to camera-forensics
                  signals created by Bayer sampling and demosaicing. We briefly
                  explored local variance and cross-channel statistics, but the
                  interview happened on Day 3 and the early prototype was not
                  strong or stable enough for final use. It did not enter the
                  released model, TEST1, or final claims.
                </p>
                <div className="mt-9 flex flex-wrap gap-3">
                  <a
                    className="inline-flex items-center gap-2 rounded-full bg-[#0040c1] px-5 py-3 font-mono text-[10px] uppercase tracking-[.13em] text-white hover:bg-[#111827]"
                    href="/journey#research-interview"
                  >
                    Read what we learned <ArrowUpRight className="size-4" />
                  </a>
                  <a
                    className="inline-flex items-center gap-2 rounded-full border border-[#b7cfff] px-5 py-3 font-mono text-[10px] uppercase tracking-[.13em] text-[#0040c1] hover:border-[#0040c1]"
                    download
                    href="/interviews/prof-ng-teck-khim-day3-transcript.txt"
                  >
                    Download transcript
                  </a>
                </div>
                <p className="mt-7 font-mono text-[9px] leading-5 uppercase tracking-[.1em] text-[#7b8496]">
                  Interview evidence and future direction—not detector
                  performance or researcher endorsement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-[1480px]">
          <div
            data-reveal
            data-motion
            className="relative overflow-hidden rounded-[36px] bg-[#d1e0ff] p-7 sm:p-12 lg:p-16"
          >
            <div
              className="absolute -right-20 -top-20 size-72 rounded-full border-[52px] border-white/45"
              aria-hidden="true"
            />
            <div className="relative grid gap-14 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
              <div>
                <p className="font-mono text-xs uppercase tracking-[.18em] text-[#0040c1]">
                  Designed for the wild
                </p>
                <h2 className="mt-7 max-w-4xl font-display text-[clamp(3.4rem,7vw,7.2rem)] font-semibold leading-[.87] tracking-[-.07em] text-[#0040c1]">
                  Real-world inputs.
                  <br />
                  Repeatable output.
                </h2>
              </div>
              <p className="max-w-xl text-base leading-8 text-[#334155] lg:justify-self-end">
                The inference workflow recursively reads common image formats,
                applies deterministic preprocessing, and writes resumable
                predictions to a portable CSV with run metadata.
              </p>
            </div>
            <div className="relative mt-16 flex flex-wrap gap-3">
              {[
                'JPEG',
                'PNG',
                'BMP',
                'WebP',
                'TIFF',
                'recursive folders',
                'resumable CSV',
                'run metadata',
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[#0040c1]/20 bg-white/65 px-4 py-2 font-mono text-[10px] uppercase tracking-[.13em] text-[#002f94] backdrop-blur-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="responsible-use"
        className="bg-[#0040c1] px-4 py-24 text-white sm:px-6 sm:py-32 lg:px-8"
      >
        <div className="mx-auto max-w-[1480px]">
          <div
            data-reveal
            data-motion
            className="grid gap-16 lg:grid-cols-[.58fr_1.42fr]"
          >
            <div className="flex items-center gap-3 self-start font-mono text-xs uppercase tracking-[.18em] text-[#b7cfff]">
              <span className="grid size-7 place-items-center rounded-full border border-[#b7cfff]/45">
                04
              </span>
              Use responsibly
            </div>
            <div>
              <ShieldCheck
                className="size-12 text-[#8eb3ff]"
                strokeWidth={1.4}
              />
              <h2 className="mt-8 max-w-5xl font-display text-[clamp(3.4rem,7vw,7.8rem)] font-semibold leading-[.86] tracking-[-.07em]">
                Evidence deserves context.
              </h2>
              <p className="mt-9 max-w-3xl text-lg leading-8 text-white/72">
                SynthFlag is a research detector. Its scores should support a
                broader review process—never stand alone as conclusive proof
                about an image’s origin. For creator operations, false positives
                are constrained first because authentic work, reach,
                monetization, and appeals can be affected by an incorrect flag.
              </p>
              <div
                data-stagger-group
                className="mt-12 grid gap-4 sm:grid-cols-3"
              >
                {[
                  ['01', 'Retain the original image and metadata.'],
                  [
                    '02',
                    'Calibrate a low-FPR threshold for the actual use case.',
                  ],
                  ['03', 'Escalate consequential decisions to human review.'],
                ].map(([number, copy]) => (
                  <div
                    key={number}
                    data-stagger-item
                    data-motion
                    className="rounded-[22px] border border-white/20 bg-white/8 p-5"
                  >
                    <p className="font-mono text-[10px] tracking-[.15em] text-[#8eb3ff]">
                      {number}
                    </p>
                    <p className="mt-8 text-sm leading-6 text-white/75">
                      {copy}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        data-verdict-section
        className="relative bg-white px-4 py-24 sm:px-6 sm:py-32 lg:min-h-[220vh] lg:px-8 lg:py-0"
      >
        <div
          data-verdict-sticky
          className="mx-auto max-w-[1480px] lg:sticky lg:top-0 lg:flex lg:min-h-screen lg:items-center"
        >
          <div
            data-verdict-card
            data-motion
            className="relative w-full overflow-hidden rounded-[36px] border border-[#d1e0ff] px-6 py-16 text-center sm:px-12 sm:py-24"
          >
            <div className="cta-glow absolute inset-0" aria-hidden="true" />
            <div className="relative">
              <div className="mx-auto flex max-w-2xl items-center justify-center gap-3 font-mono text-[10px] uppercase tracking-[.18em] text-[#0040c1]">
                <span className="h-px w-10 bg-[#8eb3ff]" />
                Verdict sequence / 05
                <span className="h-px w-10 bg-[#8eb3ff]" />
              </div>

              <div className="relative mx-auto mt-10 min-h-[13rem] max-w-6xl sm:min-h-[18rem]">
                <p
                  data-verdict-step
                  data-motion
                  aria-hidden="true"
                  className="absolute inset-0 grid place-items-center font-display text-[clamp(3.8rem,9vw,9rem)] font-semibold uppercase leading-[.8] tracking-[-.075em] text-[#111827] opacity-0"
                >
                  Signal
                  <br />
                  located.
                </p>
                <p
                  data-verdict-step
                  data-motion
                  aria-hidden="true"
                  className="absolute inset-0 grid place-items-center font-display text-[clamp(3.8rem,9vw,9rem)] font-semibold uppercase leading-[.8] tracking-[-.075em] text-[#111827] opacity-0"
                >
                  Context
                  <br />
                  required.
                </p>
                <h2
                  data-verdict-step
                  data-motion
                  className="absolute inset-0 grid place-items-center font-display text-[clamp(3.8rem,9vw,9rem)] font-semibold uppercase leading-[.8] tracking-[-.075em] text-[#0040c1]"
                >
                  Flag for
                  <br />
                  review.
                </h2>
              </div>

              <div data-verdict-actions data-motion>
                <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#4b5563]">
                  Turn the detector signal into a reviewable result—then pair it
                  with provenance, context, and human judgment.
                </p>
                <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <a
                    className={cn(
                      buttonVariants(),
                      'h-13 rounded-full bg-[#0040c1] px-7 text-white hover:bg-[#002f94]',
                    )}
                    href="/try"
                  >
                    Test an image <ArrowRight className="size-4" />
                  </a>
                  <a
                    className={cn(
                      buttonVariants(),
                      'h-13 rounded-full border border-[#0040c1]/20 bg-white px-7 text-[#0040c1] hover:bg-[#eff4ff]',
                    )}
                    href="/journey"
                  >
                    Explore the journey <ArrowUpRight className="size-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-white px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-6 border-t border-[#d1e0ff] pt-8 text-sm text-[#6b7280] sm:flex-row sm:items-center sm:justify-between">
          <a className="flex items-center gap-3 text-[#111827]" href="#top">
            <span className="grid size-8 place-items-center rounded-full bg-[#0040c1] text-white">
              <ScanSearch className="size-4" />
            </span>
            <span className="font-display text-lg font-semibold tracking-[-.04em]">
              SynthFlag
            </span>
          </a>
          <p>
            Built on the detector architecture and research of Tu et al.
            lineage.
          </p>
          <div className="flex items-center gap-5">
            <a className="text-[#0040c1] hover:underline" href="/journey">
              Journey
            </a>
            <a className="text-[#0040c1] hover:underline" href="/documentation">
              Technical appendix
            </a>
            <a
              className="flex items-center gap-2 text-[#0040c1] hover:underline"
              href="#top"
            >
              Back to top <ArrowUpRight className="size-3.5" />
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
