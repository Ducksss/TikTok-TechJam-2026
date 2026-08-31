'use client';

/* oxlint-disable next/no-html-link-for-pages -- vinext's production next/link prefetch shim currently breaks route clicks; standard anchors keep public navigation reliable. */

import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileImage,
  Info,
  LoaderCircle,
  LockKeyhole,
  RotateCcw,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const pipelineSteps = [
  ['Decode', 'Normalize image'],
  ['Inspect', 'Run four experts'],
  ['Resolve', 'Average probability'],
] as const;

type ImageDetails = {
  file: File;
  height: number;
  objectUrl: string;
  width: number;
};

type AnalysisResult = {
  checkpoint?: string;
  model?: string;
  processing_ms?: number;
  score: number;
  threshold?: number;
};

type ServiceState = 'checking' | 'offline' | 'ready' | 'warming';

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function resultLanguage(score: number) {
  if (score >= 0.75) {
    return {
      eyebrow: 'Elevated synthetic signal',
      detail:
        'The ensemble found a strong pattern match with AI-generated imagery.',
    };
  }
  if (score >= 0.5) {
    return {
      eyebrow: 'Synthetic signal detected',
      detail:
        'The ensemble leans toward AI-generated, but this is not a proof of origin.',
    };
  }
  if (score >= 0.25) {
    return {
      eyebrow: 'Low synthetic signal',
      detail:
        'The ensemble leans away from AI-generated patterns in this image.',
    };
  }
  return {
    eyebrow: 'Minimal synthetic signal',
    detail:
      'The ensemble found little resemblance to the AI-generated patterns it learned.',
  };
}

