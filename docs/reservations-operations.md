# Halo reservation operations

Current public entry point: **Coming soon → waitlist**. The landing page does not load the retained reservation client or expose checkout. The service and its tests are retained to keep Git consistent with the deployed backend; committing them does not activate payments.

The dormant service models one offer: **Halo — First Year Collection, $189**, with a refundable **$25 USD** reservation credited toward that price. It does not charge the remaining balance, authorize a recurring payment, save a card for later collection, or promise a production date. The following checkout notes describe the retained integration and its future activation requirements.

## Existing stack and choice

The canonical site is `website/`, generated into `public/halo-site/` by `scripts/build-halo-site.mjs`, served through Next.js 15 rewrites. The stack previously had a Mailchimp subscribe route, with no Stripe integration or durable reservation database. Existing alternate demos are not checkout implementations.

The chosen architecture adds Stripe Express Checkout Element plus Payment Element to the existing page, a server-created PaymentIntent, and PostgreSQL. Stripe Checkout remains a good simpler option for a hosted checkout, but introduces a separate checkout screen. Here an embedded Express Checkout Element makes Apple's own wallet button available directly on the page, with an embedded card fallback. Stripe generally recommends Checkout Sessions for broad commerce features; this intentionally narrow, fixed USD reservation uses the documented deferred PaymentIntent flow and needs none of tax, shipping, subscriptions, carts or catalog variants. Do not grow a parallel commerce engine into these handlers.

The website must load Stripe.js directly from Stripe. Card is the only PaymentIntent method type; it supports Apple Pay and Google Pay without adding alternate payment workflows. No login, shipping form, wrist sizing, or email form precedes payment. Wallet email is not required; a supplied payment-method email is reused, otherwise the optional postpayment field can supply it. The card fallback uses Stripe’s documented `address: if_required` policy and leaves optional billing fields on their default `auto` policy; it may request billing details required to authorize that card. No custom address or contact form is added. Do not set these fields to `never` unless real omitted billing values are supplied at confirmation. Native wallet buttons explicitly request no shipping address, billing address, email or phone.

## Deployment gate

Payments are **not activated** merely by deploying these files. The public site is `https://www.habithalo.app`. Missing configuration or `HALO_RESERVATIONS_ENABLED` other than `true` keeps new reservations disabled. Configure the intended deployment only after provider setup, sandbox validation and an explicit checkout-launch decision; connecting the dormant client to the UI is a separate change.

1. Provision a durable PostgreSQL database with TLS, backups, a pool suitable for serverless connections, and restricted application credentials. Apply `migrations/001_halo_reservations.sql` using `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/001_halo_reservations.sql`. Use a migration/owner role, then grant the runtime role only the required table/sequence access. This is a real database requirement, not an in-memory fallback.
2. Set all values from `.env.example` in the intended environment. Generate `RESERVATION_SESSION_SECRET` with `openssl rand -hex 32`. Set `HALO_SITE_URL` to the exact canonical HTTPS origin; configure www/apex redirects consistently. Use sandbox keys first. Keys and webhook secrets must belong to the same Stripe account/mode.
3. Register every checkout domain/subdomain in Stripe for sandbox and live mode. Apple Pay requires HTTPS and a compatible browser/device with an eligible wallet. Verify a physical iPhone and Safari; a desktop screenshot cannot prove Apple Pay works.
4. Configure `/api/stripe/webhook` with its own signing secret. Subscribe to `payment_intent.succeeded`, `payment_intent.processing`, `payment_intent.payment_failed`, `payment_intent.canceled`, `charge.refunded`, `refund.created`, `refund.updated`, and `refund.failed`. Match the webhook API version to the installed Stripe SDK (currently Stripe 22.6.2); test upgrades deliberately.
5. Enable Stripe customer payment/refund emails, configure the Halo merchant display name/support details/branding, and verify a reservation email and receipt in sandbox. When a late email is collected, the server updates the Charge's `receipt_email`; Stripe documents that this sends a new receipt. A receipt URL remains available in the reservation UI. Sandbox delivery behavior can differ; verify with a permitted test recipient, never claim an email arrived solely because the API accepted it.
6. Complete the test matrix below. Set `HALO_RESERVATIONS_ENABLED=true` only when configured and reviewed. GET `/api/reservations/config` reports `enabled:false` on missing credentials or schema/database failure; payment CTA must show honest unavailability, never a fake success.

