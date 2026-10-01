import { createHash, randomUUID } from 'node:crypto';
import type Stripe from 'stripe';
import { z } from 'zod';
import { database } from './db';
import { requireConfiguration, stripeClient } from './config';
import { OFFER, paymentStatus, refundStatus, ReservationError, validateIntent, type PaymentStatus, type RefundStatus } from './domain';

export type Reservation = {
  id: string; attempt_id: string; session_hash: string; stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null; amount: number; currency: string; payment_status: PaymentStatus;
  refund_status: RefundStatus; refund_request_id: string | null; stripe_refund_id: string | null;
  refunded_amount: number; email: string | null; receipt_url: string | null; wrist_size: string | null;
  shipping_country: string | null; marketing_consent: boolean; visitor_id: string | null; created_at: Date;
};

export const attemptSchema = z.object({ attemptId: z.string().uuid(), visitorId: z.string().uuid().optional() }).strict();
export const detailsSchema = z.object({
  email: z.string().trim().email().max(254).optional(),
  wristSize: z.string().trim().max(40).optional(),
  shippingCountry: z.string().regex(/^[A-Z]{2}$/).optional(),
  marketingConsent: z.boolean().optional(),
}).strict();
export const eventSchema = z.object({
  event: z.enum(['landing_view', 'wearable_section_view', 'reserve_click', 'checkout_started', 'reservation_abandoned']),
  source: z.enum(['home', 'how-it-works']), visitorId: z.string().uuid().optional(), attemptId: z.string().uuid().optional(),
}).strict();

export function publicReservation(row: Reservation) {
  return { id: row.id, paymentStatus: row.payment_status, refundStatus: row.refund_status,
    refundedAmount: row.refunded_amount,
    email: row.email, receiptUrl: row.receipt_url, amount: row.amount, currency: row.currency,
    wristSize: row.wrist_size, shippingCountry: row.shipping_country, marketingConsent: row.marketing_consent };
}

export async function findCurrent(sessionHash: string): Promise<Reservation> {
  const [row] = await database()<Reservation[]>`SELECT * FROM halo_reservations WHERE session_hash = ${sessionHash}`;
  if (!row) throw new ReservationError('reservation_not_found', 404);
  return row;
}

export async function createReservation(sessionHash: string, body: z.infer<typeof attemptSchema>, stripe = stripeClient()) {
  if (!requireConfiguration().enabled) throw new ReservationError('reservations_paused', 503);
  const sql = database();
  // Persist the stable identifier BEFORE Stripe is called, so even an ambiguous network
  // failure can retry the same Stripe idempotency key rather than create another charge.
  await sql`INSERT INTO halo_reservations (id, attempt_id, session_hash, visitor_id)
    VALUES (${randomUUID()}, ${body.attemptId}, ${sessionHash}, ${body.visitorId || null})
    ON CONFLICT DO NOTHING`;
  return sql.begin(async tx => {
    const [row] = await tx<Reservation[]>`SELECT * FROM halo_reservations WHERE session_hash = ${sessionHash} FOR UPDATE`;
    if (!row) throw new ReservationError('attempt_unavailable', 409);
    if (row.payment_status === 'paid') throw new ReservationError('reservation_already_paid', 409);
    if (row.payment_status === 'cancelled') throw new ReservationError('reservation_cancelled', 409);
    let intent: Stripe.PaymentIntent;
    if (row.stripe_payment_intent_id) {
      intent = await stripe.paymentIntents.retrieve(row.stripe_payment_intent_id);
    } else {
      // Stripe can discard idempotency keys after 24h. Fail closed for an old creation
      // gap; operations must reconcile Stripe by metadata before resetting the attempt.
      if (Date.now() - new Date(row.created_at).getTime() > 23 * 60 * 60 * 1000) {
        throw new ReservationError('reservation_needs_reconciliation', 409);
      }
      intent = await stripe.paymentIntents.create({
        amount: OFFER.amount, currency: OFFER.currency, payment_method_types: ['card'],
        description: 'Halo — First Year Collection: refundable $25 founding reservation toward $189',
        metadata: { product: OFFER.product, reservation_id: row.id, attempt_id: row.attempt_id },
      }, { idempotencyKey: `halo-reservation-${row.id}` });
      await tx`UPDATE halo_reservations SET stripe_payment_intent_id = ${intent.id}, updated_at = now() WHERE id = ${row.id}`;
    }
    validateIntent(intent, row, requireConfiguration().live);
    // Retrieval/redirects never set paid. UI must wait for the webhook ledger.
    if (!intent.client_secret) throw new ReservationError('payment_unavailable', 503);
    return { id: row.id, clientSecret: intent.client_secret };
  });
}

