import type { NextRequest } from 'next/server';
import { createReservation, attemptSchema } from '@/lib/reservations/service';
import { handle, json, rateLimit, readBody, sameOrigin } from '@/lib/reservations/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export async function POST(request: NextRequest) {
  return handle(async () => {
    sameOrigin(request);
    const hash = await rateLimit(request, 'create', 10);
    return json(await createReservation(hash, await readBody(request, attemptSchema)));
  });
}
