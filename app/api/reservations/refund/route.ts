import type { NextRequest } from 'next/server';
import { requestRefund } from '@/lib/reservations/service';
import { handle, json, rateLimit, sameOrigin } from '@/lib/reservations/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export async function POST(request: NextRequest) {
  return handle(async () => {
    sameOrigin(request);
    return json(await requestRefund(await rateLimit(request, 'refund', 5)));
  });
}
