import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ReviewError } from './model';

export type Config = { origin: string; blobToken: string };
const MAX_REQUEST_BYTES = 32 * 1024; // Allows a 4,000-character note even when every character uses four UTF-8 bytes.

function configuredOrigin(raw: string | undefined) {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.origin !== raw || (url.protocol !== 'https:' &&
        !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))) return null;
    return url.origin;
  } catch { return null; }
}

export function configuration(): Config | null {
  const origin = configuredOrigin(process.env.BRIEF_REVIEW_ORIGIN);
  const blobToken = process.env.BRIEF_REVIEW_BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
  if (!origin || !blobToken || blobToken.length < 32) return null;
  return { origin, blobToken };
}

export function requireConfiguration(): Config {
  const config = configuration();
  if (!config) throw new ReviewError('review_unavailable', 503);
  return config;
}

export function requireSameOrigin(request: NextRequest, config: Config) {
  if (request.headers.get('origin') !== config.origin ||
      request.headers.get('sec-fetch-site') === 'cross-site') {
    throw new ReviewError('invalid_origin', 403);
  }
}

export function noStoreJson(value: unknown, status = 200): NextResponse {
  return NextResponse.json(value, { status, headers: {
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  } });
}

export async function readJsonBody(request: NextRequest): Promise<unknown> {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new ReviewError('json_required', 415);
  const reader = request.body?.getReader();
  if (!reader) throw new ReviewError('invalid_request', 400);
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_REQUEST_BYTES) {
      await reader.cancel();
      throw new ReviewError('request_too_large', 413);
    }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new ReviewError('invalid_request', 400); }
}

export async function handle(action: () => Promise<NextResponse>): Promise<NextResponse> {
  try { return await action(); }
  catch (error) {
    if (error instanceof ReviewError) return noStoreJson({ error: error.code }, error.status);
    // Never log comments, notes, Blob URLs or tokens.
    console.error('Halo brief review operation failed');
    return noStoreJson({ error: 'temporarily_unavailable' }, 503);
  }
}