To pause new reservations, set `HALO_RESERVATIONS_ENABLED=false`. Keep database/Stripe secrets available: existing status, receipts, optional details, refunds and webhook reconciliation must continue. The config endpoint reports `manageable:true` for those existing reservations while `enabled:false` stops new checkout.

## Trust and data model

- Amount/currency/product/metadata are server-owned: `2500`, `usd`, `halo-first-year`. The retail reference is `18900`. Public success uses the database, never a redirect query, client event, Stripe.js callback or PaymentIntent retrieval alone.
- GET config initializes one 32-byte opaque httpOnly, SameSite=Lax, Secure-on-HTTPS browser cookie. Only an HMAC digest is stored. The cookie lasts 180 days and grants access to that browser's single reservation. Attempts/visitor IDs are not access credentials and cannot recover someone else's reservation.
- Creation commits the reservation ID before contacting Stripe. A row lock and stable Stripe idempotency key prevent concurrent duplicate intents. An unresolved creation gap older than 23 hours is held for operator reconciliation, because Stripe may expire idempotency keys after 24 hours.
- The webhook verifies the raw body/signature. Its event ID insert, reservation update, and confirmed analytics all commit in one database transaction. Replays are no-ops. It locks the reservation and then retrieves the current Stripe object/refunds, rather than ordering snapshots by event timestamps. Amount, mode, currency and metadata mismatches roll back the ledger entry so a corrected delivery can retry.
- Mutating browser routes require the exact configured Origin. Durable session, hashed trusted-provider-network and global buckets limit abuse. Only Vercel's overwritten network header is trusted; other deployments share the fallback network bucket and should add a trusted edge limit before public traffic. Configure Stripe Radar and review declines before launch. No raw IP, card number, wallet data or request body is logged/stored here.
- Optional postpayment fields: email, wrist-size text, two-letter country, updates consent with timestamp. No shipping address is collected. `stripe_customer_id` remains nullable; no Stripe Customer/account is created for the reservation.

## Contract and statuses

| Endpoint | Request / result |
| --- | --- |
| GET `/api/reservations/config` | `{enabled,manageable,publishableKey,amount,currency,retail}`; establishes session when manageable |
| POST `/api/reservations` | `{attemptId,visitorId?}` → `{id,clientSecret}` |
| GET `/api/reservations/current` | `{id,paymentStatus,refundStatus,refundedAmount,email,receiptUrl,amount,currency,wristSize,shippingCountry,marketingConsent}`; monetary amounts are cents |
| PATCH `/api/reservations/current` | optional `{email,wristSize,shippingCountry,marketingConsent}`; accepted only after verified payment |
| POST `/api/reservations/refund` | session-authorized request for remaining refundable balance; returns the same public reservation DTO |
| POST `/api/reservations/events` | `{event,source,visitorId?,attemptId?}`; allowlisted browser events only |

Errors are `{error: string}` with HTTP status. `paymentStatus`: `pending`, `processing`, `paid`, `failed`, `cancelled`. `refundStatus`: `none`, `pending`, `partial`, `refunded`, `failed`. `paid` describes the original settled payment and remains paid after a refund; the separate refund state must be checked before treating a reservation as active. A dismissed Apple Pay sheet is a client cancellation, not proof that an in-flight payment failed. Always recheck current state before retrying.

## Refunds and recovery

The browser's reservation credential authorizes a full refund of the remaining balance. A durable refund request ID supplies a stable idempotency key. The API acknowledges the request; only signed webhook reconciliation finalizes actual refund settlement. Stripe's remaining-balance refund prevents over-refunds after an operator has issued a partial refund. Dashboard refunds are reconciled too. A completed partial request can generate one new durable key for the remainder. `refundedAmount` reports only verified, settled refunds: a $10 refund leaves $15 of reservation credit and $174 toward the $189 purchase price.

