import { NextResponse } from 'next/server';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const runtime = 'edge';

export async function GET() {
  const endpoint = process.env.SYNTHFLAG_INFERENCE_URL?.replace(/\/$/, '');
  if (!endpoint) {
    return NextResponse.json({ connected: false, ready: false });
  }
  try {
    const response = await fetch(`${endpoint}/health`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      return NextResponse.json({ connected: false, ready: false });
    }
    const health = (await response.json()) as { ready?: boolean };
    return NextResponse.json({ connected: true, ready: health.ready === true });
  } catch {
    return NextResponse.json({ connected: false, ready: false });
  }
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: 'Send one image as multipart form data.' },
      { status: 400 },
    );
  }

  const image = form.get('image');
  if (!(image instanceof File)) {
    return NextResponse.json(
      { error: 'Choose an image before starting the analysis.' },
      { status: 400 },
    );
  }
  if (!ACCEPTED_TYPES.has(image.type)) {
    return NextResponse.json(
      { error: 'Only JPEG, PNG, and WebP images are supported.' },
      { status: 415 },
    );
  }
  if (image.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: 'The image must be 10 MB or smaller.' },
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

  const upstream = new FormData();
  upstream.append('image', image, image.name);

  try {
    const response = await fetch(`${endpoint}/v1/analyze`, {
      body: upstream,
      method: 'POST',
      signal: AbortSignal.timeout(300_000),
    });
    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      {
        error: 'The model service is unavailable. Wait a moment and try again.',
      },
      { status: 502 },
    );
  }
}
