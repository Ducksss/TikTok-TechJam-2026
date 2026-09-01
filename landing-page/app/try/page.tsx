'use client';

/* oxlint-disable next/no-html-link-for-pages -- vinext's production next/link prefetch shim currently breaks route clicks; standard anchors keep public navigation reliable. */

import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileImage,
  FileVideo,
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
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  canAnalyzeSampledVideo,
  INITIAL_VIDEO_PIPELINE_STATE,
  MAX_VIDEO_DURATION_MS,
  midpointTimestamps,
  parseVideoAnalysisResult,
  type SampledFrame,
  validateVideoFile,
  VIDEO_FRAME_COUNT,
  VIDEO_FRAME_SIZE,
  type VideoAnalysisResult,
  videoPipelineReducer,
} from '@/lib/video-analysis';

import { VideoPipeline } from './video-pipeline';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ANALYSIS_TIMEOUT_MS = 300_000;

type MediaMode = 'image' | 'video';
type ImageWorkStatus = 'complete' | 'idle' | 'requesting';
type ServiceState = 'checking' | 'offline' | 'ready' | 'warming';

type ImageDetails = {
  file: File;
  height: number;
  kind: 'image';
  objectUrl: string;
  width: number;
};

type VideoDetails = {
  durationMs: number;
  file: File;
  height: number;
  kind: 'video';
  objectUrl: string;
  width: number;
};

type MediaDetails = ImageDetails | VideoDetails;

type ImageAnalysisResult = {
  checkpoint?: string;
  model?: string;
  processing_ms?: number;
  score: number;
  threshold?: number;
};

type AnalysisResult = ImageAnalysisResult | VideoAnalysisResult;

type HealthPayload = {
  capabilities?: {
    sampled_video_frames?: { endpoint?: string };
  };
  connected?: boolean;
  ready?: boolean;
};

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatMediaType(file: File) {
  const extension = file.name.split('.').pop()?.toUpperCase();
  if (extension === 'JPG') return 'JPEG';
  return extension || file.type || 'Unknown format';
}

function imageResultLanguage(score: number) {
  if (score >= 0.75) {
    return {
      eyebrow: 'Elevated synthetic signal',
      detail:
        'The ensemble found a strong pattern match with AI-generated imagery.',
    };
  }
  if (score >= 0.5) {
    return {
      eyebrow: 'Moderately elevated synthetic signal',
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

function isVideoResult(result: AnalysisResult): result is VideoAnalysisResult {
  return 'analysis_type' in result;
}

function fileMode(file: File): MediaMode | null {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (
    file.type.startsWith('video/') ||
    extension === 'mp4' ||
    extension === 'webm'
  ) {
    return 'video';
  }
  if (ACCEPTED_IMAGE_TYPES.has(file.type)) return 'image';
  return null;
}

function seekVideo(
  video: HTMLVideoElement,
  timestampMs: number,
  signal: AbortSignal,
) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Sampling was cancelled.', 'AbortError'));
      return;
    }
    const targetSeconds = timestampMs / 1000;
    if (
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      Math.abs(video.currentTime - targetSeconds) < 0.001
    ) {
      window.requestAnimationFrame(() => resolve());
      return;
    }
    const cleanup = () => {
      window.clearTimeout(timeout);
      signal.removeEventListener('abort', onAbort);
      video.removeEventListener('error', onError);
      video.removeEventListener('seeked', onSeeked);
    };
    const onAbort = () => {
      cleanup();
      reject(new DOMException('Sampling was cancelled.', 'AbortError'));
    };
    const onError = () => {
      cleanup();
      reject(new Error('The browser could not decode a sampled frame.'));
    };
    const onSeeked = () => {
      cleanup();
      window.requestAnimationFrame(() => resolve());
    };
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('A sampled frame took too long to decode.'));
    }, 8_000);

    signal.addEventListener('abort', onAbort, { once: true });
    video.addEventListener('error', onError, { once: true });
    video.addEventListener('seeked', onSeeked, { once: true });
    video.currentTime = targetSeconds;
  });
}

