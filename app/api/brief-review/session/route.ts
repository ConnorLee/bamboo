import type { NextRequest } from 'next/server';
import { clearSessionCookie, configuration, COOKIE, handle, privateJson, readJsonBody,
  requireConfiguration, requireSameOrigin, reviewer, setSessionCookie,
  verifyAccessCode, verifySession } from '@/lib/brief-review/auth';
import { ReviewError } from '@/lib/brief-review/model';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handle(async () => {
    const config = configuration();
    if (!config) return privateJson({ available: false, user: null });
    const id = verifySession(request.cookies.get(COOKIE)?.value, config);
    return privateJson({ available: true, user: id ? reviewer(id) : null });
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    const config = requireConfiguration();
    requireSameOrigin(request, config);
    const body = await readJsonBody(request);
    const code = body && typeof body === 'object' ? (body as Record<string, unknown>).code : null;
    const id = verifyAccessCode(code, config);
    if (!id) throw new ReviewError('invalid_access_code', 401);
    const response = privateJson({ available: true, user: reviewer(id) });
    setSessionCookie(response, id, config);
    return response;
  });
}

export async function DELETE(request: NextRequest) {
  return handle(async () => {
    const config = requireConfiguration();
    requireSameOrigin(request, config);
    const response = privateJson({ available: true, user: null });
    clearSessionCookie(response, config);
    return response;
  });
}