async function sendReceipt(stripe: Stripe, row: Reservation, email: string) {
  if (!row.stripe_charge_id) throw new ReservationError('receipt_pending', 409);
  const emailDigest = createHash('sha256').update(email).digest('hex');
  // Stripe explicitly sends a new receipt when Charge.receipt_email is updated.
  await stripe.charges.update(row.stripe_charge_id, { receipt_email: email },
    { idempotencyKey: `halo-receipt-${row.id}-${emailDigest}` });
}

export async function saveDetails(sessionHash: string, body: z.infer<typeof detailsSchema>, stripe = stripeClient()) {
  return database().begin(async tx => {
    const [row] = await tx<Reservation[]>`SELECT * FROM halo_reservations WHERE session_hash = ${sessionHash} FOR UPDATE`;
    if (!row) throw new ReservationError('reservation_not_found', 404);
    if (row.payment_status !== 'paid') throw new ReservationError('payment_not_confirmed', 409);
    const email = body.email ?? row.email;
    if (body.email && body.email !== row.email) await sendReceipt(stripe, row, body.email);
    const [updated] = await tx<Reservation[]>`UPDATE halo_reservations SET
      email = ${email}, wrist_size = ${body.wristSize ?? row.wrist_size},
      shipping_country = ${body.shippingCountry ?? row.shipping_country},
      marketing_consent = ${body.marketingConsent ?? row.marketing_consent},
      marketing_consent_at = CASE WHEN ${body.marketingConsent !== undefined} THEN now() ELSE marketing_consent_at END,
      updated_at = now() WHERE id = ${row.id} RETURNING *`;
    return publicReservation(updated);
  });
}

export async function requestRefund(sessionHash: string, stripe = stripeClient()) {
  const sql = database();
  // Commit the refund request key before contacting Stripe for safe retry after timeouts.
  await sql.begin(async tx => {
    const [row] = await tx<Reservation[]>`SELECT * FROM halo_reservations WHERE session_hash = ${sessionHash} FOR UPDATE`;
    if (!row) throw new ReservationError('reservation_not_found', 404);
    if (row.payment_status !== 'paid') throw new ReservationError('payment_not_confirmed', 409);
    if ((!row.refund_request_id && !['refunded', 'failed'].includes(row.refund_status)) ||
        (row.refund_status === 'partial' && row.stripe_refund_id)) {
      // A webhook-confirmed partial settlement can start a NEW remaining-balance
      // request. Concurrent retries then share that newly persisted request key.
      await tx`UPDATE halo_reservations SET refund_request_id = ${randomUUID()}, stripe_refund_id = NULL,
        refund_status = 'pending', updated_at = now()
        WHERE id = ${row.id}`;
    }
  });
  return sql.begin(async tx => {
    const [row] = await tx<Reservation[]>`SELECT * FROM halo_reservations WHERE session_hash = ${sessionHash} FOR UPDATE`;
    if (['refunded', 'failed'].includes(row.refund_status) || row.stripe_refund_id) return publicReservation(row);
    try {
      if (!row.stripe_payment_intent_id || !row.refund_request_id) throw new ReservationError('refund_unavailable', 409);
      const intent = await stripe.paymentIntents.retrieve(row.stripe_payment_intent_id, { expand: ['latest_charge'] });
      validateIntent(intent, row, requireConfiguration().live);
      const charge = typeof intent.latest_charge === 'object' ? intent.latest_charge : null;
      if (!charge || !charge.paid || charge.disputed) throw new ReservationError('refund_needs_support', 409);
      // Omitting amount asks Stripe for the current remaining balance. Dashboard partial
      // refunds and an API retry cannot accidentally refund more than the original $25.
      const refund = await stripe.refunds.create({ payment_intent: intent.id, reason: 'requested_by_customer',
        metadata: { reservation_id: row.id, request_id: row.refund_request_id } },
        { idempotencyKey: `halo-refund-${row.refund_request_id}` });
      const [updated] = await tx<Reservation[]>`UPDATE halo_reservations SET stripe_refund_id = ${refund.id}, updated_at = now()
        WHERE id = ${row.id} RETURNING *`;
      // A successful API response is a request acknowledgement, not final refund settlement.
      return publicReservation(updated);
    } catch (error) {
      if (!definitiveRefundRejection(error)) throw error;
      // Do not throw after this update: throwing would roll back the failure and leave
      // a pending state waiting for a webhook that cannot arrive. Keep the request key
      // for reconciliation and return a visible support-needed state instead.
      const [failed] = await tx<Reservation[]>`UPDATE halo_reservations SET refund_status = 'failed', updated_at = now()
        WHERE id = ${row.id} RETURNING *`;
      return publicReservation(failed);
    }
  });
}

