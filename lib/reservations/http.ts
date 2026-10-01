import { createHmac, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { configuration, requireConfiguration } from './config';
import { database } from './db';
import { ReservationError } from './domain';

export const COOKIE = 'halo_reservation_session';
export function sessionToken(request: NextRequest) {
  const token = request.cookies.get(COOKIE)?.value;
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}
export function sessionHash(request: NextRequest) {
  const token = sessionToken(request);
  if (!token) throw new ReservationError('session_missing', 401);
  return createHmac('sha256', requireConfiguration().sessionSecret).update(token).digest('hex');
}
export function json(value: unknown, status = 200) {
  return NextResponse.json(value, { status, headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie',
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' } });
}
export function establishSession(request: NextRequest, response: NextResponse) {
  if (!sessionToken(request)) response.cookies.set(COOKIE, randomBytes(32).toString('hex'), {
    httpOnly: true, secure: configuration().origin.startsWith('https://'), sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 180,
  });
  return response;
}
export function sameOrigin(request: NextRequest) {
  if (request.headers.get('origin') !== requireConfiguration().origin || request.headers.get('sec-fetch-site') === 'cross-site') {
    throw new ReservationError('invalid_origin', 403);
  }
}
export async function readBody<T>(request: NextRequest, schema: z.ZodType<T>): Promise<T> {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new ReservationError('json_required', 415);
  const raw = await request.text();
  if (Buffer.byteLength(raw) > 4096) throw new ReservationError('request_too_large', 413);
  try { return schema.parse(JSON.parse(raw)); } catch { throw new ReservationError('invalid_request', 400); }
}
export async function rateLimit(request: NextRequest, purpose: string, maximum: number) {
  const hash = sessionHash(request);
  const config = requireConfiguration();
  // Only the deployment provider's overwritten header is trusted. Local/custom-host
  // traffic uses the shared bucket; never trust arbitrary client X-Forwarded-For.
  const address = process.env.VERCEL === '1' ? request.headers.get('x-vercel-forwarded-for') || 'unknown' : 'local';
  const ipHash = createHmac('sha256', config.sessionSecret).update(address).digest('hex');
  const bucket = Math.floor(Date.now() / 900000);
  for (const [key, limit] of [[`${purpose}:session:${hash}`, maximum], [`${purpose}:ip:${ipHash}`, maximum * 5], [`${purpose}:global`, maximum * 50]] as const) {
    const [row] = await database()`INSERT INTO halo_rate_limits (key, bucket, count) VALUES (${key}, ${bucket}, 1)
      ON CONFLICT (key, bucket) DO UPDATE SET count = halo_rate_limits.count + 1 RETURNING count`;
    if (row.count > limit) throw new ReservationError('too_many_requests', 429);
  }
  return hash;
}
export async function handle(action: () => Promise<NextResponse>) {
  try { return await action(); } catch (error) {
    if (error instanceof ReservationError) return json({ error: error.code }, error.status);
    // Never log request bodies, SQL queries, credentials, client secrets or Stripe payloads.
    console.error('Halo reservation operation failed');
    return json({ error: 'temporarily_unavailable' }, 503);
  }
}
