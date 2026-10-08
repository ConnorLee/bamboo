import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { after, test } from 'node:test';
import { NextRequest } from 'next/server';
import { reviewHandlers } from '../lib/brief-review/handlers';
import { configuration, requireSameOrigin } from '../lib/brief-review/http';
import { applyAction, blankSection, parseAction, ReviewError, validateSection,
  type SectionId, type SectionRecord } from '../lib/brief-review/model';
import { mutateReview, readReview } from '../lib/brief-review/service';
import { sectionPath, StoreConflict, type LoadedSection, type SectionStore } from '../lib/brief-review/store';

const keys = [
  'BRIEF_REVIEW_ORIGIN', 'BRIEF_REVIEW_BLOB_READ_WRITE_TOKEN', 'BLOB_READ_WRITE_TOKEN',
  'BRIEF_REVIEW_SESSION_SECRET', 'BRIEF_REVIEW_ACCESS_CONNOR_SHA256',
  'BRIEF_REVIEW_ACCESS_PARTNER_SHA256',
] as const;
const original = Object.fromEntries(keys.map(key => [key, process.env[key]]));
after(() => {
  for (const key of keys) {
    if (original[key] === undefined) delete process.env[key];
    else process.env[key] = original[key];
  }
});

function configure() {
  process.env.BRIEF_REVIEW_ORIGIN = 'http://localhost:3000';
  process.env.BRIEF_REVIEW_BLOB_READ_WRITE_TOKEN = randomBytes(32).toString('hex');
  const config = configuration();
  assert.ok(config);
  return config;
}