If a charge is missing/unpaid/disputed or Stripe definitively rejects refund creation, the server commits `failed` and returns that support-needed state while preserving the request ID. No refund object exists in that situation, so waiting for a refund webhook would be incorrect. Unrelated payment events cannot reset this failure to pending. Timeouts, connection failures, Stripe API 5xx responses and idempotency-in-use errors remain `pending` because a refund might already have been created. Any retry uses the original key; operators must reconcile that request against Stripe before starting another. Do not mistake an HTTP error for proof that Stripe did nothing.

Failed refunds show `failed` and require support; retrying the button cannot silently create unlimited new refund attempts. An operator should inspect Stripe's failure reason, address it, and issue the appropriate remaining refund in the Stripe Dashboard. The resulting webhook updates the record. Disputed charges also require operator handling rather than an automatic competing refund.

If the session cookie is lost, use Halo support and the Stripe receipt/reference for human verification; the current implementation intentionally has no email-login or public reservation-ID lookup. Operators should use Stripe Dashboard customer/payment evidence, never authorize a refund or disclose a receipt from a claimed email alone. Self-service recovery links can be added later as scoped, expiring credentials.

For a stale creation gap, locate the PaymentIntent by the reservation metadata in Stripe. Bind/reconcile that existing intent and replay its genuine event; do not reset the row or generate a new payment blindly. Monitor non-2xx webhook deliveries, repeated pending reservations, failed refunds, schema connectivity and unusual declines. Stripe retries failed webhooks; use its Dashboard/CLI event resend for missed deliveries. Never manually mark an unpaid browser redirect as paid.

Keep event-ledger records for the payment retention period; deleting them removes replay deduplication evidence. Prune `halo_rate_limits` buckets older than two days daily. Set and document a telemetry retention window (e.g. 90 days), restrict analytics access, and prune `halo_reservation_events` accordingly. Reservation/payment retention should follow the operator's accounting/privacy policy; backups need the same access controls.

Use the read-only `scripts/reservation-funnel.sql` query for the retained funnel data. Browser events measure observed interactions, while completed/refunded conversions come from server-confirmed Stripe events. Deduplicate by the recorded visitor/attempt identity rather than counting raw click events as people.

## Verification

`pnpm test:reservations` runs pure tests; PostgreSQL tests are explicitly skipped unless `TEST_DATABASE_URL` points to a disposable local cluster at port `55439`. To exercise the real transaction/uniqueness/locking behavior, initialize an isolated PostgreSQL cluster and run:

```sh
TEST_DATABASE_URL=postgresql://USER@127.0.0.1:55439/postgres pnpm test:reservations
```

The integration suite uses real PostgreSQL and a mocked Stripe transport. It checks concurrency, event replay, rollback, stale event delivery, amount validation, browser authentication, forged success redirects, signature rejection, optional late receipts, refund pending/failure/partial/full states, paused-sales service continuity, and rate limiting. It does not establish wallet compatibility or live payment readiness.

Before activation, also use Stripe sandbox over HTTPS to verify: compatible Apple Pay sheet/authentication; unsupported-device card fallback; success and delayed webhook; decline; 3DS challenge; cancellation; network loss/reload; duplicate delivery; invalid signature; receipt with wallet email and optional late email; refund and failed refund; webhook outage/recovery; paused sales; mobile focus/scroll accessibility. Confirm the Apple Pay sheet shows **$25**, no shipping requirement, and the success view explains the **$189** credit. Do not test by making a live charge without explicit authorization.

## Source documentation

- [Express Checkout Element and deferred PaymentIntents](https://docs.stripe.com/elements/express-checkout-element/accept-a-payment?payment-ui=elements)
- [Payment Element minimal billing collection](https://docs.stripe.com/payments/payment-element/control-billing-details-collection)
- [Webhook signatures, retries, duplicates and ordering](https://docs.stripe.com/webhooks)
- [Charge receipt-email updates](https://docs.stripe.com/api/charges/update)
- [Refund lifecycle and events](https://docs.stripe.com/refunds)
- [Stripe receipts](https://docs.stripe.com/receipts)
