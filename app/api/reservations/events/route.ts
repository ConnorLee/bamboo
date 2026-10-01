import type { NextRequest } from 'next/server';
import { eventSchema, recordEvent } from '@/lib/reservations/service';
import { handle, json, rateLimit, readBody, sameOrigin } from '@/lib/reservations/http';

export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  return handle(async () => {
    sameOrigin(request);
    const hash = await rateLimit(request, 'events', 100);
    await recordEvent(hash, await readBody(request, eventSchema));
    return json({ ok: true });
  });
}
