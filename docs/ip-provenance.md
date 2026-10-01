# Halo notice and release provenance

This system records actual observations and public artifact hashes. It does not create patent rights or patentability, establish authorship, prove an earliest disclosure, or supply an independently trusted timestamp. Git dates and self-generated timestamps are not independent publication evidence. Never backdate a record or edit an old record to describe a new release.

## Notice and patent information

`config/ip.json` is the only patent-status control. Its current `PATENT_STATUS` is `none`; no filing or grant has been verified. The landing page, how-it-works page, and `/patents` show `© 2026 Halo. All rights reserved.` The new route is intentionally absent from primary navigation.

- `none`: copyright only.
- `pending`: adds “Patent pending.” Change only after a filing is actually confirmed.
- `issued`: adds the discreet “Patents” link. Change only after a grant is verified and the relevant product mapping reviewed.

Do not place private drafts or unapproved application details in this repository config. Each future entry requires `approved_for_publication: true`, `product_or_technology`, `status` (`pending` or `issued`), and a factual `description`. Optional approved fields: `application_number`, `patent_number`, `jurisdiction`, `filing_date`, `grant_date`. Dates should use ISO `YYYY-MM-DD`. Publication approval must be obtained before adding those details. A configuration flag is an editorial control, not a verification of legal status. A patent professional should review any future virtual-marking entry and its product relationship.

Run `pnpm website:build` after a config change. The generated public pages use the configured state; editable file previews carry the safe default notice. `/patents` currently shows only the requested placeholder and the existing business email, `hello@habithalo.com`, for IP, licensing, or rights inquiries.

## Production records

`pnpm build` runs the existing static-site build and Next build. Only after success does it create an append-only `provenance/releases/<actual-UTC>-<UUID>.json` record. Vercel previews do not generate production records. The build record contains:

- Actual UTC generation time, application version, source commit/branch when available, dirty-tree state, and a build/deployment identifier.
- Canonical domain and a unique Vercel deployment origin when supplied by the platform.
- SHA-256 hashes and byte counts for the selected public HTML, CSS, JavaScript, video, and a product imagery manifest containing individual image and video hashes.
- Key surface mappings and an embedded copy/hash of the versioned product-concept manifest.

The complete product imagery manifest is retained inside the local build record and the collected deployment record, so subsequent public-file replacements do not erase the image/video hash inventory for earlier releases. MP4 and WebM files in the selected public asset directories are also direct verification artifacts; each must remain within the collector's 20 MB response limit.

Only explicit metadata fields are read. Missing Git/deployment values stay `null`; a generated local build UUID is labeled `local-…`. No environment dump, credentials, personal workstation hostname, private source files, or user records are captured. Dirty builds are identified as such; the commit SHA alone is never represented as their complete byte identity.

A sanitized current receipt is served at `/halo-site/release-provenance.json`. It contains public artifact paths/hashes, commit SHA, version, domain, build ID, and the concept manifest. Branch names are omitted from this public copy. The full local build record keeps the branch. The receipt is a current build receipt, **not an archive of old pages**, and says publication is unverified until separately observed.

### Normal deployment

```sh
pnpm deploy:production
```

This uses the already linked Vercel project, submits explicit Git context, waits for Vercel success, and verifies the resulting public build receipt against the deployed text and video artifacts, imagery-manifest bytes, and the three routed pages. If the unique Vercel URL requires authentication, it checks the public production alias instead, but only when that receipt identifies the exact expected deployment. Image bytes are hashed at build time; the collector does not re-download every image. Video bytes are fetched and verified against their build hashes. Only verified HTTP responses create a `production_deployment_observed` record. Keep that newly generated record in Git:

```sh
git add provenance/releases/<new-record>.json
git commit -m "Record observed Halo production release"
git push
```

The archival commit follows the deployed source commit; do **not** redeploy solely to make the archive commit become the source SHA. `VERCEL_CLI` can select an installed Vercel binary. A collection failure leaves a private `archives/deployment-recovery.json` containing the deployment URL and Git context, so the observation can be retried without pretending it succeeded earlier.

### Archival commits and Git builds

