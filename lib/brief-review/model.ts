import { randomUUID } from 'node:crypto';

export const SECTION_IDS = ['gtm', 'first-piece', 'your-eye', 'stones', 'ai-generations-packaging', 'together', 'review-notes'] as const;
export type SectionId = (typeof SECTION_IDS)[number];
export type ReviewerId = 'connor' | 'partner';

export type Note = {
  body: string;
  revision: number;
  updatedAt: string;
  updatedBy: ReviewerId;
};

export type Comment = {
  id: string;
  seq: number;
  author: ReviewerId;
  body: string;
  createdAt: string;
};

export type SectionRecord = {
  version: 1;
  sectionId: SectionId;
  note: Note | null;
  comments: Comment[];
  readSeq: Record<ReviewerId, number>;
};

export type SectionView = {
  note: Note | null;
  comments: Comment[];
  unread: number;
};

export type Action =
  | { action: 'comment'; sectionId: SectionId; body: string }
  | { action: 'note'; sectionId: SectionId; body: string; revision: number }
  | { action: 'read'; sectionId: SectionId; throughSeq?: number };

export class ReviewError extends Error {
  constructor(public readonly code: string, public readonly status: number) {
    super(code);
  }
}

export function isSectionId(value: unknown): value is SectionId {
  return typeof value === 'string' && SECTION_IDS.includes(value as SectionId);
}

export function blankSection(sectionId: SectionId): SectionRecord {
  return { version: 1, sectionId, note: null, comments: [], readSeq: { connor: 0, partner: 0 } };
}

export function validateSection(value: unknown, sectionId: SectionId): SectionRecord {
  if (!value || typeof value !== 'object') throw new ReviewError('stored_data_invalid', 503);
  const record = value as Partial<SectionRecord>;
  if (record.version !== 1 || record.sectionId !== sectionId || !Array.isArray(record.comments) ||
      record.comments.length > 500 || !record.readSeq || !Number.isSafeInteger(record.readSeq.connor) ||
      !Number.isSafeInteger(record.readSeq.partner)) throw new ReviewError('stored_data_invalid', 503);
  if (record.note !== null && (typeof record.note?.body !== 'string' ||
      !Number.isSafeInteger(record.note.revision) || record.note.revision < 1 ||
      !['connor', 'partner'].includes(record.note.updatedBy) ||
      !Number.isFinite(Date.parse(record.note.updatedAt)))) throw new ReviewError('stored_data_invalid', 503);
  let previous = 0;
  for (const comment of record.comments) {
    if (!comment || typeof comment.id !== 'string' || !Number.isSafeInteger(comment.seq) ||
        comment.seq !== previous + 1 || !['connor', 'partner'].includes(comment.author) ||
        typeof comment.body !== 'string' || !Number.isFinite(Date.parse(comment.createdAt))) {
      throw new ReviewError('stored_data_invalid', 503);
    }
    previous = comment.seq;
  }
  if (record.readSeq.connor < 0 || record.readSeq.partner < 0 ||
      record.readSeq.connor > previous || record.readSeq.partner > previous) {
    throw new ReviewError('stored_data_invalid', 503);
  }
  return record as SectionRecord;
}

export function parseAction(input: unknown): Action {
  if (!input || typeof input !== 'object') throw new ReviewError('invalid_request', 400);
  const candidate = input as Record<string, unknown>;
  if (!isSectionId(candidate.sectionId)) throw new ReviewError('invalid_section', 400);
  if (candidate.action === 'read') {
    if (candidate.throughSeq === undefined) return { action: 'read', sectionId: candidate.sectionId };
    if (!Number.isSafeInteger(candidate.throughSeq) || (candidate.throughSeq as number) < 0) {
      throw new ReviewError('invalid_read_cursor', 400);
    }
    return { action: 'read', sectionId: candidate.sectionId, throughSeq: candidate.throughSeq as number };
  }
  if (candidate.action !== 'comment' && candidate.action !== 'note') throw new ReviewError('invalid_action', 400);
  if (typeof candidate.body !== 'string') throw new ReviewError('invalid_body', 400);
  const body = candidate.body.trim();
  const maximum = candidate.action === 'note' ? 4000 : 1600;
  if ((candidate.action === 'comment' && body.length < 1) || body.length > maximum) {
    throw new ReviewError('invalid_body', 400);
  }
  if (candidate.action === 'comment') return { action: 'comment', sectionId: candidate.sectionId, body };
  if (!Number.isSafeInteger(candidate.revision) || (candidate.revision as number) < 0) {
    throw new ReviewError('invalid_revision', 400);
  }
  return { action: 'note', sectionId: candidate.sectionId, body, revision: candidate.revision as number };
}

export function sectionView(record: SectionRecord, viewer: ReviewerId): SectionView {
  return {
    note: record.note,
    comments: record.comments,
    unread: record.comments.filter(comment => comment.author !== viewer && comment.seq > record.readSeq[viewer]).length,
  };
}

export function applyAction(record: SectionRecord, action: Action, viewer: ReviewerId, now = new Date()): SectionRecord {
  if (record.sectionId !== action.sectionId) throw new ReviewError('invalid_section', 400);
  if (action.action === 'read') {
    const latest = record.comments.at(-1)?.seq ?? 0;
    const through = Math.min(action.throughSeq ?? latest, latest);
    return { ...record, readSeq: { ...record.readSeq, [viewer]: Math.max(record.readSeq[viewer], through) } };
  }
  if (action.action === 'note') {
    const actualRevision = record.note?.revision ?? 0;
    if (action.revision !== actualRevision) throw new ReviewError('note_conflict', 409);
    return { ...record, note: { body: action.body, revision: actualRevision + 1, updatedAt: now.toISOString(), updatedBy: viewer } };
  }
  if (record.comments.length >= 500) throw new ReviewError('comment_limit_reached', 409);
  return { ...record, comments: [...record.comments, {
    id: randomUUID(), seq: (record.comments.at(-1)?.seq ?? 0) + 1,
    author: viewer, body: action.body, createdAt: now.toISOString(),
  }] };
}
