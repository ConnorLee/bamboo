import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ReviewError, type ReviewerId } from './model';

export const COOKIE = 'halo_brief_review_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const IDS: ReviewerId[] = ['connor', 'partner'];

export type Reviewer = { id: ReviewerId; label: string };
export type Config = {
  origin: string;
  secret: Buffer;
  hashes: Record<ReviewerId, string>;
  blobToken: string;
};

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
  const secret = process.env.BRIEF_REVIEW_SESSION_SECRET;
  const connor = process.env.BRIEF_REVIEW_ACCESS_CONNOR_SHA256?.toLowerCase();
  const partner = process.env.BRIEF_REVIEW_ACCESS_PARTNER_SHA256?.toLowerCase();
  // A dedicated connected Blob store supplies Vercel's standard token name.
  const blobToken = process.env.BRIEF_REVIEW_BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
  if (!origin || !secret || !/^[a-f0-9]{64,}$/.test(secret) || secret.length % 2 !== 0 ||
      !connor || !partner || !/^[a-f0-9]{64}$/.test(connor) || !/^[a-f0-9]{64}$/.test(partner) ||
      connor === partner || !blobToken || blobToken.length < 32) return null;
  return { origin, secret: Buffer.from(secret, 'hex'), hashes: { connor, partner }, blobToken };
}

export function requireConfiguration(): Config {
  const config = configuration();
  if (!config) throw new ReviewError('review_unavailable', 503);
  return config;
}

export function reviewer(id: ReviewerId): Reviewer {
  return { id, label: id === 'connor' ? 'Connor' : 'Partner' };
}

export function verifyAccessCode(code: unknown, config: Config): ReviewerId | null {
  if (typeof code !== 'string') return null;
  const normalized = code.trim();
  if (normalized.length < 32 || normalized.length > 256) return null;
  const digest = createHash('sha256').update(normalized, 'utf8').digest();
  let matched: ReviewerId | null = null;
  for (const id of IDS) {
    if (timingSafeEqual(digest, Buffer.from(config.hashes[id], 'hex'))) matched = id;
  }
  return matched;
}

function signature(payload: string, id: ReviewerId, config: Config): string {
  return createHmac('sha256', config.secret).update(`${payload}.${config.hashes[id]}`).digest('base64url');
}

export function issueSession(id: ReviewerId, config: Config, now = Date.now()): string {
  const payload = `${id}.${Math.floor(now / 1000) + MAX_AGE_SECONDS}.${randomBytes(16).toString('base64url')}`;
  return `${payload}.${signature(payload, id, config)}`;
}

export function verifySession(value: string | undefined, config: Config, now = Date.now()): ReviewerId | null {
  if (!value || value.length > 256) return null;
  const [id, expiry, nonce, signed, extra] = value.split('.');
  if (extra !== undefined || !IDS.includes(id as ReviewerId) || !/^\d{10}$/.test(expiry) ||
      !/^[\w-]{22}$/.test(nonce) || !/^[\w-]{43}$/.test(signed)) return null;
  const expiresAt = Number(expiry);
  if (expiresAt <= Math.floor(now / 1000) || expiresAt > Math.floor(now / 1000) + MAX_AGE_SECONDS) return null;
  const expected = signature(`${id}.${expiry}.${nonce}`, id as ReviewerId, config);
  if (!timingSafeEqual(Buffer.from(signed), Buffer.from(expected))) return null;
  return id as ReviewerId;
}

export function sessionFromRequest(request: NextRequest, config: Config): ReviewerId {
  const id = verifySession(request.cookies.get(COOKIE)?.value, config);
  if (!id) throw new ReviewError('unauthorized', 401);
  return id;
}

export function setSessionCookie(response: NextResponse, id: ReviewerId, config: Config) {
  response.cookies.set(COOKIE, issueSession(id, config), {
    httpOnly: true, secure: config.origin.startsWith('https://'), sameSite: 'strict',
    path: '/api/brief-review', maxAge: MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse, config: Config) {
  response.cookies.set(COOKIE, '', {
    httpOnly: true, secure: config.origin.startsWith('https://'), sameSite: 'strict',
    path: '/api/brief-review', maxAge: 0,
  });
}

export function requireSameOrigin(request: NextRequest, config: Config) {
  if (request.headers.get('origin') !== config.origin || request.headers.get('sec-fetch-site') === 'cross-site') {
    throw new ReviewError('invalid_origin', 403);
  }
}

export function privateJson(value: unknown, status = 200): NextResponse {
  return NextResponse.json(value, { status, headers: {
    'Cache-Control': 'private, no-store', 'Vary': 'Cookie',
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
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
    if (bytes > 8192) {
      await reader.cancel();
      throw new ReviewError('request_too_large', 413);
    }
    chunks.push(value);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  try { return JSON.parse(raw); } catch { throw new ReviewError('invalid_request', 400); }
}

export async function handle(action: () => Promise<NextResponse>): Promise<NextResponse> {
  try { return await action(); }
  catch (error) {
    if (error instanceof ReviewError) return privateJson({ error: error.code }, error.status);
    // Never log access codes, comments, notes, cookies, private Blob URLs or tokens.
    console.error('Halo brief review operation failed');
    return privateJson({ error: 'temporarily_unavailable' }, 503);
  }
}
