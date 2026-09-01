import { NextResponse } from 'next/server';

import {
  declaredRequestBodyExceedsLimit,
  readMultipartFormDataWithLimit,
  RequestBodyTooLargeError,
} from '@/lib/server/multipart';

const MAX_FRAME_BYTES = 2 * 1024 * 1024;
const MAX_TOTAL_BYTES = 16 * 1024 * 1024;
const MAX_REQUEST_BYTES = 17 * 1024 * 1024;
const MAX_FRAMES = 8;
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const runtime = 'edge';

function validationError(form: FormData) {
  const frames = form.getAll('frames');
  if (frames.length < 1 || frames.length > MAX_FRAMES) {
    return {
      message: 'Send between 1 and 8 sampled frames.',
      status: 422,
    };
  }
  if (frames.some((frame) => !(frame instanceof File))) {
    return { message: 'Every sampled frame must be a file.', status: 400 };
  }

  const typedFrames = frames as File[];
  if (typedFrames.some((frame) => !ACCEPTED_TYPES.has(frame.type))) {
    return {
      message: 'Video frames must be JPEG, PNG, or WebP images.',
      status: 415,
    };
  }
  if (typedFrames.some((frame) => frame.size > MAX_FRAME_BYTES)) {
    return {
      message: 'Each sampled frame must be 2 MB or smaller.',
      status: 413,
    };
  }
  if (
    typedFrames.reduce((total, frame) => total + frame.size, 0) >
    MAX_TOTAL_BYTES
  ) {
    return {
      message: 'The sampled-frame payload must be 16 MB or smaller.',
      status: 413,
    };
  }

  const durationValue = form.get('duration_ms');
  const timestampsValue = form.get('timestamps_ms');
  if (
    typeof durationValue !== 'string' ||
    typeof timestampsValue !== 'string'
  ) {
    return {
      message: 'Video duration and frame timestamps are required.',
      status: 400,
    };
  }
  const durationMs = Number(durationValue);
  if (
    !Number.isInteger(durationMs) ||
    durationMs < 1_000 ||
    durationMs > 10_000
  ) {
    return {
      message: 'Video duration must be between 1 and 10 seconds.',
      status: 422,
    };
  }

  let timestamps: unknown;
  try {
    timestamps = JSON.parse(timestampsValue);
  } catch {
    return {
      message: 'Frame timestamps must be valid JSON.',
      status: 422,
    };
  }
  if (
    !Array.isArray(timestamps) ||
    timestamps.length !== typedFrames.length ||
    timestamps.some(
      (timestamp, index) =>
        !Number.isInteger(timestamp) ||
        timestamp < 0 ||
        timestamp > durationMs ||
        (index > 0 && timestamp <= timestamps[index - 1]),
    )
  ) {
    return {
      message: 'Frame timestamps must be ordered and match the sampled frames.',
      status: 422,
    };
  }

  return null;
}

export async function POST(request: Request) {
  if (declaredRequestBodyExceedsLimit(request, MAX_REQUEST_BYTES)) {
    return NextResponse.json(
      { error: 'The sampled-frame payload must be 16 MB or smaller.' },
      { status: 413 },
    );
  }

  const endpoint = process.env.SYNTHFLAG_INFERENCE_URL?.replace(/\/$/, '');
  if (!endpoint) {
    return NextResponse.json(
      {
        error:
          'The live model service is not connected on this deployment yet. The interface is ready; connect SYNTHFLAG_INFERENCE_URL to activate scoring.',
      },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await readMultipartFormDataWithLimit(request, MAX_REQUEST_BYTES);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json(
        { error: 'The sampled-frame payload must be 16 MB or smaller.' },
        { status: 413 },
      );
    }
    return NextResponse.json(
      { error: 'Send sampled video frames as multipart form data.' },
      { status: 400 },
    );
  }

  const invalid = validationError(form);
  if (invalid) {
    return NextResponse.json(
      { error: invalid.message },
      { status: invalid.status },
    );
  }

  const upstream = new FormData();
  for (const [index, frame] of form.getAll('frames').entries()) {
    upstream.append(
      'frames',
      frame as File,
      `sampled-frame-${String(index + 1).padStart(2, '0')}.png`,
    );
  }
  upstream.append('duration_ms', form.get('duration_ms') as string);
  upstream.append('timestamps_ms', form.get('timestamps_ms') as string);

  try {
    const response = await fetch(`${endpoint}/v1/analyze-frames`, {
      body: upstream,
      method: 'POST',
      signal: AbortSignal.timeout(300_000),
    });
    const payload = await response.json();
    const retryAfter = response.headers.get('retry-after');
    return NextResponse.json(payload, {
      headers: retryAfter ? { 'Retry-After': retryAfter } : undefined,
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      {
        error: 'The model service is unavailable. Wait a moment and try again.',
      },
      { status: 502 },
    );
  }
}
