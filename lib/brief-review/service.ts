import { applyAction, ReviewError, SECTION_IDS, sectionView,
  type Action, type SectionId, type SectionView } from './model';
import { StoreConflict, type SectionStore } from './store';

export async function readReview(store: SectionStore): Promise<{
  sections: Record<SectionId, SectionView>;
}> {
  const records = await Promise.all(SECTION_IDS.map(sectionId => store.read(sectionId)));
  const sections = Object.fromEntries(records.map(({ record }) => [record.sectionId, sectionView(record)])) as Record<SectionId, SectionView>;
  return { sections };
}

export async function mutateReview(store: SectionStore, action: Action): Promise<SectionView> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const { record, etag } = await store.read(action.sectionId);
    const updated = applyAction(record, action);
    try {
      await store.write(action.sectionId, updated, etag);
      return sectionView(updated);
    } catch (error) {
      if (error instanceof StoreConflict) continue;
      throw error;
    }
  }
  throw new ReviewError('write_conflict', 409);
}
