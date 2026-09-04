export type JsonRequestResult =
  | { ok: true; body: unknown }
  | { ok: false; status: 400 | 413 | 415; error: string };

const decoder = new TextDecoder();

export async function readJsonRequest(
  request: Request,
  maxBytes: number,
): Promise<JsonRequestResult> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (!contentType.split(";")[0].trim().endsWith("application/json")) {
    return {
      ok: false,
      status: 415,
      error: "Expected application/json request body.",
    };
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > maxBytes) {
    return payloadTooLarge();
  }

  let text: string;
  try {
    text = await readTextWithLimit(request, maxBytes);
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return payloadTooLarge();
    }
    throw error;
  }

  if (!text.trim()) {
    return { ok: false, status: 400, error: "Request body is required." };
  }

  try {
    return { ok: true, body: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, status: 400, error: "Malformed JSON request body." };
  }
}

async function readTextWithLimit(request: Request, maxBytes: number) {
  if (!request.body) {
    return "";
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    total += value.byteLength;
    if (total > maxBytes) {
      throw new PayloadTooLargeError();
    }

    chunks.push(value);
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return decoder.decode(body);
}

function payloadTooLarge(): JsonRequestResult {
  return {
    ok: false,
    status: 413,
    error: "Request body is too large.",
  };
}

class PayloadTooLargeError extends Error {}
