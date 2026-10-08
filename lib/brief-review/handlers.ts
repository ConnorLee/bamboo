import type { NextRequest } from 'next/server';
import { handle, noStoreJson, readJsonBody, requireConfiguration, requireSameOrigin } from './http';
import { parseAction } from './model';
import { mutateReview, readReview } from './service';
import type { SectionStore } from './store';

export function reviewHandlers(makeStore: (token: string) => SectionStore) {
  return {
    GET: async (_request: NextRequest) => handle(async () => {
      const config = requireConfiguration();
      return noStoreJson(await readReview(makeStore(config.blobToken)));
    }),
    POST: async (request: NextRequest) => handle(async () => {
      const config = requireConfiguration();
      requireSameOrigin(request, config);
      const action = parseAction(await readJsonBody(request));
      const section = await mutateReview(makeStore(config.blobToken), action);
      return noStoreJson({ sectionId: action.sectionId, section });
    }),
  };
}
