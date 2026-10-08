import { BlobPreconditionFailedError, get, put } from '@vercel/blob';
import { blankSection, ReviewError, validateSection, type SectionId, type SectionRecord } from './model';

const MAX_STORED_BYTES = 1_500_000;

export type LoadedSection = { record: SectionRecord; etag: string | null };

export interface SectionStore {
  read(sectionId: SectionId): Promise<LoadedSection>;
  write(sectionId: SectionId, record: SectionRecord, etag: string | null): Promise<void>;
}

export class StoreConflict extends Error {
  constructor() { super('store_conflict'); }
}

async function readStoredText(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_STORED_BYTES) {
      await reader.cancel();
      throw new ReviewError('stored_data_invalid', 503);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export function sectionPath(sectionId: SectionId) {
  return `brief-review/v2/open/sections/${sectionId}.json`;
}

export class BlobSectionStore implements SectionStore {
  constructor(private readonly token: string) {}

  async read(sectionId: SectionId): Promise<LoadedSection> {
    // A cached read can return a stale version after an overwrite. This must be
    // fresh because every write uses the returned ETag for compare-and-swap.
    const result = await get(sectionPath(sectionId), { access: 'private', useCache: false, token: this.token });
    if (!result) return { record: blankSection(sectionId), etag: null };
    if (result.statusCode !== 200 || !result.stream ||
        (result.blob.size !== null && result.blob.size > MAX_STORED_BYTES)) {
      throw new ReviewError('stored_data_invalid', 503);
    }
    const text = await readStoredText(result.stream);
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { throw new ReviewError('stored_data_invalid', 503); }
    return { record: validateSection(parsed, sectionId), etag: result.blob.etag };
  }

  async write(sectionId: SectionId, record: SectionRecord, etag: string | null): Promise<void> {
    const body = JSON.stringify(record);
    if (Buffer.byteLength(body) > MAX_STORED_BYTES) throw new ReviewError('comment_limit_reached', 409);
    try {
      await put(sectionPath(sectionId), body, {
        access: 'private', token: this.token, contentType: 'application/json',
        cacheControlMaxAge: 60,
        ...(etag ? { allowOverwrite: true, ifMatch: etag } : { allowOverwrite: false }),
      });
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError) throw new StoreConflict();
      if (!etag) {
        // Initial creation may race. Only treat it as a conflict if another
        // writer actually created the section; preserve other storage errors.
        const current = await this.read(sectionId);
        if (current.etag) throw new StoreConflict();
      }
      throw error;
    }
  }
}
