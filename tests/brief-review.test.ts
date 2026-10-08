import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { after, test } from 'node:test';
import { NextRequest } from 'next/server';
import { COOKIE, configuration, issueSession, requireSameOrigin,
  verifyAccessCode, verifySession } from '../lib/brief-review/auth';
import { applyAction, blankSection, parseAction, ReviewError, sectionView,
  type SectionId, type SectionRecord } from '../lib/brief-review/model';
import { mutateReview, readReview } from '../lib/brief-review/service';
import { StoreConflict, type LoadedSection, type SectionStore } from '../lib/brief-review/store';
import { DELETE as deleteSession, GET as getSession, POST as postSession } from '../app/api/brief-review/session/route';
import { GET as getReview, POST as postReview } from '../app/api/brief-review/route';

const keys = [
  'BRIEF_REVIEW_ORIGIN', 'BRIEF_REVIEW_SESSION_SECRET',
  'BRIEF_REVIEW_ACCESS_CONNOR_SHA256', 'BRIEF_REVIEW_ACCESS_PARTNER_SHA256',
  'BRIEF_REVIEW_BLOB_READ_WRITE_TOKEN', 'BLOB_READ_WRITE_TOKEN',
] as const;
const original = Object.fromEntries(keys.map(key => [key, process.env[key]]));
after(() => {
  for (const key of keys) {
    if (original[key] === undefined) delete process.env[key];
    else process.env[key] = original[key];
  }
});

const codeA = randomBytes(24).toString('hex');
const codeB = randomBytes(24).toString('hex');
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

function configure() {
  process.env.BRIEF_REVIEW_ORIGIN = 'http://localhost:3000';
  process.env.BRIEF_REVIEW_SESSION_SECRET = randomBytes(32).toString('hex');
  process.env.BRIEF_REVIEW_ACCESS_CONNOR_SHA256 = sha256(codeA);
  process.env.BRIEF_REVIEW_ACCESS_PARTNER_SHA256 = sha256(codeB);
  process.env.BRIEF_REVIEW_BLOB_READ_WRITE_TOKEN = randomBytes(32).toString('hex');
  const config = configuration();
  assert.ok(config);
  return config;
}

