import { applyAction, ReviewError, SECTION_IDS, sectionView,
  type Action, type ReviewerId, type SectionId, type SectionView } from './model';
import { StoreConflict, type SectionStore } from './store';

export async function readReview(store: SectionStore, user: ReviewerId): Promise<{
  sections: Record<SectionId, SectionView>;
  unreadTotal: number;
}> {
  const records = await Promise.all(SECTION_IDS.map(sectionId => store.read(sectionId)));
  const sections = Object.fromEntries(records.map(({ record }) => [record.sectionId, sectionView(record, user)])) as Record<SectionId, SectionView>;
  const unreadTotal = SECTION_IDS.reduce((total, id) => total + sections[id].unread, 0);
  return { sections, unreadTotal };
}

export async function mutateReview(store: SectionStore, action: Action, user: ReviewerId): Promise<SectionView> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const { record, etag } = await store.read(action.sectionId);
    const updated = applyAction(record, action, user);
    if (action.action === 'read' && updated.readSeq[user] === record.readSeq[user]) {
      return sectionView(record, user);
    }
    try {
      await store.write(action.sectionId, updated, etag);
      return sectionView(updated, user);
    } catch (error) {
      if (error instanceof StoreConflict) continue;
      throw error;
    }
  }
  throw new ReviewError('write_conflict', 409);
}
