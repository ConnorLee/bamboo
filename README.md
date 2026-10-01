# Halo website

This repository deploys to the Vercel project `v0-scrapapp-mpjxkfyicbn` in `connorlees-projects`, from `main`. Production is https://www.habithalo.app.

## Editing and running

```sh
pnpm install --frozen-lockfile
pnpm dev
# after changing a file in website/ while the server is running:
pnpm website:build

pnpm build
pnpm start
```

`website/` is the editable source for the current Halo marketing experience, imported from the September 29 Halo site. It preserves Aeonik Pro, the supplied sculptural logo, light/dark themes, the selected B design’s mineral artwork and original stone-lift scroll interaction. The main homepage opens with a minimalist black support-system hero inspired by the original About page: the supplied Halo mark, two existing app screens, and a Coming soon CTA that opens the waitlist. Normal scrolling carries the screens past the copy and leads straight into the monthly milestone introduction and interactive bracelet, followed by the mineral collection, app gallery, and closing. The separate “Time, made tangible” bracelet hero is intentionally omitted from the main page to avoid repeating the wearable. `website/hero.js` owns only this opening and its navigation contrast; reduced motion keeps the composition static. The black opening is a fixed presentation surface; subsequent sections honor the saved light/dark preference. The build normalizes asset URLs into `public/halo-site/`. That output is generated and ignored by Git.

Next.js rewrites `/`, `/how-it-works`, and `/original` to these complete static documents before filesystem routes run. This preserves the approved design without loading the legacy React landing page's global styling, marquee, or client bundle. Existing `/demo`, `/contact`, `/about`, `/old`, and `/api/subscribe` routes remain available. The original pre-September-29 homepage now lives at `/about`, rendered from `components/legacy-homepage.tsx`; `app/page.tsx` shares it only as a historical fallback. The About route preserves its floating app screens, animated logo, facts toggle, marquee and waitlist. Its home logo uses full-document navigation to cross back to the static B landing. Edit `website/index.html` for the homepage.

`website/original/` preserves candidate B exactly and supplies the homepage’s shared styles and image assets. The root imports those styles instead of duplicating them. `/original` remains a historical design archive with its earlier schedule.

The homepage’s seven material studies are selected examples from months 1, 2, 3, 4, 5, 9 and 12, mapped through `website/milestones.js` to the canonical catalog. Asset numbers are historical render IDs, never eligibility thresholds. The homepage uses accumulating native bracelet renders and existing app artwork. Keep the newer Halo I hardware explorer and drawer interaction on their separate pages. The requested Year One packaging section is a centered editorial addition after the mineral collection, using the existing twelve-month catalog. The former `halo-i-sections.*` source is retained but is not loaded or inserted into the homepage. The Stone Module story remains a labeled engineering study within the existing pinned journey; its NFC layers, loose-stone activation and installation mechanism are exploratory, not requirements of the $189 collection. Additional physical concept details remain on separate pages. Preserve B’s visual language when updating content.

## Year One packaging

The homepage presents the twelve-compartment case beneath a large centered “12 months. 12 stones.” headline. Matched ivory and charcoal packaging concepts follow the site's existing light/dark preference, including its manual toggle. Both show the same two-by-six arrangement with each box's mineral artwork and labels matching `website/halo-i-catalog.js`. Transparent cutouts let the complete case sit naturally on each page background. These are generated packaging concepts, not manufacturing qualification or additional finish SKUs; their prompts and derivation are in `docs/year-one-packaging-cutout-prompts.json`. The stone list remains an accessible native disclosure sourced from the shared catalog, with no parallel schedule or eligibility logic.

## Motion

Main-page polish lives in `website/motion.js`, `hero.js`, and the root `style.css`; the archived variants retain their earlier motion. Hero children enter with a short stagger, below-fold headings and galleries reveal once, and reserved image frames fade in after decoding. Content remains visible without JavaScript. Keyboard input, reduced motion, print, and restored pages skip pending reveals; links keep native scrolling and browser history behavior. Milestone previews use a decoded-image cache and request ordering so a slow image cannot overwrite a newer selection. Failed previews retain the last valid image and its matching caption. The progress line uses a transform, and scene dimensions are measured on layout changes rather than every scroll frame.

## Product source of truth

`website/halo-i-catalog.js` owns the twelve proposed monthly stones, chapters, colors, reveal messages and evolution descriptions. The how-it-works adapter and companion geometry consume this shared catalog. `public/halo-i/` contains optimized Blender renders, transparent bracelet states, packaging studies and current app captures. Only the renders needed by the site are included; editable Blender sources remain in the Halo product workspace under `output/halo-v1-system`.