function request(method = 'GET', body?: unknown, origin = 'http://localhost:3000') {
  return new NextRequest('http://localhost:3000/api/brief-review/session', {
    method,
    headers: { origin, 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

class MemoryStore implements SectionStore {
  private readonly values = new Map<SectionId, { record: SectionRecord; version: number }>();
  conflicts = 0;

  async read(sectionId: SectionId): Promise<LoadedSection> {
    const value = this.values.get(sectionId);
    return value
      ? { record: structuredClone(value.record), etag: String(value.version) }
      : { record: blankSection(sectionId), etag: null };
  }

  async write(sectionId: SectionId, record: SectionRecord, etag: string | null): Promise<void> {
    const current = this.values.get(sectionId);
    if ((current ? String(current.version) : null) !== etag) {
      this.conflicts++;
      throw new StoreConflict();
    }
    this.values.set(sectionId, { record: structuredClone(record), version: (current?.version ?? 0) + 1 });
  }
}

test('configuration is fail-closed; codes and signed sessions are distinct and revocable', () => {
  for (const key of keys) delete process.env[key];
  assert.equal(configuration(), null);
  const config = configure();
  assert.equal(verifyAccessCode(codeA, config), 'connor');
  assert.equal(verifyAccessCode(codeB, config), 'partner');
  assert.equal(verifyAccessCode('wrong-code'.repeat(4), config), null);
  const cookie = issueSession('connor', config);
  assert.equal(verifySession(cookie, config), 'connor');
  assert.equal(verifySession(cookie.slice(0, -1) + 'x', config), null);
  assert.equal(verifySession(cookie, config, Date.now() + 31 * 24 * 60 * 60 * 1000), null);
  process.env.BRIEF_REVIEW_ACCESS_CONNOR_SHA256 = sha256(randomBytes(24).toString('hex'));
  const rotated = configuration();
  assert.ok(rotated);
  assert.equal(verifySession(cookie, rotated), null);
});

test('session endpoint has no-store responses, same-origin login, and HttpOnly cookie', async () => {
  configure();
  const anonymous = await getSession(request());
  assert.deepEqual(await anonymous.json(), { available: true, user: null });
  assert.equal(anonymous.headers.get('cache-control'), 'private, no-store');
  const rejected = await postSession(request('POST', { code: codeA }, 'https://other.example'));
  assert.equal(rejected.status, 403);
  const invalid = await postSession(request('POST', { code: 'x'.repeat(48) }));
  assert.equal(invalid.status, 401);
  const oversized = await postSession(request('POST', { code: 'x'.repeat(9000) }));
  assert.equal(oversized.status, 413);
  const loggedIn = await postSession(request('POST', { code: codeB }));
  assert.equal(loggedIn.status, 200);
  assert.deepEqual(await loggedIn.json(), { available: true, user: { id: 'partner', label: 'Partner' } });
  const setCookie = loggedIn.headers.get('set-cookie') ?? '';
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /SameSite=strict/i);
  assert.match(setCookie, /Path=\/api\/brief-review/);
  const cookieValue = loggedIn.cookies.get(COOKIE)?.value;
  assert.ok(cookieValue);
  const authenticated = request();
  authenticated.cookies.set(COOKIE, cookieValue);
  assert.deepEqual(await (await getSession(authenticated)).json(), {
    available: true, user: { id: 'partner', label: 'Partner' },
  });
  const signedOut = await deleteSession(authenticated);
  assert.deepEqual(await signedOut.json(), { available: true, user: null });
  assert.equal(signedOut.cookies.get(COOKIE)?.value, '');
});

test('review endpoint refuses anonymous reads and cross-origin writes before touching storage', async () => {
  configure();
  const anonymous = await getReview(new NextRequest('http://localhost:3000/api/brief-review'));
  assert.equal(anonymous.status, 401);
  const crossOrigin = await postReview(new NextRequest('http://localhost:3000/api/brief-review', {
    method: 'POST', headers: { origin: 'https://other.example', 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'comment', sectionId: 'gtm', body: 'private' }),
  }));
  assert.equal(crossOrigin.status, 403);
});

test('origin checking rejects missing or cross-site Origin', () => {
  const config = configure();
  assert.throws(() => requireSameOrigin(request('POST', {}, 'https://other.example'), config),
    (error: unknown) => error instanceof ReviewError && error.code === 'invalid_origin');
  const noOrigin = new NextRequest('http://localhost:3000/api/brief-review', { method: 'POST' });
  assert.throws(() => requireSameOrigin(noOrigin, config));
});

test('comments are append-only, unread is per reviewer, and read cursor is server-owned', async () => {
  const store = new MemoryStore();
  await mutateReview(store, parseAction({ action: 'comment', sectionId: 'stones', body: 'Try a lower setting.' }), 'partner');
  let connor = await readReview(store, 'connor');
  assert.equal(connor.unreadTotal, 1);
  assert.equal(connor.sections.stones.comments[0].author, 'partner');
  assert.equal((await readReview(store, 'partner')).unreadTotal, 0);
  await mutateReview(store, parseAction({ action: 'read', sectionId: 'stones' }), 'connor');
  connor = await readReview(store, 'connor');
  assert.equal(connor.sections.stones.unread, 0);
  await mutateReview(store, parseAction({ action: 'comment', sectionId: 'stones', body: 'Agreed.' }), 'connor');
  assert.equal((await readReview(store, 'partner')).sections.stones.unread, 1);
  assert.deepEqual((await store.read('stones')).record.comments.map(comment => comment.seq), [1, 2]);
  await mutateReview(store, parseAction({ action: 'read', sectionId: 'stones', throughSeq: 1 }), 'partner');
  assert.equal((await readReview(store, 'partner')).sections.stones.unread, 1);
  await mutateReview(store, parseAction({ action: 'read', sectionId: 'stones', throughSeq: 2 }), 'partner');
  assert.equal((await readReview(store, 'partner')).sections.stones.unread, 0);
});

test('packaging generation section shares notes and unread comments through the review model', async () => {
  const store = new MemoryStore();
  const sectionId = 'ai-generations-packaging';
  await mutateReview(store, parseAction({ action: 'note', sectionId, body: 'Review the second packaging image.', revision: 0 }), 'connor');
  await mutateReview(store, parseAction({ action: 'comment', sectionId, body: 'Use it in the header.' }), 'partner');
  const connor = await readReview(store, 'connor');
  assert.equal(connor.sections[sectionId].note?.body, 'Review the second packaging image.');
  assert.equal(connor.sections[sectionId].unread, 1);
  assert.equal(connor.unreadTotal, 1);
  await mutateReview(store, parseAction({ action: 'read', sectionId }), 'connor');
  assert.equal((await readReview(store, 'connor')).unreadTotal, 0);
});

test('notes support intentional clearing and reject superseded revisions', async () => {
  const store = new MemoryStore();
  let note = await mutateReview(store, parseAction({ action: 'note', sectionId: 'gtm', body: 'Test LA first.', revision: 0 }), 'connor');
  assert.equal(note.note?.revision, 1);
  await assert.rejects(
    mutateReview(store, parseAction({ action: 'note', sectionId: 'gtm', body: 'Stale edit', revision: 0 }), 'partner'),
    (error: unknown) => error instanceof ReviewError && error.code === 'note_conflict',
  );
  note = await mutateReview(store, parseAction({ action: 'note', sectionId: 'gtm', body: '', revision: 1 }), 'partner');
  assert.equal(note.note?.body, '');
  assert.equal(note.note?.revision, 2);
  assert.equal(note.note?.updatedBy, 'partner');
  assert.equal(sectionView((await store.read('gtm')).record, 'connor').unread, 0);
});

test('simultaneous note edits with the same expected revision do not overwrite each other', async () => {
  const store = new MemoryStore();
  const attempts = await Promise.allSettled([
    mutateReview(store, parseAction({ action: 'note', sectionId: 'gtm', body: 'A', revision: 0 }), 'connor'),
    mutateReview(store, parseAction({ action: 'note', sectionId: 'gtm', body: 'B', revision: 0 }), 'partner'),
  ]);
  assert.equal(attempts.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(attempts.filter(result => result.status === 'rejected').length, 1);
  assert.equal((await store.read('gtm')).record.note?.revision, 1);
});

test('concurrent writes retry compare-and-swap instead of losing comments', async () => {
  const store = new MemoryStore();
  const actionA = parseAction({ action: 'comment', sectionId: 'review-notes', body: 'First thought' });
  const actionB = parseAction({ action: 'comment', sectionId: 'review-notes', body: 'Second thought' });
  await Promise.all([mutateReview(store, actionA, 'connor'), mutateReview(store, actionB, 'partner')]);
  const saved = (await store.read('review-notes')).record;
  assert.equal(saved.comments.length, 2);
  assert.deepEqual(saved.comments.map(comment => comment.seq), [1, 2]);
  assert.ok(store.conflicts >= 1);
});

test('invalid sections, empty comments and oversized input are rejected', () => {
  assert.throws(() => parseAction({ action: 'comment', sectionId: 'unknown', body: 'x' }));
  assert.throws(() => parseAction({ action: 'comment', sectionId: 'gtm', body: '  ' }));
  assert.throws(() => parseAction({ action: 'note', sectionId: 'gtm', body: 'x'.repeat(4001), revision: 0 }));
  assert.throws(() => parseAction({ action: 'read', sectionId: '__proto__' }));
  assert.throws(() => parseAction({ action: 'read', sectionId: 'gtm', throughSeq: -1 }));
  const record = blankSection('gtm');
  const next = applyAction(record, parseAction({ action: 'comment', sectionId: 'gtm', body: '<script>alert(1)</script>' }), 'partner');
  assert.equal(next.comments[0].body, '<script>alert(1)</script>');
  assert.equal(record.comments.length, 0);
});
