export class RequestBodyTooLargeError extends Error {
  constructor() {
    super('The multipart request body is too large.');
    this.name = 'RequestBodyTooLargeError';
  }
}

export function declaredRequestBodyExceedsLimit(
  request: Request,
  maxBytes: number,
) {
  const contentLength = request.headers.get('content-length');
  if (contentLength === null) return false;

  const declaredBytes = Number(contentLength);
  return Number.isFinite(declaredBytes) && declaredBytes > maxBytes;
}

export async function readMultipartFormDataWithLimit(
  request: Request,
  maxBytes: number,
) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    throw new RangeError('maxBytes must be a positive safe integer.');
  }
  if (declaredRequestBodyExceedsLimit(request, maxBytes)) {
    throw new RequestBodyTooLargeError();
  }

  const reader = request.body?.getReader();
  if (!reader) return request.formData();

  const chunks: ArrayBuffer[] = [];
  let receivedBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      receivedBytes += value.byteLength;
      if (receivedBytes > maxBytes) {
        try {
          await reader.cancel();
        } catch {
          // Preserve the stable size-limit error even if the source rejects
          // cancellation after the limit is crossed.
        }
        throw new RequestBodyTooLargeError();
      }

      const copy = new Uint8Array(value.byteLength);
      copy.set(value);
      chunks.push(copy.buffer);
    }
  } finally {
    reader.releaseLock();
  }

  const contentType = request.headers.get('content-type');
  const headers = new Headers();
  if (contentType) headers.set('content-type', contentType);

  return new Response(new Blob(chunks), { headers }).formData();
}
