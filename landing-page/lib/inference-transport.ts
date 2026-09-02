export type InferenceTransport = 'direct' | 'offline' | 'proxy';
export type ServiceState = 'checking' | 'offline' | 'ready' | 'warming';

export type ProbeResult = {
  serviceState: Exclude<ServiceState, 'checking'>;
  transport: InferenceTransport;
  videoCapability: boolean;
};

type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

type HealthPayload = {
  capabilities?: {
    sampled_video_frames?: { endpoint?: string };
  };
  connected?: boolean;
  ready?: boolean;
};

export const DIRECT_REQUEST_HEADERS = {
  'ngrok-skip-browser-warning': '1',
} as const;

export class AnalysisHttpError extends Error {
  readonly retryAfter: string | null;
  readonly status: number;

  constructor(message: string, response: Response) {
    super(message);
    this.name = 'AnalysisHttpError';
    this.retryAfter = response.headers.get('retry-after');
    this.status = response.status;
  }
}

export class InferenceTransportError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'InferenceTransportError';
  }
}

function normalizedDirectEndpoint(value?: string) {
  const endpoint = value?.trim().replace(/\/$/, '');
  return endpoint || null;
}

async function objectPayload(response: Response) {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch (cause) {
    throw new InferenceTransportError(
      'The model service returned an unreadable response.',
      { cause },
    );
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new InferenceTransportError(
      'The model service returned an unreadable response.',
    );
  }
  return payload as Record<string, unknown>;
}

function healthResult(
  payload: HealthPayload,
  transport: Exclude<InferenceTransport, 'offline'>,
): ProbeResult | null {
  const connected = transport === 'direct' || payload.connected === true;
  if (!connected || typeof payload.ready !== 'boolean') return null;
  return {
    serviceState: payload.ready ? 'ready' : 'warming',
    transport,
    videoCapability: Boolean(
      payload.capabilities?.sampled_video_frames?.endpoint,
    ),
  };
}

async function probeCandidate(
  endpoint: string,
  transport: Exclude<InferenceTransport, 'offline'>,
  fetcher: Fetcher,
  signal?: AbortSignal,
  timeoutMs = 6_000,
) {
  try {
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const requestSignal = signal
      ? AbortSignal.any([signal, timeoutSignal])
      : timeoutSignal;
    const response = await fetcher(endpoint, {
      headers: transport === 'direct' ? DIRECT_REQUEST_HEADERS : undefined,
      signal: requestSignal,
    });
    if (!response.ok) return null;
    return healthResult(
      (await objectPayload(response)) as HealthPayload,
      transport,
    );
  } catch {
    return null;
  }
}

export async function probeInferenceTransport({
  directEndpoint,
  fetcher = fetch,
  signal,
  timeoutMs = 6_000,
}: {
  directEndpoint?: string;
  fetcher?: Fetcher;
  signal?: AbortSignal;
  timeoutMs?: number;
}): Promise<ProbeResult> {
  const direct = normalizedDirectEndpoint(directEndpoint);
  if (direct) {
    const directResult = await probeCandidate(
      `${direct}/health`,
      'direct',
      fetcher,
      signal,
      timeoutMs,
    );
    if (directResult) return directResult;
  }

  const proxyResult = await probeCandidate(
    '/api/analyze',
    'proxy',
    fetcher,
    signal,
    timeoutMs,
  );
  return (
    proxyResult ?? {
      serviceState: 'offline',
      transport: 'offline',
      videoCapability: false,
    }
  );
}

function responseError(payload: Record<string, unknown>, fallback: string) {
  if (typeof payload.error === 'string') return payload.error;
  if (typeof payload.detail === 'string') return payload.detail;
  return fallback;
}

export async function requestAnalysis({
  body,
  directEndpoint,
  fetcher = fetch,
  kind,
  signal,
  transport,
}: {
  body: FormData;
  directEndpoint?: string;
  fetcher?: Fetcher;
  kind: 'image' | 'video';
  signal?: AbortSignal;
  transport: Exclude<InferenceTransport, 'offline'>;
}) {
  const direct = normalizedDirectEndpoint(directEndpoint);
  if (transport === 'direct' && !direct) {
    throw new InferenceTransportError(
      'The direct model-service address is not configured.',
    );
  }
  const endpoint =
    transport === 'direct'
      ? `${direct}${kind === 'image' ? '/v1/analyze' : '/v1/analyze-frames'}`
      : kind === 'image'
        ? '/api/analyze'
        : '/api/analyze-video';

  let response: Response;
  try {
    response = await fetcher(endpoint, {
      body,
      headers: transport === 'direct' ? DIRECT_REQUEST_HEADERS : undefined,
      method: 'POST',
      signal,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') {
      throw cause;
    }
    throw new InferenceTransportError(
      'The model service could not be reached. Check the connection, then retry.',
      { cause },
    );
  }

  const payload = await objectPayload(response);
  if (!response.ok) {
    const fallback =
      kind === 'image'
        ? 'The detector could not analyze this image.'
        : 'The detector could not analyze the sampled video frames.';
    throw new AnalysisHttpError(responseError(payload, fallback), response);
  }
  return payload;
}
