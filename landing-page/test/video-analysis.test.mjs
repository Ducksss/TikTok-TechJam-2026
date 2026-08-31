import assert from 'node:assert/strict';
import test from 'node:test';

import {
  midpointTimestamps,
  parseVideoAnalysisResult,
  validateVideoFile,
  videoResultLanguage,
} from '../lib/video-analysis.ts';

function result(overrides = {}) {
  const scores = overrides.scores ?? [0.1, 0.2, 0.8, 0.4, 0.9, 0.3, 0.7, 0.6];
  const timestamps = midpointTimestamps(10_000);
  const threshold = 0.5;
  const peak = Math.max(...scores);
  const peakIndex = scores.indexOf(peak);
  return {
    aggregation: 'arithmetic_mean',
    analysis_type: 'sampled_video_frames',
    duration_ms: 10_000,
    frame_scores: scores.map((score, index) => ({
      index,
      score,
      timestamp_ms: timestamps[index],
    })),
    model: 'FeatDistill four-expert ensemble',
    processing_ms: 100,
    sample_count: scores.length,
    summary: {
      above_threshold_count: scores.filter((score) => score >= threshold)
        .length,
      mean_score:
        scores.reduce((total, score) => total + score, 0) / scores.length,
      peak_frame_index: peakIndex,
      peak_score: peak,
      peak_timestamp_ms: timestamps[peakIndex],
    },
    threshold,
    version: '1.0.0',
  };
}

test('calculates eight uniform midpoint timestamps', () => {
  assert.deepEqual(
    midpointTimestamps(10_000),
    [625, 1_875, 3_125, 4_375, 5_625, 6_875, 8_125, 9_375],
  );
  assert.throws(() => midpointTimestamps(999), /between 1 and 10 seconds/);
  assert.throws(() => midpointTimestamps(10_001), /between 1 and 10 seconds/);
});

test('validates supported video files and limits', () => {
  assert.equal(
    validateVideoFile({ name: 'judge.mp4', size: 1024, type: 'video/mp4' }),
    null,
  );
  assert.match(
    validateVideoFile({ name: 'judge.avi', size: 1024, type: 'video/avi' }),
    /H\.264 MP4/,
  );
  assert.match(
    validateVideoFile({
      name: 'judge.webm',
      size: 50 * 1024 * 1024 + 1,
      type: 'video/webm',
    }),
    /over 50 MB/,
  );
});

test('accepts a consistent service result and rejects altered aggregates', () => {
  const payload = result();
  assert.equal(parseVideoAnalysisResult(payload), payload);

  const inconsistent = structuredClone(payload);
  inconsistent.summary.mean_score = 0.1;
  assert.throws(
    () => parseVideoAnalysisResult(inconsistent),
    /inconsistent video aggregates/,
  );

  const incomplete = result();
  incomplete.sample_count = 7;
  incomplete.frame_scores = incomplete.frame_scores.slice(0, 7);
  assert.throws(
    () => parseVideoAnalysisResult(incomplete),
    /invalid video report/,
  );
});

test('uses an isolated-frame explanation instead of overstating a peak', () => {
  const payload = parseVideoAnalysisResult(
    result({ scores: [0.1, 0.1, 0.1, 0.9, 0.1, 0.1, 0.1, 0.1] }),
  );
  assert.equal(
    videoResultLanguage(payload).eyebrow,
    'Isolated elevated sample',
  );
});
