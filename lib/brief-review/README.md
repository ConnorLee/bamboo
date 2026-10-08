# Open `/brief` review service

`GET /api/brief-review` is public and returns `{sections}`. Each section has a `note` and `comments`; it does not include reviewer identities or server read state. `POST /api/brief-review` accepts `{action:'comment'|'note',sectionId,body,displayName,revision?}` and returns `{sectionId,section}`. The name is required plain text and is **not verified**. A note may use an empty body to clear its text while incrementing its revision. A stale revision returns `409 note_conflict`; the client should refresh before retrying.

Only these server-side settings are required:

| Variable | Purpose |
| --- | --- |
| `BRIEF_REVIEW_ORIGIN` | Exact site origin, such as `https://www.habithalo.app`; rejects cross-origin writes. |
| `BLOB_READ_WRITE_TOKEN` | Server-only token for the connected Vercel Blob store. `BRIEF_REVIEW_BLOB_READ_WRITE_TOKEN` may be used instead when managed separately. Never expose either in client code, URLs, public environment variables, or Git. |

The API requires the exact `Origin` header for writes and rejects requests marked cross-site. This is a browser write guard, not user authentication: anyone who can visit the page may read review content and submit a name. Do not put sensitive information in new comments or notes. Password-era review data remains in `brief-review/v1/sections/*` and is never loaded, migrated, or published by this API. New review content uses `brief-review/v2/open/sections/*`. Keep the v1 archive private.

Each section uses one versioned Blob. Fresh reads and ETag conditional writes preserve simultaneous comments and detect conflicting note edits. Comments are append-only through this API and limited to 500 per section. Display names are at most 80 characters, comments 1,600 characters, notes 4,000 characters, and JSON requests 32 KiB. The API returns `Cache-Control: no-store` and no Blob URL or token. The browser should render all names and bodies as plain text. Unread indicators, if shown, are calculated and stored locally in that browser; there is no server read cursor or notification service.

Run `pnpm test:brief-review` to verify the review model, handlers, namespace isolation, and concurrent writes.
