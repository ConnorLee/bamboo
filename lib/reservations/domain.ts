export const OFFER = Object.freeze({ amount: 2500, currency: 'usd', retail: 18900, product: 'halo-first-year' });
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';
export type RefundStatus = 'none' | 'pending' | 'refunded' | 'partial' | 'failed';

export class ReservationError extends Error {
  constructor(public code: string, public status = 400) { super(code); }
}

export function paymentStatus(status: string, previous: PaymentStatus, hasError = false): PaymentStatus {
  // Successful settlement is terminal; older failure/cancellation events cannot undo it.
  if (previous === 'paid' || status === 'succeeded') return 'paid';
  if (status === 'canceled') return 'cancelled';
  if (status === 'processing') return 'processing';
  if (status === 'requires_payment_method' && hasError) return 'failed';
  return 'pending';
}

export function refundStatus(refunds: { amount: number; status: string | null }[], requested: boolean, previous: RefundStatus = 'none'): RefundStatus {
  const completed = refunds.filter(r => r.status === 'succeeded').reduce((sum, r) => sum + r.amount, 0);
  if (completed >= OFFER.amount) return 'refunded';
  if (refunds.some(r => r.status === 'pending' || r.status === 'requires_action')) return 'pending';
  if (completed > 0) return 'partial';
  if (refunds.some(r => r.status === 'failed' || r.status === 'canceled')) return 'failed';
  // A definitively rejected creation has no refund object/event. Unrelated payment
  // webhooks must not turn that support-needed state into permanently pending.
  if (!refunds.length && previous === 'failed') return 'failed';
  return requested ? 'pending' : 'none';
}

export function validateIntent(intent: {
  amount: number; amount_received: number; currency: string; livemode: boolean;
  status: string; metadata: Record<string, string>;
}, reservation: { id: string; attempt_id: string }, live: boolean) {
  if (intent.amount !== OFFER.amount || intent.currency !== OFFER.currency || intent.livemode !== live ||
      intent.metadata.product !== OFFER.product || intent.metadata.reservation_id !== reservation.id ||
      intent.metadata.attempt_id !== reservation.attempt_id ||
      (intent.status === 'succeeded' && intent.amount_received !== OFFER.amount)) {
    throw new ReservationError('payment_mismatch', 409);
  }
}
