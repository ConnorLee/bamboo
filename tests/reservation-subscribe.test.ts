import assert from 'node:assert/strict';
import test from 'node:test';
import { POST } from '../app/api/subscribe/route';

test('updates signup stays optional and succeeds without a reservation database', async () => {
  const originalFetch = globalThis.fetch;
  const previous = { ...process.env };
  let submitted: Record<string, unknown> | undefined;
  process.env.MAILCHIMP_API_KEY = 'test-only';
  process.env.MAILCHIMP_API_SERVER = 'us-test';
  process.env.MAILCHIMP_AUDIENCE_ID = 'test-only';
  delete process.env.DATABASE_URL;
  globalThis.fetch = async (_input, init) => {
    submitted = JSON.parse(String(init?.body));
    return new Response('{}', { status: 200 });
  };
  try {
    const response = await POST(new Request('http://localhost/api/subscribe', {
      method: 'POST', body: JSON.stringify({ email: 'fixture@example.com', visitorId: 'invalid' }),
    }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true });
    assert.deepEqual(submitted, { email_address: 'fixture@example.com', status: 'subscribed' });
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of ['MAILCHIMP_API_KEY', 'MAILCHIMP_API_SERVER', 'MAILCHIMP_AUDIENCE_ID', 'DATABASE_URL']) {
      if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key];
    }
  }
});

test('malformed and invalid updates requests are rejected before external calls', async () => {
  for (const body of ['{', '{}', '{"email":42}', '{"email":"not-an-email"}']) {
    const response = await POST(new Request('http://localhost/api/subscribe', { method: 'POST', body }));
    assert.equal(response.status, 400);
  }
});
