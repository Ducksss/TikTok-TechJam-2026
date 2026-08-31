export const VIDEO_FRAME_COUNT = 8;
export const VIDEO_FRAME_SIZE = 384;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const MIN_VIDEO_DURATION_MS = 1_000;
export const MAX_VIDEO_DURATION_MS = 10_000;
export const ACCEPTED_VIDEO_TYPES = new Set(['video/mp4', 'video/webm']);

export type SampledFrame = {
  blob: Blob;
  index: number;
  objectUrl: string;
  timestampMs: number;
};

export type VideoAnalysisResult = {
  aggregation: 'arithmetic_mean';
  analysis_type: 'sampled_video_frames';
  checkpoint?: string;
  duration_ms: number;
  frame_scores: Array<{
    index: number;
    score: number;
    timestamp_ms: number;
  }>;
  model: string;
  processing_ms: number;
  sample_count: number;
  summary: {
    above_threshold_count: number;
    mean_score: number;
    peak_frame_index: number;
    peak_score: number;
    peak_timestamp_ms: number;
  };
  threshold: number;
  version: string;
};

type VideoFileLike = Pick<File, 'name' | 'size' | 'type'>;

function isFiniteProbability(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function midpointTimestamps(durationMs: number) {
  if (
    !Number.isFinite(durationMs) ||
    durationMs < MIN_VIDEO_DURATION_MS ||
    durationMs > MAX_VIDEO_DURATION_MS
  ) {
    throw new Error('Video duration must be between 1 and 10 seconds.');
  }
  return Array.from({ length: VIDEO_FRAME_COUNT }, (_, index) =>
    Math.round((durationMs * (index + 0.5)) / VIDEO_FRAME_COUNT),
  );
}

export function formatTimestamp(timestampMs: number) {
  return `${(timestampMs / 1000).toFixed(2)}s`;
}

export function validateVideoFile(file: VideoFileLike) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const supportedExtension = extension === 'mp4' || extension === 'webm';
  if (!ACCEPTED_VIDEO_TYPES.has(file.type) && !supportedExtension) {
    return 'Choose an H.264 MP4 or browser-supported WebM video.';
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return 'That video is over 50 MB. Choose a smaller file and try again.';
  }
  return null;
}

export function parseVideoAnalysisResult(
  payload: unknown,
): VideoAnalysisResult {
  if (
    !isRecord(payload) ||
    payload.analysis_type !== 'sampled_video_frames' ||
    payload.aggregation !== 'arithmetic_mean' ||
    payload.sample_count !== VIDEO_FRAME_COUNT ||
    !Array.isArray(payload.frame_scores) ||
    payload.frame_scores.length !== payload.sample_count ||
    !isFiniteProbability(payload.threshold) ||
    typeof payload.duration_ms !== 'number' ||
    !Number.isFinite(payload.duration_ms) ||
    payload.duration_ms < MIN_VIDEO_DURATION_MS ||
    payload.duration_ms > MAX_VIDEO_DURATION_MS ||
    typeof payload.processing_ms !== 'number' ||
    !Number.isFinite(payload.processing_ms) ||
    payload.processing_ms < 0 ||
    typeof payload.model !== 'string' ||
    typeof payload.version !== 'string' ||
    !isRecord(payload.summary)
  ) {
    throw new Error('The detector returned an invalid video report.');
  }

  const frames = payload.frame_scores;
  let previousTimestamp = -1;
  for (const [index, frame] of frames.entries()) {
    if (
      !isRecord(frame) ||
      frame.index !== index ||
      typeof frame.timestamp_ms !== 'number' ||
      !Number.isInteger(frame.timestamp_ms) ||
      frame.timestamp_ms <= previousTimestamp ||
      frame.timestamp_ms > payload.duration_ms ||
      !isFiniteProbability(frame.score)
    ) {
      throw new Error('The detector returned an invalid video report.');
    }
    previousTimestamp = frame.timestamp_ms;
  }

  const summary = payload.summary;
  if (
    !isFiniteProbability(summary.mean_score) ||
    !isFiniteProbability(summary.peak_score) ||
    typeof summary.peak_frame_index !== 'number' ||
    !Number.isInteger(summary.peak_frame_index) ||
    summary.peak_frame_index < 0 ||
    summary.peak_frame_index >= frames.length ||
    typeof summary.peak_timestamp_ms !== 'number' ||
    !Number.isInteger(summary.peak_timestamp_ms) ||
    typeof summary.above_threshold_count !== 'number' ||
    !Number.isInteger(summary.above_threshold_count) ||
    summary.above_threshold_count < 0 ||
    summary.above_threshold_count > frames.length
  ) {
    throw new Error('The detector returned an invalid video report.');
  }

  const scores = frames.map((frame) => frame.score as number);
  const expectedMean =
    scores.reduce((total, score) => total + score, 0) / scores.length;
  const expectedPeak = Math.max(...scores);
  const expectedPeakIndex = scores.indexOf(expectedPeak);
  const threshold = payload.threshold as number;
  const expectedCount = scores.filter((score) => score >= threshold).length;
  if (
    Math.abs(summary.mean_score - expectedMean) > 1e-6 ||
    Math.abs(summary.peak_score - expectedPeak) > 1e-6 ||
    summary.peak_frame_index !== expectedPeakIndex ||
    summary.peak_timestamp_ms !== frames[expectedPeakIndex]?.timestamp_ms ||
    summary.above_threshold_count !== expectedCount
  ) {
    throw new Error('The detector returned inconsistent video aggregates.');
  }

  return payload as VideoAnalysisResult;
}

export function videoResultLanguage(result: VideoAnalysisResult) {
  const {
    above_threshold_count: above,
    mean_score: mean,
    peak_score: peak,
  } = result.summary;
  if (mean >= 0.75) {
    return {
      detail:
        'The sampled frames consistently match patterns the image ensemble associates with AI generation.',
      eyebrow: 'Consistently elevated frame signal',
    };
  }
  if (peak >= 0.75 && above <= 2) {
    return {
      detail:
        'One or two sampled frames are elevated while the overall frame sequence is mixed. Review the timeline rather than treating the peak as a video verdict.',
      eyebrow: 'Isolated elevated sample',
    };
  }
  if (mean >= 0.5) {
    return {
      detail:
        'The sampled frames lean toward AI-generated image patterns, with variation across the video.',
      eyebrow: 'Elevated sampled-frame signal',
    };
  }
  if (mean >= 0.25) {
    return {
      detail:
        'The sampled frames show a mixed but generally lower match with learned AI-image patterns.',
      eyebrow: 'Mixed sampled-frame signal',
    };
  }
  return {
    detail:
      'The sampled frames show little resemblance to the AI-generated image patterns learned by the ensemble.',
    eyebrow: 'Minimal sampled-frame signal',
  };
}
