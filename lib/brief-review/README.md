# Private `/brief` review service

This is a separate two-person review service for section notes, comments and unread counts. The public `/brief` page remains readable without authentication. Review data is returned only by authenticated API routes, stored in a **private** Vercel Blob store, and never embedded in static HTML. This is private server storage, not end-to-end encryption.

The service fails closed until the four review settings and a private Blob token are configured:

| Variable | Purpose |
| --- | --- |
| `BRIEF_REVIEW_ORIGIN` | Exact site origin, such as `https://www.habithalo.app`; used to reject cross-origin writes. |
| `BRIEF_REVIEW_ACCESS_CONNOR_SHA256` | SHA-256 hex digest of Connor's unique random access code. |
| `BRIEF_REVIEW_ACCESS_PARTNER_SHA256` | SHA-256 hex digest of the partner's different random access code. |
| `BRIEF_REVIEW_SESSION_SECRET` | At least 32 random bytes encoded as hex for signing HttpOnly session cookies. |
| `BLOB_READ_WRITE_TOKEN` | Server-only token injected when a dedicated private Vercel Blob store is connected. `BRIEF_REVIEW_BLOB_READ_WRITE_TOKEN` may be used instead if the token is managed separately. |

Generate each access code with a cryptographically secure random generator (for example, `openssl rand -hex 24`), calculate its digest without writing the code to the repository, and share each code privately with its intended reviewer. Never put a code, digest, Blob token or session secret in client JavaScript, a public environment variable, a URL, or Git. Rotating a person's configured digest revokes that person's existing sessions. Rotating the session secret revokes all sessions. No store or secrets are provisioned by this code.

`GET /api/brief-review/session` returns `{available,user}`. `POST` accepts `{code}` and creates a signed, HttpOnly, SameSite=Strict, 30-day cookie; `DELETE` signs out. `GET /api/brief-review` returns shared sections and unread counts. `POST /api/brief-review` accepts `{action:'comment'|'note'|'read',sectionId,body?,revision?,throughSeq?}` and returns `{sectionId,section}`. Allowed section IDs are in `model.ts`. An empty note body intentionally clears it while incrementing its revision. Sending an old note revision returns `409 note_conflict`; clients should refresh and show both versions rather than silently overwriting.

Read cursors are stored per reviewer and section. A `read` action should include `throughSeq`, the highest comment sequence actually displayed, so a concurrent new comment remains unread. Unread counts include only the other reviewer's comments after that cursor. Polling the authenticated GET route updates badges; no push notifications are implemented.

Each section uses one versioned Blob. The server bypasses the Blob CDN cache on reads and uses ETag conditional writes to avoid losing simultaneous comments. Comments are append-only through this API and limited to 500 per section; there is no delete or moderation UI. All content is plain text: the browser must render note and comment bodies with `textContent`, not `innerHTML`. The API uses `Cache-Control: private, no-store` and returns no Blob URL or token. Test with `pnpm test:brief-review`.
