import type { NextRequest } from 'next/server';
import { handle, privateJson, readJsonBody, requireConfiguration,
  requireSameOrigin, reviewer, sessionFromRequest } from '@/lib/brief-review/auth';
import { parseAction } from '@/lib/brief-review/model';
import { mutateReview, readReview } from '@/lib/brief-review/service';
import { BlobSectionStore } from '@/lib/brief-review/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handle(async () => {
    const config = requireConfiguration();
    const id = sessionFromRequest(request, config);
    const data = await readReview(new BlobSectionStore(config.blobToken), id);
    return privateJson({ user: reviewer(id), ...data });
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    const config = requireConfiguration();
    requireSameOrigin(request, config);
    const id = sessionFromRequest(request, config);
    const action = parseAction(await readJsonBody(request));
    const section = await mutateReview(new BlobSectionStore(config.blobToken), action, id);
    return privateJson({ sectionId: action.sectionId, section });
  });
}
