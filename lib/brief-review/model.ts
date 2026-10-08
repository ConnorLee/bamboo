import { randomUUID } from 'node:crypto';

export const SECTION_IDS = ['gtm', 'first-piece', 'your-eye', 'stones', 'ai-generations-packaging', 'together', 'review-notes'] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export type Note = {
  body: string;
  revision: number;
  updatedAt: string;
  updatedBy: string;
};

export type Comment = {
  id: string;
  seq: number;
  author: string;
  body: string;
  createdAt: string;
};

export type SectionRecord = {
  version: 2;
  sectionId: SectionId;
  note: Note | null;
  comments: Comment[];
};

export type SectionView = Pick<SectionRecord, 'note' | 'comments'>;

export type Action =
  | { action: 'comment'; sectionId: SectionId; body: string; displayName: string }
  | { action: 'note'; sectionId: SectionId; body: string; displayName: string; revision: number };

export class ReviewError extends Error {
  constructor(public readonly code: string, public readonly status: number) {
    super(code);
  }
}

export function isSectionId(value: unknown): value is SectionId {
  return typeof value === 'string' && SECTION_IDS.includes(value as SectionId);
}

export function blankSection(sectionId: SectionId): SectionRecord {
  return { version: 2, sectionId, note: null, comments: [] };
}

function validDisplayName(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 1 && value.length <= 80 &&
    value === value.trim() && !/[\u0000-\u001f\u007f]/u.test(value);
}

export function validateSection(value: unknown, sectionId: SectionId): SectionRecord {
  if (!value || typeof value !== 'object') throw new ReviewError('stored_data_invalid', 503);
  const record = value as Partial<SectionRecord>;
  if (record.version !== 2 || record.sectionId !== sectionId || !Array.isArray(record.comments) ||
      record.comments.length > 500) throw new ReviewError('stored_data_invalid', 503);
  if (record.note !== null && (typeof record.note?.body !== 'string' || record.note.body.length > 4000 ||
      !Number.isSafeInteger(record.note.revision) || record.note.revision < 1 ||
      !validDisplayName(record.note.updatedBy) ||
      !Number.isFinite(Date.parse(record.note.updatedAt)))) throw new ReviewError('stored_data_invalid', 503);
  let previous = 0;
  for (const comment of record.comments) {
    if (!comment || typeof comment.id !== 'string' || !Number.isSafeInteger(comment.seq) ||
        comment.seq !== previous + 1 || !validDisplayName(comment.author) ||
        typeof comment.body !== 'string' || comment.body.length < 1 || comment.body.length > 1600 ||
        !Number.isFinite(Date.parse(comment.createdAt))) {
      throw new ReviewError('stored_data_invalid', 503);
    }
    previous = comment.seq;
  }
  return record as SectionRecord;
}

export function parseAction(input: unknown): Action {
  if (!input || typeof input !== 'object') throw new ReviewError('invalid_request', 400);
  const candidate = input as Record<string, unknown>;
  if (!isSectionId(candidate.sectionId)) throw new ReviewError('invalid_section', 400);
  if (candidate.action !== 'comment' && candidate.action !== 'note') throw new ReviewError('invalid_action', 400);
  const displayName = typeof candidate.displayName === 'string' ? candidate.displayName.trim() : '';
  if (!validDisplayName(displayName)) throw new ReviewError('invalid_display_name', 400);
  if (typeof candidate.body !== 'string') throw new ReviewError('invalid_body', 400);
  const body = candidate.body.trim();
  const maximum = candidate.action === 'note' ? 4000 : 1600;
  if ((candidate.action === 'comment' && body.length < 1) || body.length > maximum) {
    throw new ReviewError('invalid_body', 400);
  }
  if (candidate.action === 'comment') return { action: 'comment', sectionId: candidate.sectionId, body, displayName };
  if (!Number.isSafeInteger(candidate.revision) || (candidate.revision as number) < 0) {
    throw new ReviewError('invalid_revision', 400);
  }
  return { action: 'note', sectionId: candidate.sectionId, body, displayName,
    revision: candidate.revision as number };
}

export function sectionView(record: SectionRecord): SectionView {
  return { note: record.note, comments: record.comments };
}

export function applyAction(record: SectionRecord, action: Action, now = new Date()): SectionRecord {
  if (record.sectionId !== action.sectionId) throw new ReviewError('invalid_section', 400);
  if (action.action === 'note') {
    const actualRevision = record.note?.revision ?? 0;
    if (action.revision !== actualRevision) throw new ReviewError('note_conflict', 409);
    return { ...record, note: { body: action.body, revision: actualRevision + 1,
      updatedAt: now.toISOString(), updatedBy: action.displayName } };
  }
  if (record.comments.length >= 500) throw new ReviewError('comment_limit_reached', 409);
  return { ...record, comments: [...record.comments, {
    id: randomUUID(), seq: (record.comments.at(-1)?.seq ?? 0) + 1,
    author: action.displayName, body: action.body, createdAt: now.toISOString(),
  }] };
}
