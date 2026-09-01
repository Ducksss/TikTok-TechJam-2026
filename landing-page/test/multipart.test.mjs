import assert from 'node:assert/strict';
import test from 'node:test';

import {
  declaredRequestBodyExceedsLimit,
  readMultipartFormDataWithLimit,
  RequestBodyTooLargeError,
} from '../lib/server/multipart.ts';

test('parses a multipart body that remains within the streamed limit', async () => {
  const source = new FormData();
  source.append(
    'image',
    new File(['synthflag'], 'sample.png', { type: 'image/png' }),
  );
  source.append('label', 'review');
  const request = new Request('https://synthflag.test/api/analyze', {
    body: source,
    method: 'POST',
  });

  const parsed = await readMultipartFormDataWithLimit(request, 4 * 1024);
  const image = parsed.get('image');
  assert.ok(image instanceof File);
  assert.equal(image.name, 'sample.png');
  assert.equal(await image.text(), 'synthflag');
  assert.equal(parsed.get('label'), 'review');
});

test('rejects an oversized declared content length before reading', async () => {
  const request = new Request('https://synthflag.test/api/analyze', {
    body: 'small',
    headers: {
      'content-length': '4097',
      'content-type': 'multipart/form-data; boundary=synthflag',
    },
    method: 'POST',
  });

  assert.equal(declaredRequestBodyExceedsLimit(request, 4096), true);
  await assert.rejects(
    readMultipartFormDataWithLimit(request, 4096),
    RequestBodyTooLargeError,
  );
});

test('rejects a streamed body that exceeds the limit without content length', async () => {
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array([1, 2, 3]));
      controller.enqueue(new Uint8Array([4, 5, 6]));
      controller.close();
    },
  });
  const request = new Request('https://synthflag.test/api/analyze', {
    body,
    duplex: 'half',
    headers: {
      'content-type': 'multipart/form-data; boundary=synthflag',
    },
    method: 'POST',
  });

  await assert.rejects(
    readMultipartFormDataWithLimit(request, 5),
    RequestBodyTooLargeError,
  );
});

test('requires a positive safe byte limit', async () => {
  const request = new Request('https://synthflag.test/api/analyze', {
    body: 'unused',
    method: 'POST',
  });
  await assert.rejects(
    readMultipartFormDataWithLimit(request, 0),
    /positive safe integer/,
  );
});