function loadVideoDecoder(objectUrl: string, signal: AbortSignal) {
  return new Promise<HTMLVideoElement>((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      window.clearTimeout(timeout);
      signal.removeEventListener('abort', onAbort);
      video.removeEventListener('error', onError);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
    const onAbort = () => {
      cleanup();
      video.removeAttribute('src');
      video.load();
      reject(new DOMException('Video decoding was cancelled.', 'AbortError'));
    };
    const onError = () => {
      cleanup();
      reject(
        new Error(
          'This browser could not decode the video. Use an H.264 MP4, or a WebM supported by this browser.',
        ),
      );
    };
    const onLoadedMetadata = () => {
      cleanup();
      resolve(video);
    };
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Video metadata took too long to decode.'));
    }, 12_000);

    signal.addEventListener('abort', onAbort, { once: true });
    video.addEventListener('error', onError, { once: true });
    video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
    video.src = objectUrl;
    video.load();
  });
}

function releaseVideoDecoder(video: HTMLVideoElement) {
  video.pause();
  video.removeAttribute('src');
  video.load();
}

function canvasPng(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('The browser could not encode a sampled frame.'));
    }, 'image/png');
  });
}

async function extractVideoFrames(
  video: HTMLVideoElement,
  durationMs: number,
  signal: AbortSignal,
  onFrame: (frame: SampledFrame) => void,
) {
  const timestamps = midpointTimestamps(durationMs);
  const frames: SampledFrame[] = [];
  const canvas = document.createElement('canvas');
  canvas.width = VIDEO_FRAME_SIZE;
  canvas.height = VIDEO_FRAME_SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser cannot prepare video frames.');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  video.pause();
  for (const [index, timestampMs] of timestamps.entries()) {
    if (signal.aborted) {
      throw new DOMException('Sampling was cancelled.', 'AbortError');
    }
    await seekVideo(video, timestampMs, signal);
    const cropSize = Math.min(video.videoWidth, video.videoHeight);
    const sourceX = (video.videoWidth - cropSize) / 2;
    const sourceY = (video.videoHeight - cropSize) / 2;
    context.clearRect(0, 0, VIDEO_FRAME_SIZE, VIDEO_FRAME_SIZE);
    context.drawImage(
      video,
      sourceX,
      sourceY,
      cropSize,
      cropSize,
      0,
      0,
      VIDEO_FRAME_SIZE,
      VIDEO_FRAME_SIZE,
    );
    const blob = await canvasPng(canvas);
    const frame = {
      blob,
      index,
      objectUrl: URL.createObjectURL(blob),
      timestampMs,
    };
    frames.push(frame);
    onFrame(frame);
  }
  return frames;
}