- **Halo — First Year Collection: $189 target retail, always below $200.** One offer includes a Halo bracelet, twelve natural milestone stones with individual presentation, the Halo iPhone app, a digital milestone collection and companion maturation throughout the first year. No launch finish variants.
- **Coming soon, with a waitlist for launch updates.** The retained reservation service models a refundable $25 credit toward $189 but is not connected to the current landing-page UI. Halo remains in pre-production; engineering, material appearance and presentation may evolve, and no shipping date is guaranteed.
- The shared catalog begins with Moonstone on Day 1 and progresses through the first year. Follow its current timing labels rather than historic render IDs. Natural opal remains a proposed final stone pending sourcing and durability qualification.
- Earned history persists independently of current streaks. The authenticated app owns eligibility; a physical tag cannot prove elapsed progress. Website controls remain previews and never award a milestone.
- NFC is an open manufacturing decision: all twelve stones, selected milestones, one bracelet tag, or none. The provisional cost baseline is no NFC, with digital verification in Halo. Prior drawings and animation layers preserve exploration, not a committed bill of materials.
- Meaningful differentiation is real materials, an accumulating bracelet, individual monthly presentation and an enduring companion. Complex retention, hidden electronics, excessive packaging and multiple SKUs must earn their place inside an $85 maximum landed product cost.

See [the First Year economics and NFC decision brief](docs/first-year-economics.md). Its $80 planning budget is a design target, not a supplier quote or confirmed margin. Existing manufacturing quote inputs remain unknown until sourced evidence is entered.

## Retained reservation service

The public homepage and how-it-works page show **Coming soon → waitlist**. Neither loads `website/reservation.js`. Committing the already-deployed reservation backend and its dependencies keeps future Git deployments consistent with the live service; it does not activate checkout or change its configuration.

The retained service fixes a reservation at $25 USD. PostgreSQL stores reservations and a deduplicated webhook ledger; a verified Stripe webhook is required for paid confirmation. Its dormant browser client supports Stripe Express Checkout Element and Payment Element, with optional preferences, receipts and refunds after confirmation. Payment data remains with Stripe.

[Reservation operations](docs/reservations-operations.md) covers configuration, schema setup, webhook delivery, receipts, refunds, measurement and launch checks. Any future activation requires an explicit launch decision, provider configuration, durable PostgreSQL, sandbox and real-device validation, and a separate UI change. New reservations remain disabled unless configuration is valid and `HALO_RESERVATIONS_ENABLED=true`.

The waitlist retains the existing `/api/subscribe` Mailchimp flow. Optional reservation analytics failures do not block a successful signup. Payment never silently subscribes anyone to marketing.

## Release records and Git deployments

[Notice and provenance documentation](docs/ip-provenance.md) describes production receipts and intentional local snapshots. The Vercel ignored-build command skips only release-record JSON changes since the previous successful deployment. Source changes and unavailable history always build. Run `pnpm test:deployment` for this boundary and `pnpm test:reservations` for the retained service, waitlist boundary and dormant client tests.

## Landing page variants

`/variants` is the comparison page. The main site builds on B with its new minimalist opening. `/variants/b` preserves the previous six-section B page from commit `f52da45`, independently of future main-page changes. The alternatives live in isolated snapshots under `website/variants/`:

| URL | Design | Preserved source |
| --- | --- | --- |
| `/variants/a` | A support system. For your progress. | September 29, 11:36 refinement (`deab38c`) |
| `/variants/b` | Time, made tangible. | Frozen minimal B (`f52da45`); no new opening or added Halo I sections |
| `/variants/c` | You meet them once. Then you grow together. | Companion page from the same 11:36 refinement |
| `/variants/d` | A year, made visible. | Separate ivory-and-sage `halo-i-system` concept |

A and C intentionally retain the earlier single-stone imagery and material palette as design studies. Unconfirmed historical price/shipping offers have been removed. D retains its read-only ritual prototype. All signup CTAs lead to the existing waitlist; these controls never grant progress or activate a real stone. Variants and comparison are `noindex`.

The build normalizes HTML and image URLs for extensionless routes; D's JSON requests use explicit public paths. A shares the frozen C companion catalog and geometry. Only runtime assets are packaged—no workstation paths, production credentials or manufacturer documents. Keep each snapshot's visual identity independent from future main-site changes.

These URLs enable manual review and direct-traffic comparisons. Automatic visitor allocation, exposure/conversion analytics and statistical reporting are not configured by this change. `variant=a/c/d` query parameters on signup links identify the entry path, but the existing subscription API still records email only.

## Validation

`pnpm build` now includes TypeScript validation. Next.js is patched to 15.5.24; the legacy lint bypass remains until an ESLint setup is adopted. Local production-browser checks cover all three marketing routes, desktop/mobile layouts, theme persistence, selected monthly material studies, all twelve drawer reveals, evolution previews, keyboard controls, reduced motion and image loading. These checks validate the website, not the unimplemented NFC service or manufactured jewelry.

The native Swift app lives separately in `ConnorLee/habithalo`; it must not be deployed as a Next.js website.
