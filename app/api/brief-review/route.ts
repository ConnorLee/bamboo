import { reviewHandlers } from '@/lib/brief-review/handlers';
import { BlobSectionStore } from '@/lib/brief-review/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const handlers = reviewHandlers(token => new BlobSectionStore(token));
export const GET = handlers.GET;
export const POST = handlers.POST;