async function responsePayload(response: Response) {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function responseError(payload: Record<string, unknown>, fallback: string) {
  if (typeof payload.error === 'string') return payload.error;
  if (typeof payload.detail === 'string') return payload.detail;
  return fallback;
}

export default function TryDetector() {
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const samplingControllerRef = useRef<AbortController | null>(null);
  const pendingMediaUrlRef = useRef<string | null>(null);
  const frameUrlsRef = useRef(new Set<string>());
  const operationRef = useRef(0);
  const [mode, setMode] = useState<MediaMode>('image');
  const [media, setMedia] = useState<MediaDetails | null>(null);
  const [sampledFrames, setSampledFrames] = useState<SampledFrame[]>([]);
  const [videoPipeline, dispatchVideoPipeline] = useReducer(
    videoPipelineReducer,
    INITIAL_VIDEO_PIPELINE_STATE,
  );
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [serviceState, setServiceState] = useState<ServiceState>('checking');
  const [imageStatus, setImageStatus] = useState<ImageWorkStatus>('idle');
  const [videoCapability, setVideoCapability] = useState(false);

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
        return (await response.json()) as HealthPayload;
      })
      .then((health) => {
        const connected = directEndpoint ? true : health.connected === true;
        setVideoCapability(
          Boolean(health.capabilities?.sampled_video_frames?.endpoint),
        );
        setServiceState(
          !connected ? 'offline' : health.ready === true ? 'ready' : 'warming',
        );
      })
      .catch(() => {
        setServiceState('offline');
        setVideoCapability(false);
      })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (media?.objectUrl) URL.revokeObjectURL(media.objectUrl);
    };
  }, [media]);

  const revokeFrameUrls = useCallback(() => {
    for (const objectUrl of frameUrlsRef.current) {
      URL.revokeObjectURL(objectUrl);
    }
    frameUrlsRef.current.clear();
  }, []);

  const clearSampledFrames = useCallback(() => {
    revokeFrameUrls();
    setSampledFrames([]);
  }, [revokeFrameUrls]);

  useEffect(() => {
    return () => {
      requestControllerRef.current?.abort();
      samplingControllerRef.current?.abort();
      revokeFrameUrls();
      if (pendingMediaUrlRef.current) {
        URL.revokeObjectURL(pendingMediaUrlRef.current);
        pendingMediaUrlRef.current = null;
      }
    };
  }, [revokeFrameUrls]);

  const reset = useCallback(() => {
    operationRef.current += 1;
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    samplingControllerRef.current?.abort();
    samplingControllerRef.current = null;
    if (pendingMediaUrlRef.current) {
      URL.revokeObjectURL(pendingMediaUrlRef.current);
      pendingMediaUrlRef.current = null;
    }
    setMedia(null);
    clearSampledFrames();
    setError(null);
    setResult(null);
    setImageStatus('idle');
    dispatchVideoPipeline({ type: 'reset' });
    if (inputRef.current) inputRef.current.value = '';
  }, [clearSampledFrames]);

  const chooseMode = useCallback(
    (nextMode: MediaMode) => {
      if (nextMode === mode) return;
      reset();
      setMode(nextMode);
    },
    [mode, reset],
  );

  const sampleVideo = useCallback(
    async (details: VideoDetails, suppliedDecoder?: HTMLVideoElement) => {
      samplingControllerRef.current?.abort();
      const operation = ++operationRef.current;
      const controller = new AbortController();
      samplingControllerRef.current = controller;
      clearSampledFrames();
      setError(null);
      setResult(null);
      dispatchVideoPipeline({ type: 'metadata_ready' });
      let decoder = suppliedDecoder;

      try {
        decoder ??= await loadVideoDecoder(
          details.objectUrl,
          controller.signal,
        );
        await extractVideoFrames(
          decoder,
          details.durationMs,
          controller.signal,
          (frame) => {
            if (
              operation !== operationRef.current ||
              controller.signal.aborted
            ) {
              URL.revokeObjectURL(frame.objectUrl);
              throw new DOMException('Sampling was cancelled.', 'AbortError');
            }
            frameUrlsRef.current.add(frame.objectUrl);
            setSampledFrames((current) => [...current, frame]);
            dispatchVideoPipeline({
              index: frame.index,
              type: 'frame_sampled',
            });
          },
        );
        if (operation !== operationRef.current) return;
        dispatchVideoPipeline({ type: 'sampling_completed' });
      } catch (reason) {
        if (operation !== operationRef.current) return;
        clearSampledFrames();
        dispatchVideoPipeline({ type: 'sampling_failed' });
        setError(
          reason instanceof Error
            ? reason.message
            : 'The browser could not prepare all eight sampled frames.',
        );
      } finally {
        if (decoder) releaseVideoDecoder(decoder);
        if (samplingControllerRef.current === controller) {
          samplingControllerRef.current = null;
        }
      }
    },
    [clearSampledFrames],
  );

  const acceptFile = useCallback(
    async (file?: File) => {
      const operation = ++operationRef.current;
      requestControllerRef.current?.abort();
      requestControllerRef.current = null;
      samplingControllerRef.current?.abort();
      samplingControllerRef.current = null;
      if (pendingMediaUrlRef.current) {
        URL.revokeObjectURL(pendingMediaUrlRef.current);
        pendingMediaUrlRef.current = null;
      }
      setMedia(null);
      clearSampledFrames();
      setError(null);
      setResult(null);
      setImageStatus('idle');
      dispatchVideoPipeline({ type: 'reset' });
      if (!file) return;

      const detectedMode = fileMode(file);
      if (!detectedMode) {
        setError('Choose a JPEG, PNG, WebP, H.264 MP4, or WebM file.');
        return;
      }
      setMode(detectedMode);

      if (detectedMode === 'image') {
        if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
          setError('Choose a JPEG, PNG, or WebP image.');
          return;
        }
        if (file.size > MAX_IMAGE_BYTES) {
          setError(
            'That image is over 10 MB. Choose a smaller file and try again.',
          );
          return;
        }

        const objectUrl = URL.createObjectURL(file);
        pendingMediaUrlRef.current = objectUrl;
        const image = new window.Image();
        image.onload = () => {
          if (operation !== operationRef.current) {
            URL.revokeObjectURL(objectUrl);
            return;
          }
          pendingMediaUrlRef.current = null;
          setMedia({
            file,
            height: image.naturalHeight,
            kind: 'image',
            objectUrl,
            width: image.naturalWidth,
          });
        };
        image.onerror = () => {
          if (pendingMediaUrlRef.current === objectUrl) {
            pendingMediaUrlRef.current = null;
          }
          URL.revokeObjectURL(objectUrl);
          if (operation === operationRef.current) {
            setError('We could not decode that image. Try exporting it again.');
          }
        };
        image.src = objectUrl;
        return;
      }

      const fileError = validateVideoFile(file);
      if (fileError) {
        setError(fileError);
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      pendingMediaUrlRef.current = objectUrl;
      const controller = new AbortController();
      samplingControllerRef.current = controller;
      dispatchVideoPipeline({ type: 'decode_started' });
      let decoder: HTMLVideoElement | undefined;
      try {
        decoder = await loadVideoDecoder(objectUrl, controller.signal);
        if (operation !== operationRef.current) {
          releaseVideoDecoder(decoder);
          return;
        }
        const exactDurationMs = decoder.duration * 1000;
        if (
          !Number.isFinite(exactDurationMs) ||
          exactDurationMs < 1_000 ||
          exactDurationMs > MAX_VIDEO_DURATION_MS
        ) {
          throw new Error('Choose a video between 1 and 10 seconds long.');
        }
        if (
          decoder.videoWidth < 32 ||
          decoder.videoHeight < 32 ||
          decoder.videoWidth * decoder.videoHeight > 50_000_000
        ) {
          throw new Error(
            'That video has unsupported or excessively large dimensions.',
          );
        }
        const details: VideoDetails = {
          durationMs: Math.round(exactDurationMs),
          file,
          height: decoder.videoHeight,
          kind: 'video',
          objectUrl,
          width: decoder.videoWidth,
        };
        pendingMediaUrlRef.current = null;
        setMedia(details);
        await sampleVideo(details, decoder);
        decoder = undefined;
      } catch (reason) {
        if (decoder) releaseVideoDecoder(decoder);
        if (pendingMediaUrlRef.current === objectUrl) {
          pendingMediaUrlRef.current = null;
          URL.revokeObjectURL(objectUrl);
        }
        if (operation !== operationRef.current) return;
        dispatchVideoPipeline({ type: 'reset' });
        setError(
          reason instanceof Error
            ? reason.message
            : 'The browser could not decode that video.',
        );
      } finally {
        if (samplingControllerRef.current === controller) {
          samplingControllerRef.current = null;
        }
      }
    },
    [clearSampledFrames, sampleVideo],
  );

  const analyze = useCallback(async () => {
    if (
      !media ||
      serviceState === 'checking' ||
      serviceState === 'offline' ||
      (media.kind === 'image' && imageStatus === 'requesting') ||
      (media.kind === 'video' &&
        (!videoCapability ||
          sampledFrames.length !== VIDEO_FRAME_COUNT ||
          !canAnalyzeSampledVideo(videoPipeline)))
    ) {
      return;
    }

    const operation = ++operationRef.current;
    setError(null);
    setResult(null);
    const directEndpoint =
      process.env.NEXT_PUBLIC_SYNTHFLAG_INFERENCE_URL?.replace(/\/$/, '');
    const controller = new AbortController();
    requestControllerRef.current = controller;
    const timeout = window.setTimeout(
      () => controller.abort(),
      ANALYSIS_TIMEOUT_MS,
    );

    try {
      if (media.kind === 'image') {
        setImageStatus('requesting');
        const body = new FormData();
        body.append('image', media.file);
        const endpoint = directEndpoint
          ? `${directEndpoint}/v1/analyze`
          : '/api/analyze';
        const response = await fetch(endpoint, {
          body,
          method: 'POST',
          signal: controller.signal,
        });
        const payload = await responsePayload(response);
        if (!response.ok) {
          throw new Error(
            responseError(
              payload,
              'The detector could not analyze this image.',
            ),
          );
        }
        if (
          typeof payload.score !== 'number' ||
          !Number.isFinite(payload.score) ||
          payload.score < 0 ||
          payload.score > 1
        ) {
          throw new Error('The detector returned an invalid score.');
        }
        if (operation !== operationRef.current) return;
        setResult(payload as ImageAnalysisResult);
        setImageStatus('complete');
      } else {
        const frames = sampledFrames;
        dispatchVideoPipeline({ type: 'analysis_started' });
        const body = new FormData();
        for (const frame of frames) {
          body.append(
            'frames',
            frame.blob,
            `sampled-frame-${String(frame.index + 1).padStart(2, '0')}.png`,
          );
        }
        body.append('duration_ms', String(media.durationMs));
        body.append(
          'timestamps_ms',
          JSON.stringify(frames.map((frame) => frame.timestampMs)),
        );
        const endpoint = directEndpoint
          ? `${directEndpoint}/v1/analyze-frames`
          : '/api/analyze-video';
        const response = await fetch(endpoint, {
          body,
          method: 'POST',
          signal: controller.signal,
        });
        const payload = await responsePayload(response);
        if (!response.ok) {
          throw new Error(
            responseError(
              payload,
              'The detector could not analyze the sampled video frames.',
            ),
          );
        }
        dispatchVideoPipeline({ type: 'analysis_received' });
        await new Promise<void>((resolve) =>
          window.requestAnimationFrame(() => resolve()),
        );
        const parsed = parseVideoAnalysisResult(payload, {
          durationMs: media.durationMs,
          timestampsMs: frames.map((frame) => frame.timestampMs),
        });
        if (operation !== operationRef.current) return;
        setResult(parsed);
        dispatchVideoPipeline({
          peakFrameIndex: parsed.summary.peak_frame_index,
          type: 'analysis_completed',
        });
        const peakFrame = frames[parsed.summary.peak_frame_index];
        if (peakFrame && videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = peakFrame.timestampMs / 1000;
        }
      }

      window.setTimeout(() => {
        resultRef.current?.focus({ preventScroll: true });
      }, 0);
    } catch (reason) {
      if (operation !== operationRef.current) return;
      if (media.kind === 'video') {
        dispatchVideoPipeline({ type: 'analysis_failed' });
      } else {
        setImageStatus('idle');
      }
      setError(
        reason instanceof DOMException && reason.name === 'AbortError'
          ? 'Analysis reached the five-minute limit. Your selection is preserved so you can retry.'
          : reason instanceof Error
            ? reason.message
            : 'The detector could not complete the analysis.',
      );
    } finally {
      window.clearTimeout(timeout);
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
      }
    }
  }, [
    imageStatus,
    media,
    sampledFrames,
    serviceState,
    videoCapability,
    videoPipeline,
  ]);

  const retryVideoSampling = useCallback(() => {
    if (media?.kind !== 'video') return;
    void sampleVideo(media);
  }, [media, sampleVideo]);

  const selectVideoFrame = useCallback(
    (index: number) => {
      const frame = sampledFrames.find((sample) => sample.index === index);
      if (!frame) return;
      dispatchVideoPipeline({ index, type: 'frame_selected' });
      const video = videoRef.current;
      if (!video) return;
      const seekPreview = () => {
        video.pause();
        video.currentTime = frame.timestampMs / 1000;
      };
      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
        seekPreview();
      } else {
        video.addEventListener('loadedmetadata', seekPreview, { once: true });
      }
    },
    [sampledFrames],
  );

  const working =
    imageStatus === 'requesting' ||
    videoPipeline.status === 'decoding' ||
    videoPipeline.status === 'sampling' ||
    videoPipeline.status === 'requesting' ||
    videoPipeline.status === 'preparing';
  const videoResult = result && isVideoResult(result) ? result : null;
  const imageResult = result && !isVideoResult(result) ? result : null;
  const imageLanguage = imageResult
    ? imageResultLanguage(imageResult.score)
    : null;
  const imageButtonDisabled =
    !media ||
    working ||
    serviceState === 'checking' ||
    serviceState === 'offline';
  const videoCanAnalyze =
    media?.kind === 'video' &&
    canAnalyzeSampledVideo(videoPipeline) &&
    sampledFrames.length === VIDEO_FRAME_COUNT &&
    serviceState !== 'checking' &&
    serviceState !== 'offline' &&
    videoCapability;
  const inputAccept =
    mode === 'image'
      ? 'image/jpeg,image/png,image/webp'
      : 'video/mp4,video/webm,.mp4,.webm';

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
          <p className="max-w-xl text-sm leading-6 text-white/65 sm:text-base lg:max-w-md">
            Analyze one image or eight uniformly sampled video frames. SynthFlag
            reports visual model signals—not authorship or provenance.
          </p>
        </div>

        <div className="mb-4 inline-flex rounded-full border border-white/25 bg-white/10 p-1 text-white backdrop-blur-sm">
          {(['image', 'video'] as const).map((value) => (
            <button
              aria-pressed={mode === value}
              className={`flex min-w-32 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                mode === value
                  ? 'bg-white text-[#0040c1]'
                  : 'text-white/65 hover:text-white'
              }`}
              key={value}
              onClick={() => chooseMode(value)}
              type="button"
            >
              {value === 'image' ? (
                <FileImage className="size-4" />
              ) : (
                <FileVideo className="size-4" />
              )}
              {value === 'image' ? 'Image' : 'Video'}
            </button>
          ))}
        </div>

        <div
          className={`grid overflow-hidden rounded-[30px] border border-white/25 bg-[#eff4ff] shadow-[0_32px_100px_rgba(0,14,65,.32)] lg:min-h-[700px] ${
            mode === 'video'
              ? 'lg:grid-cols-[minmax(360px,.72fr)_minmax(600px,1.28fr)]'
              : 'lg:grid-cols-[minmax(0,1.04fr)_minmax(450px,.76fr)]'
          }`}
        >
          <section className="flex min-h-[610px] flex-col border-b border-[#c8d8fb] p-4 sm:p-7 lg:border-b-0 lg:border-r lg:p-9">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-full bg-[#0040c1] font-mono text-[10px] text-white">
                  01
                </span>
                <div>
                  <h2 className="font-display text-xl font-semibold tracking-[-0.035em]">
                    {mode === 'image' ? 'Image input' : 'Video input'}
                  </h2>
                  <p className="text-xs text-[#667085]">
                    {mode === 'image'
                      ? 'One frame at a time'
                      : 'Eight midpoint samples · visual frames only'}
                  </p>
                </div>
              </div>
              {media && (
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

            {!media ? (
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
                  void acceptFile(event.dataTransfer.files[0]);
                }}
                type="button"
              >
                <span className="absolute inset-4 rounded-[18px] border border-[#dce6fb]" />
                <span className="relative mb-6 grid size-20 place-items-center rounded-full bg-[#0040c1] text-white shadow-[0_16px_35px_rgba(0,64,193,.26)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105">
                  <Upload className="size-7" strokeWidth={2} />
                </span>
                <span className="relative font-display text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                  Drop your {mode} here
                </span>
                <span className="relative mt-3 max-w-lg text-sm leading-6 text-[#667085]">
                  {mode === 'image'
                    ? 'or click to browse · JPEG, PNG, WebP · up to 10 MB'
                    : 'or click to browse · H.264 MP4 or supported WebM · 1–10 sec · up to 50 MB'}
                </span>
                <span className="relative mt-7 inline-flex items-center gap-2 rounded-full bg-[#dfe9ff] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.13em] text-[#0040c1]">
                  <LockKeyhole className="size-3.5" />
                  {mode === 'image'
                    ? 'Processed for this request'
                    : 'Raw video stays on this device'}
                </span>
              </button>
            ) : (
              <div className="relative flex flex-1 flex-col overflow-hidden rounded-[24px] bg-[#071b47] p-3 sm:p-4">
                <div className="relative min-h-[350px] flex-1 overflow-hidden rounded-[17px] bg-black/30">
                  {media.kind === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={`Preview of ${media.file.name}`}
                      className="absolute inset-0 h-full w-full object-contain"
                      src={media.objectUrl}
                    />
                  ) : (
                    // oxlint-disable-next-line jsx-a11y/media-has-caption -- This is a local, muted visual preview; SynthFlag does not inspect audio and has no caption track to supply.
                    <video
                      ref={videoRef}
                      aria-label={`Preview of ${media.file.name}`}
                      className="absolute inset-0 h-full w-full object-contain"
                      controls
                      muted
                      playsInline
                      preload="auto"
                      src={media.objectUrl}
                    />
                  )}
                  {working && (
                    <div className="scan-pass pointer-events-none absolute inset-x-0 top-0 h-px bg-[#b9ff66] shadow-[0_0_18px_4px_rgba(185,255,102,.65)]" />
                  )}
                  <div className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/45 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white backdrop-blur-md">
                    Local {media.kind} preview
                  </div>
                  <button
                    aria-label={`Remove ${media.kind}`}
                    className="absolute right-3 top-3 grid size-8 place-items-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-white hover:text-[#071b47]"
                    onClick={reset}
                    type="button"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-1 pt-4 text-white">
                  <div className="min-w-0">
                    <p className="max-w-[330px] truncate text-sm font-medium">
                      {media.file.name}
                    </p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white/50">
                      {formatMediaType(media.file)} · {media.width} ×{' '}
                      {media.height} px · {formatBytes(media.file.size)}
                      {media.kind === 'video'
                        ? ` · ${(media.durationMs / 1000).toFixed(2)} sec`
                        : ''}
                    </p>
                  </div>
                  <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-white/70">
                    <Check className="size-3 text-[#b9ff66]" /> Valid{' '}
                    {media.kind}
                  </span>
                </div>
              </div>
            )}

            <input
              ref={inputRef}
              accept={inputAccept}
              className="sr-only"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = '';
                void acceptFile(file);
              }}
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

          <section className="flex min-h-[610px] min-w-0 flex-col bg-white p-4 sm:p-7 lg:p-9">
            <div className="mb-6 flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-full bg-[#0040c1] font-mono text-[10px] text-white">
                02
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold tracking-[-0.035em]">
                  {mode === 'image' ? 'Signal report' : 'Frame pipeline'}
                </h2>
                <p className="text-xs text-[#667085]">
                  {mode === 'image'
                    ? 'Probability, not provenance'
                    : 'Local samples first · model scores second'}
                </p>
              </div>
            </div>

            {mode === 'video' && media?.kind === 'video' ? (
              <VideoPipeline
                canAnalyze={videoCanAnalyze}
                durationMs={media.durationMs}
                error={error}
                fileName={media.file.name}
                onAnalyze={analyze}
                onReset={reset}
                onRetrySampling={retryVideoSampling}
                onSelectFrame={selectVideoFrame}
                pipeline={videoPipeline}
                result={videoResult}
                resultRef={resultRef}
                sampledFrames={sampledFrames}
                serviceState={serviceState}
                videoCapability={videoCapability}
              />
            ) : mode === 'video' && videoPipeline.status === 'decoding' ? (
              <ProgressReport mediaKind="video" status="decoding" />
            ) : mode === 'image' && imageStatus === 'requesting' ? (
              <ProgressReport mediaKind="image" status="requesting" />
            ) : imageResult && imageLanguage ? (
              <ImageReport
                language={imageLanguage}
                onReset={reset}
                result={imageResult}
                resultRef={resultRef}
              />
            ) : (
              <EmptyReport
                buttonDisabled={imageButtonDisabled}
                media={media}
                mode={mode}
                onAnalyze={analyze}
                serviceState={serviceState}
                videoCapability={videoCapability}
              />
            )}
          </section>
        </div>

        <div className="grid gap-4 py-7 text-white/60 md:grid-cols-3">
          <p className="flex items-center gap-3 text-xs leading-5">
            <LockKeyhole className="size-4 shrink-0 text-[#b9ff66]" />
            Images and eight derived PNG frames are sent for in-memory scoring;
            raw videos remain on-device.
          </p>
          <p className="flex items-center gap-3 text-xs leading-5">
            <ShieldCheck className="size-4 shrink-0 text-[#b9ff66]" />
            Use every result as one review signal—not a standalone moderation
            decision.
          </p>
          <a
            className="group flex items-center gap-3 text-xs leading-5 transition-colors hover:text-white md:justify-self-end"
            href="/journey#released-model"
          >
            Follow the released model
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </section>
    </main>
  );
}

