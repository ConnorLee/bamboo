import type { NextRequest } from 'next/server';
import { detailsSchema, findCurrent, publicReservation, saveDetails } from '@/lib/reservations/service';
import { handle, json, rateLimit, readBody, sameOrigin, sessionHash } from '@/lib/reservations/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  return handle(async () => json(publicReservation(await findCurrent(sessionHash(request)))));
}
export async function PATCH(request: NextRequest) {
  return handle(async () => {
    sameOrigin(request);
    const hash = await rateLimit(request, 'details', 20);
    return json(await saveDetails(hash, await readBody(request, detailsSchema)));
  });
}
