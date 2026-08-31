'use client';

import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Circle,
  Cpu,
  Film,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  RotateCcw,
  ScanLine,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import {
  type KeyboardEvent,
  type RefObject,
  useId,
  useMemo,
  useRef,
} from 'react';

import { Button } from '@/components/ui/button';
import {
  formatTimestamp,
  midpointTimestamps,
  type SampledFrame,
  VIDEO_FRAME_COUNT,
  type VideoAnalysisResult,
  type VideoPipelineState,
  videoResultLanguage,
} from '@/lib/video-analysis';

type ServiceState = 'checking' | 'offline' | 'ready' | 'warming';

type VideoPipelineProps = {
  canAnalyze: boolean;
  error: string | null;
  fileName: string;
  durationMs: number;
  onAnalyze: () => void;
  onReset: () => void;
  onRetrySampling: () => void;
  onSelectFrame: (index: number) => void;
  pipeline: VideoPipelineState;
  result: VideoAnalysisResult | null;
  resultRef: RefObject<HTMLDivElement | null>;
  sampledFrames: SampledFrame[];
  serviceState: ServiceState;
  videoCapability: boolean;
};

const PIPELINE_STAGES = [
  { icon: Film, label: 'Decode locally' },
  { icon: ScanLine, label: 'Sample 8 frames' },
  { icon: Cpu, label: 'FeatDistill analysis' },
  { icon: Layers3, label: 'Aggregate report' },
];

function stageState(index: number, status: VideoPipelineState['status']) {
  if (status === 'complete') return 'complete';
  if (status === 'decoding') return index === 0 ? 'active' : 'pending';
  if (status === 'sampling') {
    if (index === 0) return 'complete';
    return index === 1 ? 'active' : 'pending';
  }
  if (status === 'sampling_error') {
    if (index === 0) return 'complete';
    return index === 1 ? 'blocked' : 'pending';
  }
  if (status === 'ready') return index < 2 ? 'complete' : 'pending';
  if (status === 'requesting') {
    if (index < 2) return 'complete';
    return index === 2 ? 'active' : 'pending';
  }
  if (status === 'preparing') {
    if (index < 3) return 'complete';
    return index === 3 ? 'active' : 'pending';
  }
  return 'pending';
}

function stageDescription(
  index: number,
  pipeline: VideoPipelineState,
  serviceState: ServiceState,
  videoCapability: boolean,
) {
  if (index === 0) {
    return pipeline.status === 'decoding'
      ? 'Reading duration and dimensions'
      : 'Metadata validated in this browser';
  }
  if (index === 1) {
    if (pipeline.status === 'sampling_error') return 'Sampling needs a retry';
    if (pipeline.status === 'sampling') {
      return `${pipeline.sampledCount} of ${VIDEO_FRAME_COUNT} local PNG crops ready`;
    }
    if (pipeline.sampledCount === VIDEO_FRAME_COUNT) {
      return 'Eight midpoint crops stay visible for review';
    }
    return 'Waiting for local extraction';
  }
  if (index === 2) {
    if (pipeline.status === 'requesting') {
      return 'Waiting for the non-streaming model response';
    }
    if (pipeline.status === 'preparing' || pipeline.status === 'complete') {
      return 'Eight frame scores received together';
    }
    if (pipeline.status === 'ready') {
      if (serviceState === 'checking') return 'Checking the model service';
      if (serviceState === 'offline' || !videoCapability) {
        return 'Model scoring is currently unavailable';
      }
      return 'Ready when you choose Analyze';
    }
    return 'No frames have been sent';
  }
  if (pipeline.status === 'preparing') {
    return 'Validating mean, peak, and threshold count';
  }
  if (pipeline.status === 'complete') {
    return 'Frame trace and summary are ready';
  }
  return 'Waiting for returned frame scores';
}

function statusAnnouncement(pipeline: VideoPipelineState) {
  switch (pipeline.status) {
    case 'decoding':
      return 'Decoding video metadata locally.';
    case 'sampling':
      return `Sampled frame ${pipeline.sampledCount} of ${VIDEO_FRAME_COUNT} locally.`;
    case 'sampling_error':
      return 'Local frame sampling stopped. The video is preserved for retry.';
    case 'ready':
      return 'All eight local frames are ready to analyze.';
    case 'requesting':
      return 'Waiting for the model to return all eight frame scores.';
    case 'preparing':
      return 'Validating the returned frame report.';
    case 'complete':
      return 'The eight-frame report is complete.';
    default:
      return '';
  }
}