`vercel.json` sets `ignoreCommand` to `node scripts/vercel-ignore-build.mjs`. It skips a Git build only when the nonempty diff from `VERCEL_GIT_PREVIOUS_SHA` to the current commit contains exclusively `provenance/releases/*.json` files. The previous SHA is Vercel's last successful deployment for this project and branch, not simply the parent commit. A push containing a source change followed by an archival commit therefore still builds. Product-concept manifests, build scripts, config, page and asset changes all build normally.

Missing metadata, unavailable shallow history, unrelated history, dirty tracked source, a mismatched HEAD, or no changes all continue the build. Vercel removes upload-excluded files before the guard runs; only unstaged deletions of tracked files matched by the unchanged `.vercelignore` are allowed. The current rules use Git-compatible patterns, read through `git ls-files --cached --ignored --exclude-from=.vercelignore`; modified files, staged changes and changed exclusion rules still build. Manual deployment uploads without Git history also build. The guard does not edit records, timestamps, Git history or platform settings. Its exit codes follow Vercel's convention: `0` skips and `1` builds. Vercel marks a skipped build canceled; it still counts toward deployment quotas. An archival commit need not become the source SHA served by the production alias.

`pnpm test:deployment` verifies this boundary, including multi-commit pushes and a source file renamed into the release directory. See Vercel's [ignoreCommand reference](https://vercel.com/docs/project-configuration/vercel-json#ignorecommand), [previous deployment SHA](https://vercel.com/docs/environment-variables/system-environment-variables#vercel_git_previous_sha) and [ignored build behavior](https://vercel.com/docs/project-configuration/project-settings#ignored-build-step).

For a deployment made outside the normal command:

```sh
node scripts/deploy-production.mjs --collect https://verified-public-deployment-origin
```

This records the actual collection time, retains the original build time, and leaves the private source branch unknown rather than inferring it from the current checkout. A protected deployment URL will fail closed; use its public production origin after confirming it serves that build. No bypass token is written to a record.

Vercel build filesystems are ephemeral. Every successful production build emits a receipt, but **durable Git retention requires collecting and committing the release record**. Use the normal command and the archival commit above for each release. Out-of-band deployments need the collection command; there is intentionally no new repository-write credential or automatic history-writing service. Build records are not proof a deployment went live. Deployment observations establish only the bytes observed at that time.

## Intentional local public-version snapshots

```sh
pnpm snapshot:public --url https://www.habithalo.app
```

This command is opt-in; neither build nor deployment runs it. It requires an existing Playwright installation/Chromium; `PLAYWRIGHT_MODULE_PATH` can point at an installed module. It creates a fresh browser context, never your signed-in browser profile. See the script's usage for the precise fixed page allowlist and capture bounds. It records actual capture times, rendered HTML, response HTML, title/metadata, page/section screenshots, captured public assets, and SHA-256 hashes. Local Git context and a remote build receipt are recorded separately. Missing assets or capture failures remain explicit; a snapshot is not represented as a fully functioning offline copy.

Snapshots use reduced motion and do not archive movie bytes. If a future page includes video, its URLs remain in the captured HTML and release records retain its verified hashes; the local snapshot is not a movie archive.

Archives live under `archives/public-versions/`, are Git-ignored, and are excluded from Vercel uploads. Never move them into `public/` or `website/`. Do not commit or publish archived pages without a separate explicit decision. There is no date override and no historical reconstruction mode. Keep independent backups if long-term custody matters; local files can be lost.

## Product-concept observations

`provenance/product-concepts.json` records nine requested concepts, presence, current sections, scope (marketing, saved study, or demo), and earliest reviewed repository evidence. `first_known_release` is a repository commit observation, **not** a verified historical deployment or a claim of earliest public disclosure outside this repository. False means no supporting public evidence found in the audit, not a claim the idea never existed. Update the version and review fields when public concepts change. Every production receipt embeds that manifest so later edits do not rewrite old observations.

## Validation and scope

`pnpm test:provenance` checks the notice states, publication gating, escaping, metadata minimization, timestamp/hash behavior, mismatch rejection, and snapshot safety boundaries. No old commits, timestamps, deployments, saved studies, or asset manifests are rewritten. Existing publicly routed concept variants remain as they were; `noindex` is not access control. New private archives are separate from those already public studies.