function definitiveRefundRejection(error: unknown) {
  if (error instanceof ReservationError) return true;
  if (!error || typeof error !== 'object' || !('type' in error)) return false;
  return ['StripeInvalidRequestError', 'StripeCardError', 'StripeAuthenticationError', 'StripePermissionError',
    'StripeRateLimitError'].includes(String(error.type));
  // Connection, timeout, API 5xx and idempotency-in-use errors are ambiguous. Preserve
  // pending plus the SAME request ID so the operator/retry can reconcile safely.
}

const relevantEvents = new Set([
  'payment_intent.succeeded', 'payment_intent.processing', 'payment_intent.payment_failed', 'payment_intent.canceled',
  'charge.refunded', 'refund.created', 'refund.updated', 'refund.failed',
]);

function stripeObjectId(value: string | { id: string } | null): string | null {
  return typeof value === 'string' ? value : value?.id || null;
}

export async function processStripeEvent(event: Stripe.Event, stripe = stripeClient()) {
  if (!relevantEvents.has(event.type)) return { ignored: true };
  if (event.livemode !== requireConfiguration().live) throw new ReservationError('event_mode_mismatch', 400);
  let intentId: string | null;
  if (event.type.startsWith('payment_intent.')) {
    intentId = (event.data.object as Stripe.PaymentIntent).id;
  } else if (event.type.startsWith('refund.')) {
    intentId = stripeObjectId((event.data.object as Stripe.Refund).payment_intent);
  } else {
    intentId = stripeObjectId((event.data.object as Stripe.Charge).payment_intent);
  }
  if (!intentId) return { ignored: true };
  const paymentIntentId = intentId;
  const sql = database();
  return sql.begin(async tx => {
    const inserted = await tx`INSERT INTO halo_stripe_events (event_id, event_type) VALUES (${event.id}, ${event.type})
      ON CONFLICT DO NOTHING RETURNING event_id`;
    if (!inserted.length) return { duplicate: true };
    // Retrieve metadata to locate a creation-gap row; unrelated Stripe payments are ignored.
    const first = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (first.metadata.product !== OFFER.product) return { ignored: true };
    const reservationId = z.string().uuid().safeParse(first.metadata.reservation_id);
    if (!reservationId.success) throw new ReservationError('payment_metadata_invalid', 409);
    const [row] = await tx<Reservation[]>`SELECT * FROM halo_reservations WHERE id = ${reservationId.data} FOR UPDATE`;
    if (!row) throw new ReservationError('reservation_not_found', 409);
    if (row.stripe_payment_intent_id && row.stripe_payment_intent_id !== paymentIntentId) throw new ReservationError('payment_mismatch', 409);
    // Fetch AFTER acquiring the row lock. Arrival order and second-resolution event
    // timestamps cannot let an older snapshot overwrite a more recent Stripe state.
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ['latest_charge'] });
    validateIntent(intent, row, requireConfiguration().live);
    const charge = typeof intent.latest_charge === 'object' ? intent.latest_charge : null;
    if (charge && (charge.amount !== OFFER.amount || charge.currency !== OFFER.currency ||
      stripeObjectId(charge.payment_intent) !== intent.id)) throw new ReservationError('charge_mismatch', 409);
    const refunds: Stripe.Refund[] = [];
    if (charge) {
      for await (const refund of stripe.refunds.list({ charge: charge.id, limit: 100 })) refunds.push(refund);
    }
    const nextPayment = paymentStatus(intent.status, row.payment_status, !!intent.last_payment_error);
    const nextRefund = refundStatus(refunds, !!row.refund_request_id, row.refund_status);
    const email = row.email || intent.receipt_email || charge?.billing_details?.email || null;
    if (!row.email && email && charge && !charge.receipt_email && nextPayment === 'paid') {
      await sendReceipt(stripe, { ...row, stripe_charge_id: charge.id }, email);
    }
    const refundedAmount = refunds.filter(r => r.status === 'succeeded').reduce((sum, r) => sum + r.amount, 0);
    const requestedRefund = row.refund_request_id ? refunds.find(r => r.metadata?.request_id === row.refund_request_id) : null;
    await tx`UPDATE halo_reservations SET stripe_payment_intent_id = ${intent.id}, stripe_charge_id = ${charge?.id || null},
      stripe_customer_id = ${stripeObjectId(intent.customer)},
      stripe_refund_id = COALESCE(${requestedRefund?.id || null}, stripe_refund_id),
      payment_status = ${nextPayment}, refund_status = ${nextRefund}, refunded_amount = ${refundedAmount},
      email = ${email}, receipt_url = ${charge?.receipt_url || row.receipt_url},
      paid_at = CASE WHEN ${nextPayment === 'paid'} THEN COALESCE(paid_at, now()) ELSE paid_at END,
      updated_at = now() WHERE id = ${row.id}`;
    await tx`UPDATE halo_stripe_events SET reservation_id = ${row.id} WHERE event_id = ${event.id}`;
    if (row.payment_status !== 'paid' && nextPayment === 'paid') {
      await tx`INSERT INTO halo_reservation_events (event, source, visitor_id, attempt_id, reservation_id)
        VALUES ('reservation_completed', 'stripe', ${row.visitor_id}, ${row.attempt_id}, ${row.id})`;
    }
    if (row.refund_status !== 'refunded' && nextRefund === 'refunded') {
      await tx`INSERT INTO halo_reservation_events (event, source, visitor_id, attempt_id, reservation_id)
        VALUES ('reservation_refunded', 'stripe', ${row.visitor_id}, ${row.attempt_id}, ${row.id})`;
    }
    return { processed: true };
  });
}

