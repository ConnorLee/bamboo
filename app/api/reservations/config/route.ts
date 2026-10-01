import type { NextRequest } from 'next/server';
import { configuration } from '@/lib/reservations/config';
import { database } from '@/lib/reservations/db';
import { OFFER } from '@/lib/reservations/domain';
import { establishSession, json } from '@/lib/reservations/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const config = configuration();
  let manageable = config.configured;
  if (manageable) {
    try {
      const [schema] = await database()`SELECT to_regclass('halo_reservations') IS NOT NULL AND
        to_regclass('halo_stripe_events') IS NOT NULL AND to_regclass('halo_rate_limits') IS NOT NULL AND
        to_regclass('halo_reservation_events') IS NOT NULL AS ready`;
      manageable = schema.ready;
    } catch { manageable = false; }
  }
  const enabled = manageable && config.enabled;
  const response = json({ enabled, manageable, publishableKey: enabled ? config.publishableKey : null,
    amount: OFFER.amount, currency: OFFER.currency, retail: OFFER.retail });
  return manageable ? establishSession(request, response) : response;
}