export function VideoPipeline({
  canAnalyze,
  durationMs,
  error,
  fileName,
  onAnalyze,
  onReset,
  onRetrySampling,
  onSelectFrame,
  pipeline,
  result,
  resultRef,
  sampledFrames,
  serviceState,
  videoCapability,
}: VideoPipelineProps) {
  const frameButtons = useRef<Array<HTMLButtonElement | null>>([]);
  const id = useId();
  const timestamps = useMemo(
    () => midpointTimestamps(durationMs),
    [durationMs],
  );
  const samplesByIndex = useMemo(
    () => new Map(sampledFrames.map((frame) => [frame.index, frame])),
    [sampledFrames],
  );
  const scoresByIndex = useMemo(
    () => new Map(result?.frame_scores.map((frame) => [frame.index, frame])),
    [result],
  );
  const selectedSample = samplesByIndex.get(pipeline.selectedFrame);
  const selectedScore = scoresByIndex.get(pipeline.selectedFrame);
  const selectedAtThreshold =
    selectedScore && result ? selectedScore.score >= result.threshold : false;
  const language = result ? videoResultLanguage(result) : null;

  const selectAdjacentFrame = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = Math.min(sampledFrames.length - 1, index + 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = Math.max(0, index - 1);
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = sampledFrames.length - 1;
    }
    if (nextIndex === null || nextIndex < 0 || nextIndex === index) return;
    event.preventDefault();
    onSelectFrame(nextIndex);
    frameButtons.current[nextIndex]?.focus();
  };

  return (
    <div ref={resultRef} className="flex flex-1 flex-col" tabIndex={-1}>
      <output className="sr-only" aria-live="polite">
        {statusAnnouncement(pipeline)}
      </output>

      <ol
        aria-label="Video analysis pipeline"
        className="grid grid-cols-2 gap-2 lg:grid-cols-4"
      >
        {PIPELINE_STAGES.map((stage, index) => {
          const state = stageState(index, pipeline.status);
          const Icon = stage.icon;
          return (
            <li
              aria-current={state === 'active' ? 'step' : undefined}
              className={`relative rounded-2xl border px-3 py-3.5 ${
                state === 'active'
                  ? 'border-[#0040c1] bg-[#edf3ff]'
                  : state === 'complete'
                    ? 'border-[#b9d0ff] bg-white'
                    : state === 'blocked'
                      ? 'border-[#ffb3a8] bg-[#fff1ef]'
                      : 'border-[#e2e8f5] bg-[#f8faff]'
              }`}
              key={stage.label}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`grid size-8 place-items-center rounded-full ${
                    state === 'complete'
                      ? 'bg-[#0040c1] text-white'
                      : state === 'active'
                        ? 'bg-[#b9ff66] text-[#102600]'
                        : state === 'blocked'
                          ? 'bg-[#ffddd7] text-[#8e2416]'
                          : 'bg-[#e8edf7] text-[#667085]'
                  }`}
                >
                  {state === 'complete' ? (
                    <Check className="size-4" />
                  ) : state === 'active' ? (
                    <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </span>
                <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#7a869e]">
                  0{index + 1}
                </span>
              </div>
              <p className="mt-3 text-xs font-semibold text-[#111827]">
                {stage.label}
              </p>
              <p className="mt-1 text-[10px] leading-4 text-[#667085]">
                {stageDescription(
                  index,
                  pipeline,
                  serviceState,
                  videoCapability,
                )}
              </p>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 overflow-hidden rounded-[22px] border border-[#c8d8fb] bg-[#071b47] text-white shadow-[0_18px_55px_rgba(7,27,71,.12)]">
        <div className="grid md:grid-cols-[minmax(240px,.94fr)_minmax(230px,1.06fr)]">
          <div
            aria-labelledby={`${id}-selected-label`}
            className="relative aspect-square min-h-[270px] overflow-hidden bg-[#020918]"
            id={`${id}-selected-panel`}
            role="tabpanel"
          >
            {selectedSample ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={`Sampled frame ${selectedSample.index + 1} at ${formatTimestamp(selectedSample.timestampMs)}`}
                className="pipeline-frame-enter absolute inset-0 size-full object-cover"
                key={selectedSample.objectUrl}
                src={selectedSample.objectUrl}
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center px-6 text-center">
                <div>
                  {pipeline.status === 'sampling' ? (
                    <LoaderCircle className="mx-auto size-9 animate-spin text-[#b9ff66] motion-reduce:animate-none" />
                  ) : (
                    <Film className="mx-auto size-9 text-white/35" />
                  )}
                  <p className="mt-4 text-sm font-medium text-white/75">
                    Preparing the first local frame
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    The raw video never leaves this device.
                  </p>
                </div>
              </div>
            )}
            <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
              <span className="rounded-full border border-white/15 bg-black/50 px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.13em] backdrop-blur-md">
                {selectedSample
                  ? `Frame ${selectedSample.index + 1} · ${formatTimestamp(selectedSample.timestampMs)}`
                  : 'Local sampling canvas'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#b9ff66] px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-[#102600]">
                <LockKeyhole className="size-3" /> Local only
              </span>
            </div>
            {selectedSample && (
              <div className="absolute inset-x-3 bottom-3 rounded-xl border border-white/15 bg-black/55 px-3 py-2 text-[10px] leading-4 text-white/75 backdrop-blur-md">
                384 × 384 lossless center crop from {fileName}
              </div>
            )}
          </div>

          <div className="flex min-h-[270px] flex-col justify-between p-5 sm:p-6">
            <div>
              <p
                className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#a9c4ff]"
                id={`${id}-selected-label`}
              >
                Selected sample
              </p>
              {selectedScore && result ? (
                <>
                  <p className="mt-3 font-display text-[clamp(4rem,8vw,6.7rem)] font-semibold leading-none tracking-[-0.075em]">
                    {Math.round(selectedScore.score * 100)}
                    <span className="ml-1 text-[.3em] tracking-normal text-[#a9c4ff]">
                      %
                    </span>
                  </p>
                  <p className="mt-2 font-mono text-[10px] text-white/55">
                    raw score {selectedScore.score.toFixed(4)} · threshold{' '}
                    {result.threshold.toFixed(2)}
                  </p>
                  <span
                    className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${
                      selectedAtThreshold
                        ? 'bg-[#b9ff66] text-[#102600]'
                        : 'bg-white/12 text-white'
                    }`}
                  >
                    {selectedAtThreshold ? (
                      <ArrowUpRight className="size-4" />
                    ) : (
                      <ArrowDownRight className="size-4" />
                    )}
                    {selectedAtThreshold
                      ? 'At or above threshold'
                      : 'Below threshold'}
                  </span>
                </>
              ) : (
                <>
                  <p className="mt-5 font-display text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">
                    {selectedSample ? 'Ready to inspect.' : 'Sampling locally.'}
                  </p>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-white/55">
                    {selectedSample
                      ? `Frame ${selectedSample.index + 1} was captured at ${formatTimestamp(selectedSample.timestampMs)}. It has not been sent or scored yet.`
                      : 'Each completed midpoint crop will appear here as the browser decodes it.'}
                  </p>
                </>
              )}
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between gap-3 font-mono text-[9px] uppercase tracking-[0.12em] text-white/45">
                <span>Local frame extraction</span>
                <span>
                  {pipeline.sampledCount} / {VIDEO_FRAME_COUNT}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/12">
                <span
                  className="pipeline-score-fill block h-full rounded-full bg-[#b9ff66]"
                  style={{
                    width: `${(pipeline.sampledCount / VIDEO_FRAME_COUNT) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#0040c1]">
              Eight midpoint samples
            </p>
            <p className="mt-1 text-xs text-[#667085]">
              Select a frame to inspect its crop and seek the source video.
            </p>
          </div>
          <span className="shrink-0 font-mono text-[9px] text-[#667085]">
            {pipeline.sampledCount} ready
          </span>
        </div>
        <div
          aria-label="Sampled frame timeline"
          className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-3 [scrollbar-color:#9bb8f3_transparent] [scrollbar-width:thin]"
          role="tablist"
        >
          {timestamps.map((timestampMs, index) => {
            const sample = samplesByIndex.get(index);
            const score = scoresByIndex.get(index);
            const selected = pipeline.selectedFrame === index;
            const atThreshold =
              score && result ? score.score >= result.threshold : false;
            const cue = score
              ? atThreshold
                ? 'At or above threshold'
                : 'Below threshold'
              : sample
                ? 'Ready, not scored'
                : 'Waiting for sample';
            return (
              <button
                aria-controls={`${id}-selected-panel`}
                aria-label={`Frame ${index + 1} at ${formatTimestamp(timestampMs)}. ${
                  score
                    ? `${(score.score * 100).toFixed(0)} percent. ${cue}.`
                    : cue
                }`}
                aria-selected={selected}
                className={`min-w-[126px] snap-start overflow-hidden rounded-2xl border p-2 text-left transition-[border-color,background-color,box-shadow] disabled:cursor-default ${
                  selected && sample
                    ? 'border-[#0040c1] bg-[#edf3ff] shadow-[0_8px_24px_rgba(0,64,193,.12)]'
                    : 'border-[#d7e2f8] bg-white enabled:hover:border-[#8eacf0]'
                }`}
                disabled={!sample}
                id={`${id}-frame-${index}`}
                key={timestampMs}
                onClick={() => onSelectFrame(index)}
                onKeyDown={(event) => selectAdjacentFrame(event, index)}
                ref={(element) => {
                  frameButtons.current[index] = element;
                }}
                role="tab"
                tabIndex={selected && sample ? 0 : -1}
                type="button"
              >
                <span className="relative block aspect-square overflow-hidden rounded-xl bg-[#eaf0fb]">
                  {sample ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt=""
                      className="pipeline-frame-enter size-full object-cover"
                      src={sample.objectUrl}
                    />
                  ) : (
                    <span className="grid size-full place-items-center text-[#9ba8bd]">
                      <Circle className="size-5" strokeWidth={1.5} />
                    </span>
                  )}
                  <span className="absolute left-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-1 font-mono text-[7px] uppercase tracking-[0.09em] text-white">
                    F{index + 1}
                  </span>
                </span>
                <span className="mt-2 block font-mono text-[8px] uppercase tracking-[0.08em] text-[#667085]">
                  {formatTimestamp(timestampMs)}
                </span>
                {score ? (
                  <>
                    <span className="mt-1 flex items-baseline justify-between gap-2">
                      <span className="text-lg font-semibold text-[#111827]">
                        {(score.score * 100).toFixed(0)}%
                      </span>
                      <span className="font-mono text-[7px] text-[#667085]">
                        {score.score.toFixed(4)}
                      </span>
                    </span>
                    <span
                      className={`mt-1.5 flex items-center gap-1 text-[8px] font-semibold ${
                        atThreshold ? 'text-[#315b00]' : 'text-[#667085]'
                      }`}
                    >
                      {atThreshold ? (
                        <ArrowUpRight className="size-3" />
                      ) : (
                        <ArrowDownRight className="size-3" />
                      )}
                      {cue}
                    </span>
                    <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-[#e4ebf8]">
                      <span
                        className={`pipeline-score-fill block h-full rounded-full ${
                          atThreshold ? 'bg-[#669c22]' : 'bg-[#0040c1]'
                        }`}
                        style={{ width: `${score.score * 100}%` }}
                      />
                    </span>
                  </>
                ) : (
                  <span className="mt-1.5 block text-[9px] font-medium text-[#667085]">
                    {cue}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {pipeline.status === 'sampling_error' ? (
        <div className="mt-2 rounded-[18px] border border-[#ffb3a8] bg-[#fff1ef] p-4">
          <p className="text-sm font-semibold text-[#8e2416]">
            Local sampling stopped
          </p>
          <p className="mt-1 text-xs leading-5 text-[#8e2416]/80">
            {error ?? 'The browser could not prepare all eight frames.'} The
            original video is still selected.
          </p>
          <Button
            className="mt-3 h-11 rounded-full bg-[#8e2416] px-5 text-white hover:bg-[#67190f]"
            onClick={onRetrySampling}
          >
            Retry frame sampling
            <RotateCcw className="size-4" />
          </Button>
        </div>
      ) : pipeline.status === 'ready' ? (
        <div className="mt-2 rounded-[18px] border border-[#c8d8fb] bg-[#f6f9ff] p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-md">
              <p className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
                {serviceState === 'offline' || !videoCapability ? (
                  <WifiOff className="size-4 text-[#8e2416]" />
                ) : (
                  <Check className="size-4 text-[#4b7d0e]" />
                )}
                Eight local frames are ready
              </p>
              <p className="mt-1 text-xs leading-5 text-[#667085]">
                {serviceState === 'offline' || !videoCapability
                  ? 'You can inspect every sample locally. Model scoring becomes available when the frame-analysis service is connected.'
                  : 'Only these eight derived PNG crops will be sent. The original video remains on this device.'}
              </p>
              {error && (
                <p className="mt-2 text-xs font-medium text-[#8e2416]">
                  The last scoring attempt stopped; all eight frames were
                  preserved for retry.
                </p>
              )}
            </div>
            <Button
              className="h-12 shrink-0 rounded-full bg-[#0040c1] px-5 text-white hover:bg-[#002f91] disabled:bg-[#c9d4e8] disabled:text-[#667085]"
              disabled={!canAnalyze}
              onClick={onAnalyze}
            >
              {serviceState === 'checking'
                ? 'Checking model service'
                : serviceState === 'offline' || !videoCapability
                  ? 'Model scoring unavailable'
                  : error
                    ? 'Retry 8-frame analysis'
                    : 'Analyze 8 sampled frames'}
              {canAnalyze ? (
                <Sparkles className="size-4" />
              ) : (
                <LockKeyhole className="size-4" />
              )}
            </Button>
          </div>
        </div>
      ) : pipeline.status === 'requesting' ||
        pipeline.status === 'preparing' ? (
        <div className="mt-2 flex items-start gap-3 rounded-[18px] border border-[#c8d8fb] bg-[#edf3ff] p-4">
          <LoaderCircle className="mt-0.5 size-5 shrink-0 animate-spin text-[#0040c1] motion-reduce:animate-none" />
          <div>
            <p className="text-sm font-semibold text-[#111827]">
              {pipeline.status === 'requesting'
                ? 'Waiting for all eight frame scores'
                : 'Preparing the verified frame report'}
            </p>
            <p className="mt-1 text-xs leading-5 text-[#667085]">
              {pipeline.status === 'requesting'
                ? 'The service returns one complete batch response, so SynthFlag does not invent per-frame model progress or an ETA.'
                : 'The returned mean, peak frame, timestamp, and threshold count are being checked before display.'}
            </p>
          </div>
        </div>
      ) : null}

      {result && language && (
        <div className="mt-4">
          <div className="rounded-[22px] bg-[#0040c1] p-5 text-white sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <span className="rounded-full bg-[#b9ff66] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#102600]">
                8-frame report complete
              </span>
              <Sparkles className="size-5 text-[#b9ff66]" />
            </div>
            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/55">
                  Mean sampled-frame signal
                </p>
                <p className="mt-1 font-display text-[clamp(4.2rem,8vw,6.5rem)] font-semibold leading-none tracking-[-0.075em]">
                  {Math.round(result.summary.mean_score * 100)}
                  <span className="ml-1 text-[.3em] tracking-normal text-[#a9c4ff]">
                    %
                  </span>
                </p>
              </div>
              <span className="pb-2 font-mono text-[9px] text-white/55">
                mean {result.summary.mean_score.toFixed(4)}
              </span>
            </div>
            <div className="relative mt-4 h-2 overflow-visible rounded-full bg-white/16">
              <span
                className="pipeline-score-fill block h-full rounded-full bg-[#b9ff66]"
                style={{ width: `${result.summary.mean_score * 100}%` }}
              />
              <span
                aria-hidden="true"
                className="absolute top-1/2 h-5 w-px -translate-y-1/2 bg-white/65"
                style={{ left: `${result.threshold * 100}%` }}
              />
            </div>
          </div>

          <div className="mt-3 rounded-[16px] border border-[#c8d8fb] bg-[#f6f9ff] p-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#0040c1]">
              {language.eyebrow}
            </p>
            <p className="mt-2 text-sm leading-5 text-[#405071]">
              {language.detail}
            </p>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-[16px] border border-[#d7e2f8] bg-[#d7e2f8] text-xs sm:grid-cols-4">
            <div className="bg-white p-3">
              <dt className="text-[#667085]">Peak frame</dt>
              <dd className="mt-1 font-medium">
                {(result.summary.peak_score * 100).toFixed(0)}% at{' '}
                {formatTimestamp(result.summary.peak_timestamp_ms)}
                <span className="mt-0.5 block font-mono text-[8px] text-[#667085]">
                  frame {result.summary.peak_frame_index + 1} · raw{' '}
                  {result.summary.peak_score.toFixed(4)}
                </span>
              </dd>
            </div>
            <div className="bg-white p-3">
              <dt className="text-[#667085]">At threshold</dt>
              <dd className="mt-1 font-medium">
                {result.summary.above_threshold_count} of {result.sample_count}{' '}
                frames
              </dd>
            </div>
            <div className="bg-white p-3">
              <dt className="text-[#667085]">Processing</dt>
              <dd className="mt-1 font-medium">
                {(result.processing_ms / 1000).toFixed(1)} sec
              </dd>
            </div>
            <div className="bg-white p-3">
              <dt className="text-[#667085]">Architecture</dt>
              <dd className="mt-1 font-medium">FeatDistill 4-expert</dd>
            </div>
          </dl>

          <p className="mt-3 rounded-xl bg-[#fff8dc] px-3 py-2 text-xs leading-5 text-[#735c13]">
            This is a descriptive summary of eight image-model scores. SynthFlag
            does not inspect audio or motion, and the mean is not a calibrated
            probability that the video is AI-generated.
          </p>

          <Button
            className="mt-4 h-12 w-full rounded-full bg-[#111827] px-5 text-white hover:bg-[#0040c1]"
            onClick={onReset}
          >
            Analyze another video
            <RotateCcw className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
