import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AnalysisHttpError,
  InferenceTransportError,
  probeInferenceTransport,
  requestAnalysis,
} from '../lib/inference-transport.ts';

const directUrl = 'https://synthflag-example.ngrok.app';

function jsonResponse(payload, init = {}) {
  return new Response(JSON.stringify(payload), {
    headers: { 'content-type': 'application/json', ...init.headers },
    status: init.status ?? 200,
  });
}

function readyHealth(overrides = {}) {
  return {
    capabilities: { sampled_video_frames: { endpoint: '/v1/analyze-frames' } },
    ready: true,
    ...overrides,
  };
}

test('selects a healthy direct endpoint and sends the ngrok bypass header', async () => {
  const calls = [];
  const result = await probeInferenceTransport({
    directEndpoint: `${directUrl}/`,
    fetcher: async (url, init) => {
      calls.push({ init, url });
      return jsonResponse(readyHealth());
    },
  });

  assert.deepEqual(result, {
    serviceState: 'ready',
    transport: 'direct',
    videoCapability: true,
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `${directUrl}/health`);
  assert.equal(calls[0].init.headers['ngrok-skip-browser-warning'], '1');
});

test('falls back to same-origin health when direct networking or parsing fails', async () => {
  for (const directFailure of ['network', 'malformed']) {
    const calls = [];
    const result = await probeInferenceTransport({
      directEndpoint: directUrl,
      fetcher: async (url, init) => {
        calls.push({ init, url });
        if (calls.length === 1) {
          if (directFailure === 'network') throw new TypeError('CORS failed');
          return new Response('<html>ngrok warning</html>');
        }
        return jsonResponse(readyHealth({ connected: true }));
      },
    });

    assert.equal(result.transport, 'proxy');
    assert.equal(result.serviceState, 'ready');
    assert.equal(calls.length, 2);
    assert.equal(calls[1].url, '/api/analyze');
    assert.equal(calls[1].init.headers, undefined);
  }
});

test('uses a fresh timeout for proxy health after direct health times out', async () => {
  const calls = [];
  const result = await probeInferenceTransport({
    directEndpoint: directUrl,
    fetcher: async (url, init) => {
      calls.push(url);
      if (calls.length === 1) {
        return await new Promise((_resolve, reject) => {
          init.signal.addEventListener(
            'abort',
            () => reject(new DOMException('timed out', 'AbortError')),
            { once: true },
          );
        });
      }
      assert.equal(init.signal.aborted, false);
      return jsonResponse(readyHealth({ connected: true }));
    },
    timeoutMs: 1,
  });

  assert.equal(result.transport, 'proxy');
  assert.equal(calls.length, 2);
});

test('reports warming and both paths offline truthfully', async () => {
  const warming = await probeInferenceTransport({
    directEndpoint: directUrl,
    fetcher: async () => jsonResponse(readyHealth({ ready: false })),
  });
  assert.equal(warming.transport, 'direct');
  assert.equal(warming.serviceState, 'warming');

  const offline = await probeInferenceTransport({
    directEndpoint: directUrl,
    fetcher: async (_url, _init) => {
      throw new TypeError('offline');
    },
  });
  assert.deepEqual(offline, {
    serviceState: 'offline',
    transport: 'offline',
    videoCapability: false,
  });
});

test('preserves 429 status and Retry-After without replaying the POST', async () => {
  const calls = [];
  await assert.rejects(
    requestAnalysis({
      body: new FormData(),
      directEndpoint: directUrl,
      fetcher: async (url, init) => {
        calls.push({ init, url });
        return jsonResponse(
          { detail: 'Rate limit reached.' },
          { headers: { 'retry-after': '321' }, status: 429 },
        );
      },
      kind: 'image',
      transport: 'direct',
    }),
    (error) => {
      assert.ok(error instanceof AnalysisHttpError);
      assert.equal(error.status, 429);
      assert.equal(error.retryAfter, '321');
      assert.equal(error.message, 'Rate limit reached.');
      return true;
    },
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `${directUrl}/v1/analyze`);
  assert.equal(calls[0].init.headers['ngrok-skip-browser-warning'], '1');
});

test('treats malformed analysis responses as transport failures without replay', async () => {
  let requests = 0;
  await assert.rejects(
    requestAnalysis({
      body: new FormData(),
      directEndpoint: directUrl,
      fetcher: async () => {
        requests += 1;
        return new Response('not-json', { status: 200 });
      },
      kind: 'video',
      transport: 'direct',
    }),
    InferenceTransportError,
  );
  assert.equal(requests, 1);
});

test('uses the selected proxy exactly once and never leaks the direct header', async () => {
  const calls = [];
  const payload = await requestAnalysis({
    body: new FormData(),
    directEndpoint: directUrl,
    fetcher: async (url, init) => {
      calls.push({ init, url });
      return jsonResponse({ score: 0.4 });
    },
    kind: 'image',
    transport: 'proxy',
  });

  assert.deepEqual(payload, { score: 0.4 });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/analyze');
  assert.equal(calls[0].init.headers, undefined);
});
