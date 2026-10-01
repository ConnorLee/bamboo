import type { NextRequest } from 'next/server';
import { requireConfiguration, stripeClient } from '@/lib/reservations/config';
import { handle, json } from '@/lib/reservations/http';
import { processStripeEvent } from '@/lib/reservations/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export async function POST(request: NextRequest) {
  return handle(async () => {
    const config = requireConfiguration();
    const signature = request.headers.get('stripe-signature');
    if (!signature) return json({ error: 'invalid_signature' }, 400);
    // Verify the exact bytes before parsing. A browser redirect is never a payment event.
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 1024 * 1024) return json({ error: 'request_too_large' }, 413);
    let event;
    try { event = stripeClient().webhooks.constructEvent(raw, signature, config.webhookSecret); }
    catch { return json({ error: 'invalid_signature' }, 400); }
    return json(await processStripeEvent(event));
  });
}