export default function TryDetector() {
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [details, setDetails] = useState<ImageDetails | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [serviceState, setServiceState] = useState<ServiceState>('checking');
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'complete'>(
    'idle',
  );
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const directEndpoint =
      process.env.NEXT_PUBLIC_SYNTHFLAG_INFERENCE_URL?.replace(/\/$/, '');
    const healthEndpoint = directEndpoint
      ? `${directEndpoint}/health`
      : '/api/analyze';
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 6_000);
    fetch(healthEndpoint, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Health check failed');
        return (await response.json()) as {
          connected?: boolean;
          ready?: boolean;
        };
      })
      .then((health) => {
        const connected = directEndpoint ? true : health.connected === true;
        setServiceState(
          !connected ? 'offline' : health.ready === true ? 'ready' : 'warming',
        );
      })
      .catch(() => setServiceState('offline'))
      .finally(() => window.clearTimeout(timeout));
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (details?.objectUrl) URL.revokeObjectURL(details.objectUrl);
    };
  }, [details]);

  useEffect(() => {
    if (status !== 'analyzing') return;
    const interval = window.setInterval(() => {
      setActiveStep((step) => Math.min(step + 1, pipelineSteps.length - 1));
    }, 1150);
    return () => window.clearInterval(interval);
  }, [status]);

  const reset = useCallback(() => {
    setDetails(null);
    setError(null);
    setResult(null);
    setStatus('idle');
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const acceptFile = useCallback((file?: File) => {
    setError(null);
    setResult(null);
    setStatus('idle');
    if (!file) return;
    if (!ACCEPTED_TYPES.has(file.type)) {
      setError('Choose a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(
        'That image is over 10 MB. Choose a smaller file and try again.',
      );
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      setDetails({
        file,
        height: image.naturalHeight,
        objectUrl,
        width: image.naturalWidth,
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError('We could not decode that image. Try exporting it again.');
    };
    image.src = objectUrl;
  }, []);

  const analyze = useCallback(async () => {
    if (
      !details ||
      status === 'analyzing' ||
      serviceState === 'checking' ||
      serviceState === 'offline'
    )
      return;
    setError(null);
    setResult(null);
    setActiveStep(0);
    setStatus('analyzing');

    const body = new FormData();
    body.append('image', details.file);
    const directEndpoint =
      process.env.NEXT_PUBLIC_SYNTHFLAG_INFERENCE_URL?.replace(/\/$/, '');
    const endpoint = directEndpoint
      ? `${directEndpoint}/v1/analyze`
      : '/api/analyze';

    try {
      const response = await fetch(endpoint, {
        body,
        method: 'POST',
      });
      const payload = (await response.json()) as AnalysisResult & {
        detail?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(
          payload.error ||
            payload.detail ||
            'The detector could not analyze this image.',
        );
      }
      if (
        !Number.isFinite(payload.score) ||
        payload.score < 0 ||
        payload.score > 1
      ) {
        throw new Error('The detector returned an invalid score.');
      }
      setResult(payload);
      setStatus('complete');
      window.setTimeout(() => {
        resultRef.current?.focus({ preventScroll: true });
      }, 0);
    } catch (reason) {
      setStatus('idle');
      setError(
        reason instanceof Error
          ? reason.message
          : 'The detector could not analyze this image.',
      );
    }
  }, [details, serviceState, status]);

  const language = result ? resultLanguage(result.score) : null;
  const scorePercent = result ? Math.round(result.score * 100) : 0;

  return (
    <main className="try-shell min-h-screen bg-[#0039ad] text-[#111827]">
      <header className="mx-auto flex max-w-[1540px] items-center justify-between px-4 py-5 text-white sm:px-7 lg:px-10">
        <a
          className="flex items-center gap-3"
          href="/"
          aria-label="SynthFlag home"
        >
          <span className="grid size-10 place-items-center rounded-full bg-white text-[#0040c1]">
            <ScanSearch className="size-5" strokeWidth={2.6} />
          </span>
          <span className="font-display text-xl font-semibold tracking-[-0.045em]">
            SynthFlag
          </span>
        </a>
        <nav
          className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.13em] text-white/70 sm:gap-6 sm:text-[11px] sm:tracking-[0.16em]"
          aria-label="Primary navigation"
        >
          <a className="transition-colors hover:text-white" href="/journey">
            Journey
          </a>
          <a
            className="hidden transition-colors hover:text-white sm:inline-flex"
            href="/documentation"
          >
            Technical appendix
          </a>
          <a
            className="group flex items-center gap-2 transition-colors hover:text-white"
            href="/"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
            Home
          </a>
        </nav>
      </header>

      <section className="mx-auto max-w-[1540px] px-4 pb-4 sm:px-7 lg:px-10 lg:pb-10">
        <div className="mb-5 grid items-end gap-5 py-5 text-white lg:grid-cols-[1fr_auto] lg:py-8">
          <div>
            <div className="mb-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#a9c4ff] sm:text-xs">
              <span
                className={`size-2 rounded-full ${
                  serviceState === 'ready'
                    ? 'bg-[#b9ff66] shadow-[0_0_0_6px_rgba(185,255,102,.12)]'
                    : serviceState === 'warming'
                      ? 'animate-pulse bg-[#ffd166] shadow-[0_0_0_6px_rgba(255,209,102,.12)]'
                      : 'bg-white/45 shadow-[0_0_0_6px_rgba(255,255,255,.08)]'
                }`}
              />
              {serviceState === 'ready'
                ? 'Live detector workspace'
                : serviceState === 'warming'
                  ? 'Model warming up'
                  : serviceState === 'offline'
                    ? 'Detector interface preview'
                    : 'Checking model service'}
            </div>
            <h1 className="font-display text-[clamp(3.2rem,7vw,7.4rem)] font-semibold leading-[0.84] tracking-[-0.065em]">
              Test the signal.
            </h1>
          </div>
          <p className="max-w-xl text-sm leading-6 text-white/65 sm:text-base lg:max-w-sm">
            Drop in one image. SynthFlag returns the four-expert ensemble’s
            probability of AI generation—not a claim about authorship.
          </p>
        </div>

        <div className="grid overflow-hidden rounded-[30px] border border-white/25 bg-[#eff4ff] shadow-[0_32px_100px_rgba(0,14,65,.32)] lg:min-h-[670px] lg:grid-cols-[minmax(0,1.08fr)_minmax(430px,.72fr)]">
          <section className="flex min-h-[590px] flex-col border-b border-[#c8d8fb] p-4 sm:p-7 lg:border-b-0 lg:border-r lg:p-9">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-full bg-[#0040c1] font-mono text-[10px] text-white">
                  01
                </span>
                <div>
                  <h2 className="font-display text-xl font-semibold tracking-[-0.035em]">
                    Image input
                  </h2>
                  <p className="text-xs text-[#667085]">One frame at a time</p>
                </div>
              </div>
              {details && (
                <button
                  className="flex items-center gap-2 rounded-full border border-[#c8d8fb] bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#405071] transition-colors hover:border-[#0040c1] hover:text-[#0040c1]"
                  onClick={reset}
                  type="button"
                >
                  <RotateCcw className="size-3.5" />
                  Reset
                </button>
              )}
            </div>

            {!details ? (
              <button
                className={`drop-field group relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-[24px] border-2 border-dashed px-5 py-14 text-center transition-all ${
                  dragging
                    ? 'border-[#0040c1] bg-[#dbe7ff]'
                    : 'border-[#9bb8f3] bg-white hover:border-[#0040c1] hover:bg-[#f8faff]'
                }`}
                onClick={() => inputRef.current?.click()}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  if (event.currentTarget === event.target) setDragging(false);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  acceptFile(event.dataTransfer.files[0]);
                }}
                type="button"
              >
                <span className="absolute inset-4 rounded-[18px] border border-[#dce6fb]" />
                <span className="relative mb-6 grid size-20 place-items-center rounded-full bg-[#0040c1] text-white shadow-[0_16px_35px_rgba(0,64,193,.26)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105">
                  <Upload className="size-7" strokeWidth={2} />
                </span>
                <span className="relative font-display text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                  Drop your image here
                </span>
                <span className="relative mt-3 max-w-md text-sm leading-6 text-[#667085]">
                  or click to browse · JPEG, PNG, WebP · up to 10 MB
                </span>
                <span className="relative mt-7 inline-flex items-center gap-2 rounded-full bg-[#dfe9ff] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.13em] text-[#0040c1]">
                  <LockKeyhole className="size-3.5" />
                  Not retained by this interface
                </span>
              </button>
            ) : (
              <div className="relative flex flex-1 flex-col overflow-hidden rounded-[24px] bg-[#071b47] p-3 sm:p-4">
                <div className="relative min-h-[340px] flex-1 overflow-hidden rounded-[17px] bg-black/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={`Preview of ${details.file.name}`}
                    className="absolute inset-0 h-full w-full object-contain"
                    src={details.objectUrl}
                  />
                  {status === 'analyzing' && (
                    <div className="scan-pass pointer-events-none absolute inset-x-0 top-0 h-px bg-[#b9ff66] shadow-[0_0_18px_4px_rgba(185,255,102,.65)]" />
                  )}
                  <div className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/45 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white backdrop-blur-md">
                    Source preview
                  </div>
                  <button
                    aria-label="Remove image"
                    className="absolute right-3 top-3 grid size-8 place-items-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-white hover:text-[#071b47]"
                    onClick={reset}
                    type="button"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-1 pt-4 text-white">
                  <div className="min-w-0">
                    <p className="max-w-[300px] truncate text-sm font-medium">
                      {details.file.name}
                    </p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white/50">
                      {details.width} × {details.height} px ·{' '}
                      {formatBytes(details.file.size)}
                    </p>
                  </div>
                  <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-white/70">
                    <Check className="size-3 text-[#b9ff66]" /> Valid image
                  </span>
                </div>
              </div>
            )}

            <input
              ref={inputRef}
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => acceptFile(event.target.files?.[0])}
              type="file"
            />

            {error && (
              <div
                className="mt-4 flex items-start gap-3 rounded-2xl border border-[#ffb3a8] bg-[#fff1ef] px-4 py-3 text-sm leading-5 text-[#8e2416]"
                role="alert"
              >
                <Info className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </section>

          <section className="flex min-h-[590px] flex-col bg-white p-4 sm:p-7 lg:p-9">
            <div className="mb-6 flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-full bg-[#0040c1] font-mono text-[10px] text-white">
                02
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold tracking-[-0.035em]">
                  Signal report
                </h2>
                <p className="text-xs text-[#667085]">
                  Probability, not provenance
                </p>
              </div>
            </div>

            {status === 'analyzing' ? (
              <div
                className="flex flex-1 flex-col justify-center"
                aria-live="polite"
              >
                <div className="mb-10 flex items-center justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#667085]">
                      Analysis in progress
                    </p>
                    <p className="mt-2 font-display text-4xl font-semibold tracking-[-0.05em]">
                      Reading the frame
                    </p>
                  </div>
                  <LoaderCircle className="size-8 animate-spin text-[#0040c1]" />
                </div>
                <ol className="space-y-3">
                  {pipelineSteps.map(([label, description], index) => {
                    const complete = index < activeStep;
                    const active = index === activeStep;
                    return (
                      <li
                        className={`flex items-center gap-4 rounded-2xl border p-4 transition-colors ${
                          active
                            ? 'border-[#0040c1] bg-[#edf3ff]'
                            : complete
                              ? 'border-[#c8d8fb] bg-white'
                              : 'border-[#e2e8f5] bg-[#f8faff] opacity-50'
                        }`}
                        key={label}
                      >
                        <span
                          className={`grid size-8 place-items-center rounded-full ${
                            complete
                              ? 'bg-[#0040c1] text-white'
                              : active
                                ? 'bg-[#b9ff66] text-[#102600]'
                                : 'bg-[#e8edf7] text-[#667085]'
                          }`}
                        >
                          {complete ? (
                            <Check className="size-4" />
                          ) : (
                            <span className="font-mono text-[10px]">
                              0{index + 1}
                            </span>
                          )}
                        </span>
                        <span>
                          <span className="block text-sm font-medium">
                            {label}
                          </span>
                          <span className="block text-xs text-[#667085]">
                            {description}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ) : result && language ? (
              <div
                ref={resultRef}
                className="flex flex-1 flex-col"
                tabIndex={-1}
                aria-live="polite"
              >
                <div className="rounded-[24px] bg-[#0040c1] p-6 text-white sm:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <span className="rounded-full bg-[#b9ff66] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#102600]">
                      Analysis complete
                    </span>
                    <Sparkles className="size-5 text-[#b9ff66]" />
                  </div>
                  <div className="mt-9 flex items-end justify-between gap-4">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/55">
                        P(AI-generated)
                      </p>
                      <p className="mt-1 font-display text-[clamp(5rem,10vw,8rem)] font-semibold leading-none tracking-[-0.08em]">
                        {scorePercent}
                        <span className="ml-1 text-[.32em] tracking-[-0.02em] text-[#a9c4ff]">
                          %
                        </span>
                      </p>
                    </div>
                    <span className="pb-3 font-mono text-[10px] text-white/55">
                      {result.score.toFixed(4)}
                    </span>
                  </div>
                  <div className="relative mt-5 h-2 rounded-full bg-white/16">
                    <div
                      className="h-full rounded-full bg-[#b9ff66] transition-[width] duration-1000 ease-out"
                      style={{ width: `${scorePercent}%` }}
                    />
                    <span className="absolute left-1/2 top-1/2 h-5 w-px -translate-y-1/2 bg-white/60" />
                  </div>
                  <div className="mt-3 flex justify-between font-mono text-[8px] uppercase tracking-[0.12em] text-white/45">
                    <span>Lower signal</span>
                    <span>Decision guide 50%</span>
                    <span>Higher signal</span>
                  </div>
                </div>

                <div className="mt-5 rounded-[20px] border border-[#c8d8fb] bg-[#f6f9ff] p-5">
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#0040c1]">
                    {language.eyebrow}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#405071]">
                    {language.detail}
                  </p>
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-[18px] border border-[#d7e2f8] bg-[#d7e2f8] text-xs">
                  <div className="bg-white p-4">
                    <dt className="text-[#667085]">Architecture</dt>
                    <dd className="mt-1 font-medium">FeatDistill 4-expert</dd>
                  </div>
                  <div className="bg-white p-4">
                    <dt className="text-[#667085]">Processing</dt>
                    <dd className="mt-1 font-medium">
                      {result.processing_ms
                        ? `${(result.processing_ms / 1000).toFixed(1)} sec`
                        : 'Complete'}
                    </dd>
                  </div>
                </dl>

                <Button
                  className="mt-auto h-13 rounded-full bg-[#111827] px-5 text-white hover:bg-[#0040c1]"
                  onClick={reset}
                >
                  Analyze another image
                  <RotateCcw className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-1 flex-col">
                <div className="grid flex-1 place-items-center rounded-[24px] border border-[#d7e2f8] bg-[#f6f9ff] px-6 py-10 text-center">
                  <div>
                    <span className="mx-auto grid size-20 place-items-center rounded-full border border-[#c8d8fb] bg-white text-[#0040c1] shadow-[0_12px_30px_rgba(0,64,193,.08)]">
                      <FileImage className="size-7" strokeWidth={1.8} />
                    </span>
                    <p className="mt-6 font-display text-3xl font-semibold tracking-[-0.05em]">
                      Your result lands here
                    </p>
                    <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#667085]">
                      Select an image to unlock the analysis. We’ll show the raw
                      score, contextual reading, and model context.
                    </p>
                    {serviceState === 'offline' && (
                      <p className="mx-auto mt-4 max-w-sm rounded-xl border border-[#e6c878] bg-[#fff8dc] px-3 py-2 text-xs leading-5 text-[#735c13]">
                        The GPU model service is not connected on this
                        deployment yet.
                      </p>
                    )}
                    <div
                      className="mx-auto mt-8 grid max-w-sm grid-cols-4 gap-2"
                      aria-hidden="true"
                    >
                      {['C1', 'C2', 'S3', 'S4'].map((expert) => (
                        <span
                          className="grid aspect-square place-items-center rounded-xl border border-[#d7e2f8] bg-white font-mono text-[9px] text-[#6d7b98]"
                          key={expert}
                        >
                          {expert}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  className="mt-5 h-13 rounded-full bg-[#0040c1] px-5 text-white hover:bg-[#002f91] disabled:bg-[#b5c5e7]"
                  disabled={
                    !details ||
                    serviceState === 'checking' ||
                    serviceState === 'offline'
                  }
                  onClick={analyze}
                >
                  {serviceState === 'offline'
                    ? 'Model service not connected'
                    : serviceState === 'checking'
                      ? 'Checking model service'
                      : serviceState === 'warming'
                        ? 'Run analysis (cold start)'
                        : 'Run four-expert analysis'}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            )}
          </section>
        </div>

        <div className="grid gap-4 py-7 text-white/60 md:grid-cols-3">
          <p className="flex items-center gap-3 text-xs leading-5">
            <LockKeyhole className="size-4 shrink-0 text-[#b9ff66]" />
            Uploaded bytes are processed for this request and not saved by the
            interface.
          </p>
          <p className="flex items-center gap-3 text-xs leading-5">
            <ShieldCheck className="size-4 shrink-0 text-[#b9ff66]" />
            Use the score as one signal—not a standalone moderation decision.
          </p>
          <a
            className="group flex items-center gap-3 text-xs leading-5 transition-colors hover:text-white md:justify-self-end"
            href="/journey#final-model"
          >
            Follow the released model
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </section>
    </main>
  );
}
