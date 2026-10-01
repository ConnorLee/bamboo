import Stripe from 'stripe';
import { ReservationError } from './domain';

export function configuration() {
  const secretKey = process.env.STRIPE_SECRET_KEY || '';
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  const databaseUrl = process.env.DATABASE_URL || '';
  const sessionSecret = process.env.RESERVATION_SESSION_SECRET || '';
  const siteUrl = process.env.HALO_SITE_URL || '';
  const live = secretKey.startsWith('sk_live_') || secretKey.startsWith('rk_live_');
  let origin = '';
  try {
    const url = new URL(siteUrl);
    if (url.protocol === 'https:' || (!live && ['localhost', '127.0.0.1'].includes(url.hostname))) origin = url.origin;
  } catch { /* Invalid configuration fails closed. */ }
  const configured = !!origin &&
    /^(sk|rk)_(live|test)_/.test(secretKey) && publishableKey.startsWith(live ? 'pk_live_' : 'pk_test_') &&
    webhookSecret.startsWith('whsec_') && /^postgres(ql)?:\/\//.test(databaseUrl) && sessionSecret.length >= 32;
  const enabled = configured && process.env.HALO_RESERVATIONS_ENABLED === 'true';
  return { enabled, configured, secretKey, publishableKey, webhookSecret, databaseUrl, sessionSecret, origin, live };
}

export function requireConfiguration() {
  const config = configuration();
  if (!config.configured) throw new ReservationError('reservations_unavailable', 503);
  return config;
}

let stripe: Stripe | undefined;
export function stripeClient() {
  const config = requireConfiguration();
  return stripe ||= new Stripe(config.secretKey, { maxNetworkRetries: 1, timeout: 10000 });
}
