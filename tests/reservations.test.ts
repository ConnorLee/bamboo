import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { after, before, beforeEach, describe, test } from 'node:test';
import Stripe from 'stripe';
import { NextRequest } from 'next/server';
import { OFFER, paymentStatus, refundStatus, validateIntent } from '../lib/reservations/domain';
import { configuration } from '../lib/reservations/config';
import { database, closeDatabase } from '../lib/reservations/db';
import { createReservation, findCurrent, processStripeEvent, requestRefund, saveDetails, publicReservation, detailsSchema, eventSchema } from '../lib/reservations/service';
import { sameOrigin, sessionHash, rateLimit } from '../lib/reservations/http';
import { GET as getCurrent } from '../app/api/reservations/current/route';
import { GET as getConfig } from '../app/api/reservations/config/route';
import { POST as webhook } from '../app/api/stripe/webhook/route';

test('successful payment never regresses to a failure snapshot', () => {
  assert.equal(paymentStatus('requires_payment_method', 'paid', true), 'paid');
  assert.equal(paymentStatus('canceled', 'paid'), 'paid');
  assert.equal(paymentStatus('requires_payment_method', 'pending', true), 'failed');
});
test('refund state distinguishes partial, pending, failed and full settlement', () => {
  assert.equal(refundStatus([{amount: 1000, status: 'succeeded'}], false), 'partial');
  assert.equal(refundStatus([{amount: 2500, status: 'pending'}], true), 'pending');
  assert.equal(refundStatus([{amount: 2500, status: 'failed'}], true), 'failed');
  assert.equal(refundStatus([{amount: 2500, status: 'succeeded'}], true), 'refunded');
});
test('amount, metadata, mode, and settled amount are canonical server facts', () => {
  const row = { id: randomUUID(), attempt_id: randomUUID() };
  const intent = { amount: 2500, amount_received: 2500, currency: 'usd', livemode: false, status: 'succeeded',
    metadata: { product: OFFER.product, reservation_id: row.id, attempt_id: row.attempt_id } };
  validateIntent(intent, row, false);
  for (const change of [{amount: 1}, {amount_received: 0}, {currency: 'eur'}, {livemode: true}, {metadata: {}}]) {
    assert.throws(() => validateIntent({...intent, ...change}, row, false), /payment_mismatch/);
  }
});
test('client bodies cannot supply payment state, arbitrary analytics, or prices', () => {
  assert.equal(detailsSchema.safeParse({paymentStatus: 'paid'}).success, false);
  assert.equal(eventSchema.safeParse({event: 'reservation_completed', source: 'home'}).success, false);
});