function request(method = 'GET', body?: unknown, origin: string | null = 'http://localhost:3000') {
  return new NextRequest('http://localhost:3000/api/brief-review', {
    method,
    headers: {
      ...(origin ? { origin } : {}),
      'content-type': 'application/json',
      'sec-fetch-site': 'same-origin',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

class MemoryStore implements SectionStore {
  private readonly values = new Map<SectionId, { record: SectionRecord; version: number }>();
  reads = 0;
  writes = 0;
  conflicts = 0;

  async read(sectionId: SectionId): Promise<LoadedSection> {
    this.reads++;
    const value = this.values.get(sectionId);
    return value
      ? { record: structuredClone(value.record), etag: String(value.version) }
      : { record: blankSection(sectionId), etag: null };
  }

  async write(sectionId: SectionId, record: SectionRecord, etag: string | null): Promise<void> {
    this.writes++;
    const current = this.values.get(sectionId);
    if ((current ? String(current.version) : null) !== etag) {
      this.conflicts++;
      throw new StoreConflict();
    }
    this.values.set(sectionId, { record: structuredClone(record), version: (current?.version ?? 0) + 1 });
  }
}

test('the site origin and a server-only Blob token configure the open review', () => {
  for (const key of keys) delete process.env[key];
  assert.equal(configuration(), null);
  const config = configure();
  assert.equal(config.origin, 'http://localhost:3000');
  process.env.BRIEF_REVIEW_SESSION_SECRET = '';
  process.env.BRIEF_REVIEW_ACCESS_CONNOR_SHA256 = '';
  process.env.BRIEF_REVIEW_ACCESS_PARTNER_SHA256 = '';
  assert.ok(configuration());
  delete process.env.BRIEF_REVIEW_BLOB_READ_WRITE_TOKEN;
  assert.equal(configuration(), null);
  process.env.BLOB_READ_WRITE_TOKEN = randomBytes(32).toString('hex');
  assert.ok(configuration());
});

test('new public namespace never reads or publishes the password-era private archive', async () => {
  assert.equal(sectionPath('gtm'), 'brief-review/v2/open/sections/gtm.json');
  assert.doesNotMatch(sectionPath('gtm'), /v1/);
  const oldPrivateRecord = {
    version: 1, sectionId: 'gtm', note: null, comments: [], readSeq: { connor: 0, partner: 0 },
  };
  assert.throws(() => validateSection(oldPrivateRecord, 'gtm'),
    (error: unknown) => error instanceof ReviewError && error.code === 'stored_data_invalid');
  const fresh = await readReview(new MemoryStore());
  assert.deepEqual(fresh.sections.gtm, { note: null, comments: [] });
  assert.equal(Object.hasOwn(fresh, 'unreadTotal'), false);
});

test('anonymous GET and named POST share public sections without a session', async () => {
  configure();
  const store = new MemoryStore();
  const handlers = reviewHandlers(() => store);
  const anonymous = await handlers.GET(request('GET', undefined, null));
  assert.equal(anonymous.status, 200);
  assert.equal(anonymous.headers.get('cache-control'), 'no-store');
  assert.equal(anonymous.headers.get('set-cookie'), null);
  const initial = await anonymous.json();
  assert.deepEqual(initial.sections.stones, { note: null, comments: [] });
  assert.equal(Object.hasOwn(initial, 'user'), false);
  const posted = await handlers.POST(request('POST', {
    action: 'comment', sectionId: 'stones', displayName: 'Alex', body: 'Try a lower setting.',
  }));
  assert.equal(posted.status, 200);
  const postedBody = await posted.json();
  assert.equal(postedBody.sectionId, 'stones');
  assert.equal(postedBody.section.comments[0].author, 'Alex');
  const reread = await (await handlers.GET(request())).json();
  assert.equal(reread.sections.stones.comments[0].body, 'Try a lower setting.');
  assert.equal(store.writes, 1);
});

test('cross-origin, missing-origin and invalid writes fail before storage changes', async () => {
  const config = configure();
  const store = new MemoryStore();
  const handlers = reviewHandlers(() => store);
  const body = { action: 'comment', sectionId: 'gtm', displayName: 'Alex', body: 'Hi' };
  const crossOrigin = await handlers.POST(request('POST', body, 'https://other.example'));
  assert.equal(crossOrigin.status, 403);
  const noOrigin = await handlers.POST(request('POST', body, null));
  assert.equal(noOrigin.status, 403);
  assert.throws(() => requireSameOrigin(request('POST', body, 'https://other.example'), config));
  assert.equal(store.reads, 0);
  assert.equal(store.writes, 0);
  const missingName = await handlers.POST(request('POST', { ...body, displayName: undefined }));
  assert.equal(missingName.status, 400);
  assert.deepEqual(await missingName.json(), { error: 'invalid_display_name' });
  const invalidAction = await handlers.POST(request('POST', { ...body, action: 'read' }));
  assert.equal(invalidAction.status, 400);
  assert.equal(store.reads, 0);
  const oversized = await handlers.POST(request('POST', { ...body, body: 'x'.repeat(33000) }));
  assert.equal(oversized.status, 413);
  const multibyteNote = await handlers.POST(request('POST', {
    action: 'note', sectionId: 'gtm', displayName: 'Alex', body: '漢'.repeat(4000), revision: 0,
  }));
  assert.equal(multibyteNote.status, 200);
});

test('named comments append in sequence and read state stays client-local', async () => {
  const store = new MemoryStore();
  await mutateReview(store, parseAction({
    action: 'comment', sectionId: 'stones', displayName: 'Partner', body: 'Try a lower setting.',
  }));
  await mutateReview(store, parseAction({
    action: 'comment', sectionId: 'stones', displayName: 'Connor', body: 'Agreed.',
  }));
  const view = (await readReview(store)).sections.stones;
  assert.deepEqual(view.comments.map(comment => [comment.seq, comment.author]), [
    [1, 'Partner'], [2, 'Connor'],
  ]);
  assert.deepEqual(Object.keys((await store.read('stones')).record).sort(), [
    'comments', 'note', 'sectionId', 'version',
  ]);
});

test('notes clear intentionally and reject stale revisions', async () => {
  const store = new MemoryStore();
  let note = await mutateReview(store, parseAction({
    action: 'note', sectionId: 'gtm', displayName: 'Connor', body: 'Test LA first.', revision: 0,
  }));
  assert.equal(note.note?.revision, 1);
  await assert.rejects(
    mutateReview(store, parseAction({
      action: 'note', sectionId: 'gtm', displayName: 'Partner', body: 'Stale edit', revision: 0,
    })),
    (error: unknown) => error instanceof ReviewError && error.code === 'note_conflict',
  );
  note = await mutateReview(store, parseAction({
    action: 'note', sectionId: 'gtm', displayName: 'Partner', body: '', revision: 1,
  }));
  assert.equal(note.note?.body, '');
  assert.equal(note.note?.revision, 2);
  assert.equal(note.note?.updatedBy, 'Partner');
});

test('simultaneous note edits with the same revision do not overwrite each other', async () => {
  const store = new MemoryStore();
  const attempts = await Promise.allSettled([
    mutateReview(store, parseAction({
      action: 'note', sectionId: 'gtm', displayName: 'Alex', body: 'A', revision: 0,
    })),
    mutateReview(store, parseAction({
      action: 'note', sectionId: 'gtm', displayName: 'Blair', body: 'B', revision: 0,
    })),
  ]);
  assert.equal(attempts.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(attempts.filter(result => result.status === 'rejected').length, 1);
  assert.equal((await store.read('gtm')).record.note?.revision, 1);
});

test('concurrent writes retry compare-and-swap instead of losing comments', async () => {
  const store = new MemoryStore();
  const actionA = parseAction({
    action: 'comment', sectionId: 'review-notes', displayName: 'Alex', body: 'First thought',
  });
  const actionB = parseAction({
    action: 'comment', sectionId: 'review-notes', displayName: 'Blair', body: 'Second thought',
  });
  await Promise.all([mutateReview(store, actionA), mutateReview(store, actionB)]);
  const saved = (await store.read('review-notes')).record;
  assert.equal(saved.comments.length, 2);
  assert.deepEqual(saved.comments.map(comment => comment.seq), [1, 2]);
  assert.ok(store.conflicts >= 1);
});

test('section IDs, names, body bounds and the 500 comment cap are enforced', () => {
  assert.throws(() => parseAction({ action: 'comment', sectionId: 'unknown', displayName: 'Alex', body: 'x' }));
  assert.throws(() => parseAction({ action: 'comment', sectionId: 'gtm', displayName: '', body: 'x' }));
  assert.throws(() => parseAction({ action: 'comment', sectionId: 'gtm', displayName: 'A\nB', body: 'x' }));
  assert.throws(() => parseAction({ action: 'comment', sectionId: 'gtm', displayName: 'x'.repeat(81), body: 'x' }));
  assert.throws(() => parseAction({ action: 'comment', sectionId: 'gtm', displayName: 'Alex', body: '  ' }));
  assert.throws(() => parseAction({ action: 'note', sectionId: 'gtm', displayName: 'Alex', body: 'x'.repeat(4001), revision: 0 }));
  assert.throws(() => parseAction({ action: 'read', sectionId: 'gtm', displayName: 'Alex' }));
  const action = parseAction({
    action: 'comment', sectionId: 'gtm', displayName: 'Alex', body: '<script>alert(1)</script>',
  });
  const initial = blankSection('gtm');
  const next = applyAction(initial, action);
  assert.equal(next.comments[0].body, '<script>alert(1)</script>');
  assert.equal(initial.comments.length, 0);
  const full = blankSection('gtm');
  full.comments = Array.from({ length: 500 }, (_, index) => ({
    id: String(index), seq: index + 1, author: 'Alex', body: 'x', createdAt: new Date().toISOString(),
  }));
  assert.throws(() => applyAction(full, action),
    (error: unknown) => error instanceof ReviewError && error.code === 'comment_limit_reached');
});