export async function recordEvent(sessionHash: string, body: z.infer<typeof eventSchema>) {
  const sql = database();
  const [row] = await sql<Reservation[]>`SELECT * FROM halo_reservations WHERE session_hash = ${sessionHash}`;
  // Browser events are indicative analytics only. They cannot emit paid/refund facts.
  await sql`INSERT INTO halo_reservation_events (event, source, visitor_id, attempt_id, reservation_id)
    VALUES (${body.event}, ${body.source}, ${body.visitorId || row?.visitor_id || null},
      ${body.attemptId || row?.attempt_id || null}, ${row?.id || null})`;
  if (row && !row.visitor_id && body.visitorId) {
    await sql`UPDATE halo_reservations SET visitor_id = ${body.visitorId} WHERE id = ${row.id} AND visitor_id IS NULL`;
  }
}

// Call only after the subscription provider confirms success. Never accept this event
// through the browser analytics allowlist. No email is stored in the analytics table.
export async function recordUpdatesSignup(ids: { visitorId?: string; attemptId?: string }) {
  const parsed = z.object({ visitorId: z.string().uuid().optional(), attemptId: z.string().uuid().optional() }).parse(ids);
  await database()`INSERT INTO halo_reservation_events (event, source, visitor_id, attempt_id)
    VALUES ('updates_signup', 'subscribe', ${parsed.visitorId || null}, ${parsed.attemptId || null})`;
}