function ProgressReport({
  mediaKind,
  status,
}: {
  mediaKind: MediaMode;
  status: 'decoding' | 'requesting';
}) {
  const steps =
    mediaKind === 'video'
      ? [
          ['Decode', 'Reading duration and dimensions locally'],
          ['Sample', 'Prepare eight midpoint PNG crops'],
          ['Inspect', 'Four-expert frame analysis'],
          ['Resolve', 'Verify aggregates and timeline'],
        ]
      : [
          ['Decode', 'Image validated and ready'],
          ['Inspect', 'Worker availability and four experts'],
          ['Resolve', 'Validate the returned probability'],
        ];
  const activeIndex = mediaKind === 'video' ? 0 : 1;

  return (
    <div className="flex flex-1 flex-col justify-center" aria-live="polite">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#667085]">
            Analysis in progress
          </p>
          <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
            {status === 'decoding'
              ? 'Decoding video metadata'
              : 'Reading the frame'}
          </p>
        </div>
        <LoaderCircle className="size-8 animate-spin text-[#0040c1] motion-reduce:animate-none" />
      </div>
      <ol className="space-y-3">
        {steps.map(([label, description], index) => {
          const complete = index < activeIndex;
          const active = index === activeIndex;
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
                className={`grid size-8 shrink-0 place-items-center rounded-full ${
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
                  <span className="font-mono text-[10px]">0{index + 1}</span>
                )}
              </span>
              <span>
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-xs text-[#667085]">
                  {description}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ImageReport({
  language,
  onReset,
  result,
  resultRef,
}: {
  language: ReturnType<typeof imageResultLanguage>;
  onReset: () => void;
  result: ImageAnalysisResult;
  resultRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
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
              AI-image score
            </p>
            <p className="mt-1 font-display text-[clamp(5rem,10vw,8rem)] font-semibold leading-none tracking-[-0.08em]">
              {Math.round(result.score * 100)}
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
            style={{ width: `${result.score * 100}%` }}
          />
          <span className="absolute left-1/2 top-1/2 h-5 w-px -translate-y-1/2 bg-white/60" />
        </div>
      </div>
      <div className="mt-5 rounded-[20px] border border-[#c8d8fb] bg-[#f6f9ff] p-5">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#0040c1]">
          {language.eyebrow}
        </p>
        <p className="mt-2 text-sm leading-6 text-[#405071]">
          {language.detail}
        </p>
        <p className="mt-3 border-t border-[#c8d8fb] pt-3 font-mono text-[9px] leading-5 uppercase tracking-[0.1em] text-[#667085]">
          The 0.5 marker is a service default, not a validated low-FPR cutoff
          for moderation or monetization decisions.
        </p>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-[18px] border border-[#d7e2f8] bg-[#d7e2f8] text-xs">
        <div className="bg-white p-4">
          <dt className="text-[#667085]">Architecture</dt>
          <dd className="mt-1 font-medium">SynthFlag 4-expert</dd>
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
        onClick={onReset}
      >
        Analyze another image
        <RotateCcw className="size-4" />
      </Button>
    </div>
  );
}

function EmptyReport({
  buttonDisabled,
  media,
  mode,
  onAnalyze,
  serviceState,
  videoCapability,
}: {
  buttonDisabled: boolean;
  media: MediaDetails | null;
  mode: MediaMode;
  onAnalyze: () => void;
  serviceState: ServiceState;
  videoCapability: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="grid flex-1 place-items-center rounded-[24px] border border-[#d7e2f8] bg-[#f6f9ff] px-6 py-10 text-center">
        <div>
          <span className="mx-auto grid size-20 place-items-center rounded-full border border-[#c8d8fb] bg-white text-[#0040c1] shadow-[0_12px_30px_rgba(0,64,193,.08)]">
            {mode === 'image' ? (
              <FileImage className="size-7" strokeWidth={1.8} />
            ) : (
              <FileVideo className="size-7" strokeWidth={1.8} />
            )}
          </span>
          <p className="mt-6 font-display text-3xl font-semibold tracking-[-0.05em]">
            Your {mode} report lands here
          </p>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#667085]">
            {mode === 'image'
              ? 'Select an image to see the raw score, contextual reading, and model context.'
              : 'Select a short video to see eight reproducible midpoint samples, a score timeline, and descriptive aggregates.'}
          </p>
          {serviceState === 'offline' && (
            <p className="mx-auto mt-4 max-w-sm rounded-xl border border-[#e6c878] bg-[#fff8dc] px-3 py-2 text-xs leading-5 text-[#735c13]">
              The GPU model service is not connected on this deployment yet.
            </p>
          )}
          {mode === 'video' &&
            serviceState !== 'offline' &&
            !videoCapability && (
              <p className="mx-auto mt-4 max-w-sm rounded-xl border border-[#e6c878] bg-[#fff8dc] px-3 py-2 text-xs leading-5 text-[#735c13]">
                This model service supports images but has not yet been upgraded
                for sampled video frames.
              </p>
            )}
          <div
            className="mx-auto mt-8 grid max-w-sm grid-cols-4 gap-2"
            aria-hidden="true"
          >
            {(mode === 'image'
              ? ['C1', 'C2', 'S3', 'S4']
              : ['F1', 'F3', 'F6', 'F8']
            ).map((item) => (
              <span
                className="grid aspect-square place-items-center rounded-xl border border-[#d7e2f8] bg-white font-mono text-[9px] text-[#6d7b98]"
                key={item}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
      <Button
        className="mt-5 h-13 rounded-full bg-[#0040c1] px-5 text-white hover:bg-[#002f91] disabled:bg-[#b5c5e7]"
        disabled={buttonDisabled}
        onClick={onAnalyze}
      >
        {serviceState === 'offline'
          ? 'Model service not connected'
          : serviceState === 'checking'
            ? 'Checking model service'
            : mode === 'video' && !videoCapability
              ? 'Video service update required'
              : serviceState === 'warming'
                ? `Run ${mode} analysis (cold start)`
                : media?.kind === 'video'
                  ? 'Sample 8 frames and analyze'
                  : 'Run four-expert analysis'}
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
