import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canAnalyzeSampledVideo,
  INITIAL_VIDEO_PIPELINE_STATE,
  midpointTimestamps,
  parseVideoAnalysisResult,
  validateVideoFile,
  videoPipelineReducer,
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
    model: 'SynthFlag four-expert ensemble',
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

function requestContract(payload) {
  return {
    durationMs: payload.duration_ms,
    timestampsMs: payload.frame_scores.map((frame) => frame.timestamp_ms),
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
  const expected = requestContract(payload);
  assert.equal(parseVideoAnalysisResult(payload, expected), payload);

  const inconsistent = structuredClone(payload);
  inconsistent.summary.mean_score = 0.1;
  assert.throws(
    () => parseVideoAnalysisResult(inconsistent, expected),
    /inconsistent video aggregates/,
  );

  const incomplete = result();
  incomplete.sample_count = 7;
  incomplete.frame_scores = incomplete.frame_scores.slice(0, 7);
  assert.throws(
    () => parseVideoAnalysisResult(incomplete, expected),
    /invalid video report/,
  );
});

test('rejects response metadata that does not match the submitted samples', () => {
  const payload = result();
  const shiftedTimestamp = requestContract(payload);
  shiftedTimestamp.timestampsMs[3] += 1;
  assert.throws(
    () => parseVideoAnalysisResult(payload, shiftedTimestamp),
    /did not match the submitted video samples/,
  );

  const shiftedDuration = requestContract(payload);
  shiftedDuration.durationMs -= 1;
  assert.throws(
    () => parseVideoAnalysisResult(payload, shiftedDuration),
    /did not match the submitted video samples/,
  );
});

test('uses an isolated-frame explanation instead of overstating a peak', () => {
  const serviceResult = result({
    scores: [0.1, 0.1, 0.1, 0.9, 0.1, 0.1, 0.1, 0.1],
  });
  const payload = parseVideoAnalysisResult(
    serviceResult,
    requestContract(serviceResult),
  );
  assert.equal(
    videoResultLanguage(payload).eyebrow,
    'Isolated elevated sample',
  );
});

test('tracks truthful local decoding and incremental frame sampling', () => {
  let state = videoPipelineReducer(INITIAL_VIDEO_PIPELINE_STATE, {
    type: 'decode_started',
  });
  assert.equal(state.status, 'decoding');
  assert.equal(canAnalyzeSampledVideo(state), false);

  state = videoPipelineReducer(state, { type: 'metadata_ready' });
  assert.equal(state.status, 'sampling');

  for (let index = 0; index < 8; index += 1) {
    state = videoPipelineReducer(state, { index, type: 'frame_sampled' });
    assert.equal(state.sampledCount, index + 1);
    assert.equal(state.selectedFrame, index);
    assert.equal(canAnalyzeSampledVideo(state), false);
  }

  state = videoPipelineReducer(state, { type: 'sampling_completed' });
  assert.equal(state.status, 'ready');
  assert.equal(state.sampledCount, 8);
  assert.equal(canAnalyzeSampledVideo(state), true);
});

test('resets partial sampling for retry but preserves complete frames after scoring errors', () => {
  let partial = videoPipelineReducer(INITIAL_VIDEO_PIPELINE_STATE, {
    type: 'metadata_ready',
  });
  partial = videoPipelineReducer(partial, {
    index: 0,
    type: 'frame_sampled',
  });
  partial = videoPipelineReducer(partial, {
    index: 1,
    type: 'frame_sampled',
  });
  partial = videoPipelineReducer(partial, { type: 'sampling_failed' });
  assert.deepEqual(partial, {
    sampledCount: 0,
    selectedFrame: 0,
    status: 'sampling_error',
  });

  let ready = {
    sampledCount: 8,
    selectedFrame: 7,
    status: 'ready',
  };
  ready = videoPipelineReducer(ready, { type: 'analysis_started' });
  ready = videoPipelineReducer(ready, { type: 'analysis_received' });
  ready = videoPipelineReducer(ready, { type: 'analysis_failed' });
  assert.deepEqual(ready, {
    sampledCount: 8,
    selectedFrame: 7,
    status: 'ready',
  });
  assert.equal(canAnalyzeSampledVideo(ready), true);

  ready = videoPipelineReducer(ready, { type: 'analysis_started' });
  ready = videoPipelineReducer(ready, { type: 'analysis_received' });
  ready = videoPipelineReducer(ready, {
    peakFrameIndex: 3,
    type: 'analysis_completed',
  });
  assert.equal(ready.status, 'complete');
  assert.equal(ready.selectedFrame, 3);
  assert.equal(ready.sampledCount, 8);

  assert.deepEqual(
    videoPipelineReducer(ready, { type: 'reset' }),
    INITIAL_VIDEO_PIPELINE_STATE,
  );
});