const testUrl = process.env.TEST_DATABASE_URL;
describe('PostgreSQL integration with mocked Stripe transport', {skip: !testUrl}, () => {
  // Never truncate a normal development or production database accidentally.
  before(async () => {
    const url = new URL(testUrl!);
    assert.ok(['localhost','127.0.0.1'].includes(url.hostname) && url.port === '55439', 'Use the isolated local test cluster on port 55439');
    Object.assign(process.env, { DATABASE_URL: testUrl, HALO_RESERVATIONS_ENABLED: 'true',
      HALO_SITE_URL: 'http://localhost:3000', STRIPE_SECRET_KEY: 'sk_test_local_mock',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_local_mock', STRIPE_WEBHOOK_SECRET: 'whsec_local_mock',
      RESERVATION_SESSION_SECRET: 'local-test-secret-at-least-32-random-characters' });
    const connection = await database().reserve();
    try { await connection.unsafe(await readFile(new URL('../migrations/001_halo_reservations.sql', import.meta.url), 'utf8')); }
    finally { connection.release(); }
  });
  after(async () => { await closeDatabase(); });
  beforeEach(async () => {
    process.env.HALO_RESERVATIONS_ENABLED = 'true';
    await database()`TRUNCATE halo_reservation_events, halo_stripe_events, halo_reservations, halo_rate_limits RESTART IDENTITY CASCADE`;
  });

  function mockStripe() {
    let intent: any;
    let refunds: any[] = [];
    let creates = 0, refundCreates = 0, receiptSends = 0;
    const refundKeys: string[] = [];
    const client = {
      paymentIntents: {
        create: async (input: any) => {
          creates++;
          intent = {...input, id: `pi_${randomUUID()}`, status: 'requires_payment_method', amount_received: 0,
            livemode: false, customer: null, receipt_email: null, latest_charge: null, client_secret: 'pi_local_secret_private'};
          return structuredClone(intent);
        },
        retrieve: async () => structuredClone(intent),
      },
      charges: { update: async () => { receiptSends++; return {}; } },
      refunds: {
        list: () => ({ async *[Symbol.asyncIterator]() { for (const r of refunds) yield structuredClone(r); } }),
        create: async (input: any, options: any) => { refundCreates++; refundKeys.push(options.idempotencyKey);
          const amount = 2500 - refunds.filter(r => r.status === 'succeeded').reduce((sum, r) => sum + r.amount, 0);
          const refund = {id: `re_${randomUUID()}`, amount, status: 'pending', metadata: input.metadata}; refunds.push(refund); return refund; },
      },
    } as unknown as Stripe;
    return { client, refundKeys, get intent() { return intent; }, get refunds() { return refunds; },
      get creates() { return creates; }, get refundCreates() { return refundCreates; }, get receiptSends() { return receiptSends; },
      paid() { intent.status = 'succeeded'; intent.amount_received = 2500; intent.latest_charge = {
        id: 'ch_local', payment_intent: intent.id, amount: 2500, currency: 'usd', paid: true, disputed: false,
        receipt_url: 'https://pay.stripe.com/receipts/local', billing_details: {}, receipt_email: null }; },
      event(type = 'payment_intent.succeeded', id = `evt_${randomUUID()}`) {
        return {id, type, livemode: false, data: {object: type.startsWith('payment_intent.') ? structuredClone(intent) :
          {payment_intent: intent.id, id: 're_local'}}} as Stripe.Event;
      },
    };
  }
  async function started() {
    const mock = mockStripe();
    const attemptId = randomUUID();
    const reservation = await createReservation('session_a', { attemptId, visitorId: randomUUID() }, mock.client);
    return { mock, attemptId, reservation };
  }

  test('concurrent retries create one durable reservation and one PaymentIntent', async () => {
    const mock = mockStripe(), attemptId = randomUUID();
    const results = await Promise.all(Array.from({length: 4}, () => createReservation('same_session', {attemptId}, mock.client)));
    assert.equal(new Set(results.map(r => r.id)).size, 1);
    assert.equal(mock.creates, 1);
    assert.equal((await findCurrent('same_session')).payment_status, 'pending');
  });
  test('another browser cannot take over a known attempt identifier', async () => {
    const {mock, attemptId} = await started();
    await assert.rejects(createReservation('attacker_session', {attemptId}, mock.client), /attempt_unavailable/);
    assert.equal(mock.creates, 1);
  });
  test('an old unresolved creation gap fails closed after the Stripe idempotency window', async () => {
    const mock = mockStripe();
    await database()`INSERT INTO halo_reservations (id, attempt_id, session_hash, created_at)
      VALUES (${randomUUID()}, ${randomUUID()}, 'old_session', now() - interval '25 hours')`;
    await assert.rejects(createReservation('old_session', {attemptId:randomUUID()}, mock.client), /reservation_needs_reconciliation/);
    assert.equal(mock.creates, 0);
  });
  test('duplicate concurrent webhook deliveries settle and emit conversion exactly once', async () => {
    const {mock} = await started(); mock.paid();
    const event = mock.event();
    await Promise.all([processStripeEvent(event, mock.client), processStripeEvent(event, mock.client)]);
    assert.equal((await findCurrent('session_a')).payment_status, 'paid');
    const [counts] = await database()`SELECT count(*)::int AS count FROM halo_reservation_events WHERE event = 'reservation_completed'`;
    assert.equal(counts.count, 1);
  });
  test('older failure event after success reads current Stripe state and cannot regress payment', async () => {
    const {mock} = await started();
    const old = mock.event('payment_intent.payment_failed');
    mock.paid();
    await processStripeEvent(mock.event(), mock.client);
    await processStripeEvent(old, mock.client);
    assert.equal((await findCurrent('session_a')).payment_status, 'paid');
  });
  test('mismatched amount rolls back event ledger and permits genuine retry', async () => {
    const {mock} = await started(); mock.paid();
    const event = mock.event(); mock.intent.amount = 1;
    await assert.rejects(processStripeEvent(event, mock.client), /payment_mismatch/);
    const [count] = await database()`SELECT count(*)::int AS count FROM halo_stripe_events`;
    assert.equal(count.count, 0);
    assert.equal((await findCurrent('session_a')).payment_status, 'pending');
    mock.intent.amount = 2500;
    await processStripeEvent(event, mock.client);
    assert.equal((await findCurrent('session_a')).payment_status, 'paid');
  });
  test('forged redirect query and unsigned webhook cannot confirm payment or authorize access', async () => {
    const {mock} = await started();
    const response = await getCurrent(new NextRequest('http://localhost:3000/api/reservations/current?redirect_status=succeeded&payment_intent=pi_forged'));
    assert.equal(response.status, 401);
    const result = await webhook(new NextRequest('http://localhost:3000/api/stripe/webhook', {method:'POST', body: JSON.stringify(mock.event())}));
    assert.equal(result.status, 400);
    const invalid = await webhook(new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method:'POST', body: JSON.stringify(mock.event()), headers: {'stripe-signature':'t=1,v1=forged'}}));
    assert.equal(invalid.status, 400);
    assert.equal((await findCurrent('session_a')).payment_status, 'pending');
  });
  test('signed raw webhook accepts unrelated events without payment mutation', async () => {
    const payload = JSON.stringify({id:'evt_ignored', type:'customer.created', livemode:false, data:{object:{id:'cus_test'}}});
    const signature = new Stripe('sk_test_local_mock').webhooks.generateTestHeaderString({payload, secret:'whsec_local_mock'});
    const result = await webhook(new NextRequest('http://localhost:3000/api/stripe/webhook', {method:'POST', body:payload, headers:{'stripe-signature':signature}}));
    assert.equal(result.status, 200);
  });
  test('details/refunds are denied before settlement; optional email sends a Stripe receipt after settlement', async () => {
    const {mock} = await started();
    await assert.rejects(saveDetails('session_a', {email:'owner@example.com'}, mock.client), /payment_not_confirmed/);
    await assert.rejects(requestRefund('session_a', mock.client), /payment_not_confirmed/);
    await assert.rejects(requestRefund('other_session', mock.client), /reservation_not_found/);
    mock.paid(); await processStripeEvent(mock.event(), mock.client);
    await saveDetails('session_a', {email:'owner@example.com', marketingConsent:true}, mock.client);
    await saveDetails('session_a', {email:'owner@example.com'}, mock.client);
    assert.equal(mock.receiptSends, 1);
    assert.equal((await findCurrent('session_a')).marketing_consent, true);
  });
  test('refund request is idempotent and only webhook can finalize refund; late events preserve it', async () => {
    const {mock} = await started(); mock.paid(); await processStripeEvent(mock.event(), mock.client);
    await Promise.all([requestRefund('session_a', mock.client), requestRefund('session_a', mock.client)]);
    assert.equal(mock.refundCreates, 1);
    assert.equal((await findCurrent('session_a')).refund_status, 'pending');
    mock.refunds[0].status = 'succeeded';
    await processStripeEvent(mock.event('refund.updated'), mock.client);
    await processStripeEvent(mock.event('refund.created'), mock.client);
    assert.equal((await findCurrent('session_a')).refund_status, 'refunded');
    await requestRefund('session_a', mock.client);
    assert.equal(mock.refundCreates, 1);
  });
  test('Dashboard partial refund is preserved and full remaining refund becomes settled', async () => {
    const {mock} = await started(); mock.paid(); await processStripeEvent(mock.event(), mock.client);
    mock.refunds.push({id:'re_partial', amount:1000, status:'succeeded'});
    await processStripeEvent(mock.event('charge.refunded'), mock.client);
    const partial = publicReservation(await findCurrent('session_a'));
    assert.equal(partial.refundStatus, 'partial');
    assert.equal(partial.refundedAmount, 1000);
    mock.refunds.push({id:'re_remaining', amount:1500, status:'succeeded'});
    await processStripeEvent(mock.event('refund.updated'), mock.client);
    assert.equal((await findCurrent('session_a')).refund_status, 'refunded');
  });
  for (const unavailable of ['disputed', 'missing', 'unpaid']) {
    test(`${unavailable} charge cannot leave a refund request permanently pending`, async () => {
      const {mock} = await started(); mock.paid(); await processStripeEvent(mock.event(), mock.client);
      const original = structuredClone(mock.intent.latest_charge);
      if (unavailable === 'missing') mock.intent.latest_charge = null;
      else if (unavailable === 'unpaid') mock.intent.latest_charge.paid = false;
      else mock.intent.latest_charge.disputed = true;
      const rejected = await requestRefund('session_a', mock.client);
      assert.equal(rejected.refundStatus, 'failed');
      const row = await findCurrent('session_a');
      assert.ok(row.refund_request_id);
      assert.equal(row.stripe_refund_id, null);
      assert.equal(mock.refundCreates, 0);
      mock.intent.latest_charge = original;
      await processStripeEvent(mock.event(), mock.client);
      assert.equal((await findCurrent('session_a')).refund_status, 'failed');
      await requestRefund('session_a', mock.client);
      assert.equal((await findCurrent('session_a')).refund_request_id, row.refund_request_id);
      assert.equal(mock.refundCreates, 0);
    });
  }
  test('definite Stripe creation rejection commits failed without losing the durable request key', async () => {
    const {mock} = await started(); mock.paid(); await processStripeEvent(mock.event(), mock.client);
    mock.client.refunds.create = (async () => {
      throw Object.assign(new Error('invalid refund'), {type:'StripeInvalidRequestError'});
    }) as typeof mock.client.refunds.create;
    const rejected = await requestRefund('session_a', mock.client);
    assert.equal(rejected.refundStatus, 'failed');
    assert.ok((await findCurrent('session_a')).refund_request_id);
    assert.equal((await findCurrent('session_a')).stripe_refund_id, null);
  });
  test('ambiguous timeout preserves pending and retries the exact same refund idempotency key', async () => {
    const {mock} = await started(); mock.paid(); await processStripeEvent(mock.event(), mock.client);
    const originalCreate = mock.client.refunds.create;
    let uncertainKey: string | undefined;
    mock.client.refunds.create = (async (_input: unknown, options: {idempotencyKey:string}) => {
      uncertainKey = options.idempotencyKey;
      throw Object.assign(new Error('timeout'), {type:'StripeConnectionError'});
    }) as typeof mock.client.refunds.create;
    await assert.rejects(requestRefund('session_a', mock.client), /timeout/);
    const uncertain = await findCurrent('session_a');
    assert.equal(uncertain.refund_status, 'pending');
    assert.equal(uncertain.stripe_refund_id, null);
    mock.client.refunds.create = originalCreate;
    await requestRefund('session_a', mock.client);
    assert.equal(mock.refundKeys[0], uncertainKey);
    assert.equal((await findCurrent('session_a')).refund_request_id, uncertain.refund_request_id);
  });
  test('a settled partial request can refund the remaining balance using one new durable key', async () => {
    const {mock} = await started(); mock.paid(); await processStripeEvent(mock.event(), mock.client);
    await requestRefund('session_a', mock.client);
    const firstKey = (await findCurrent('session_a')).refund_request_id;
    mock.refunds[0].amount = 1000; mock.refunds[0].status = 'succeeded';
    await processStripeEvent(mock.event('refund.updated'), mock.client);
    assert.equal((await findCurrent('session_a')).refunded_amount, 1000);
    await Promise.all([requestRefund('session_a', mock.client), requestRefund('session_a', mock.client)]);
    assert.equal(mock.refundCreates, 2);
    assert.equal(mock.refunds[1].amount, 1500);
    assert.notEqual((await findCurrent('session_a')).refund_request_id, firstKey);
    mock.refunds[1].status = 'succeeded';
    await processStripeEvent(mock.event('refund.updated'), mock.client);
    assert.equal((await findCurrent('session_a')).refund_status, 'refunded');
  });
  test('refund failure is visible and cannot create uncontrolled automatic refund retries', async () => {
    const {mock} = await started(); mock.paid(); await processStripeEvent(mock.event(), mock.client);
    await requestRefund('session_a', mock.client);
    mock.refunds[0].status = 'failed';
    await processStripeEvent(mock.event('refund.failed'), mock.client);
    const retried = await requestRefund('session_a', mock.client);
    assert.equal(retried.refundStatus, 'failed');
    assert.equal(mock.refundCreates, 1);
  });
  test('sales pause preserves webhooks, receipts and refunds while preventing new intents', async () => {
    const {mock} = await started();
    process.env.HALO_RESERVATIONS_ENABLED = 'false';
    assert.equal(configuration().configured, true);
    await assert.rejects(createReservation('new_session', {attemptId:randomUUID()}, mock.client), /reservations_paused/);
    mock.paid(); await processStripeEvent(mock.event(), mock.client);
    assert.equal((await findCurrent('session_a')).payment_status, 'paid');
    await requestRefund('session_a', mock.client);
    const response = await getConfig(new NextRequest('http://localhost:3000/api/reservations/config'));
    const body = await response.json();
    assert.equal(body.enabled, false); assert.equal(body.manageable, true);
  });
  test('same-origin enforcement, session authentication and durable limiter reject misuse', async () => {
    const request = new NextRequest('http://localhost:3000/api/reservations', {method:'POST', headers:{origin:'https://attacker.example'}});
    assert.throws(() => sameOrigin(request), /invalid_origin/);
    assert.throws(() => sessionHash(request), /session_missing/);
    const auth = new NextRequest('http://localhost:3000/api/reservations', {headers:{cookie:`halo_reservation_session=${'a'.repeat(64)}`}});
    await rateLimit(auth, 'test', 1);
    await assert.rejects(rateLimit(auth, 'test', 1), /too_many_requests/);
  });
});
