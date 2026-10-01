# Halo manufacturing workspace

Internal reference route: `https://www.habithalo.app/manufacture` (Next.js rewrites the extensionless route; a trailing slash redirects to this canonical path).

This is an additive route in the existing Halo static site. It shares the bundled Aeonik Pro typography, brand lockup, palette and theme preference. It requires no backend or framework. It publishes from the Bamboo project to Vercel; public product pages are unchanged by this hardware specification update.

## Source files

- `content.html`: all 16 reference sections, outreach text, engineering sources and checklist keys.
- `page.html`: workspace shell, navigation slot, critical unknown and development context.
- `workspace-data.js`: CAD dimensions, test protocol fields, requirement revision and RF/quote/decision tracker schemas.
- `manufacture.js`: local persistence, editable controls, CSV/JSON export, import and rendering.
- `cost-model.js`: dependency-free monetary calculations, shared with Node tests.
- `manufacture.css`: responsive styling, theme and print styles.
- `reference-bracelets.png`: user-supplied third-party form/closure reference, not a Halo prototype.
- `latest-design-reference.png`: user-supplied bracelet/packaging concept (30 September 2026). H2 written requirements take precedence over unvalidated render details.
- `packaging-reference-02.png`: additional 2 × 6 collection study, with unverified 280 × 160 × 45 mm outer and 60 × 60 × 45 mm individual-box annotations.
- `hardware-architecture.svg`: symbolic Light/Dark × Month 01/12 occupancy, shared rigid upper chassis and current-center requirement; not scaled CAD.
- `clasp-sizing.svg`: three unselected underside mechanism volumes and the provisional two-size strategy; not released engineering.
- `../scripts/build-manufacture.mjs`: generates the route during the existing website build. Only runtime files enter `../public/halo-site/manufacture/`; templates and this README remain outside public output.

From `/Users/connor/Desktop/halo/bamboo` (Vercel project `v0-scrapapp-mpjxkfyicbn`):

```sh
pnpm website:build
pnpm build
pnpm start --port 61022
```

Open `http://127.0.0.1:61022/manufacture`. The existing website builder owns the generated directory and normalizes HTML asset paths to `/halo-site/`. Re-run it after editing manufacturing source. Bamboo/Vercel is the deployment target; do not publish the former ChatGPT Sites checkout for this route. Keep stable IDs for unchanged meanings. Use new IDs when acceptance criteria change; retain historical keys in backups.

## Editing and persistence

Fifty-four bracelet/packaging CAD values, reviewed flags, gate/lab/action checklists, 19 protocol fields, RF results (24 columns), supplier quotes (26 columns), decisions (7 columns), costs and retail inputs are editable. Tables begin with three blank rows and allow added rows. Reference prose and outreach questions are static source content, with copy controls for outreach. Older version-1 backups remain compatible: newly added dimensions and BOM lines migrate to unknown values rather than zero, preserving existing records.

Edits save under `halo-manufacture-workspace-v1` in browser localStorage. They are not written into source files, shared, synced, or sent to suppliers. Export JSON to back up the whole workspace; import replaces current values after schema validation. RF, supplier and decision trackers also export CSV with spreadsheet formula protection. Changing port or hostname starts a different workspace; import a backup to transfer it.

Storage errors are visible. Corrupt saved data is preserved instead of automatically overwritten. A change from another tab pauses saving to prevent stale writes: export unsaved work, then reload. Browser storage limits vary; JSON export still works from an open session when saving fails. No values are seeded from test fixtures or invented supplier quotes.

## Cost definitions

Four alternative total-program scenarios: 25, 100, 500 and 1,000 saleable kits, with 24 unit-cost lines. Light and Dark share geometry, two chassis-size options, mechanisms and packaging dielines. Shared unit prices must reflect the quoted S/M + M/L size mix; equal costs or pooled minimum orders are not assumed. Each kit budgets one bracelet, 12 interfaces and removable stone modules, 12 milestone boxes and cards, and one presentation system with bracelet accommodation. The legacy 12-piece filler supply allowance remains a provisional starting/spare assumption; Month 01 shows 11 installed blanks. Confirm the final supplied quantity before quoting.

Shared one-time tooling is stored once, with scope/evidence, and divided by the selected total program quantity for a separately displayed amortized landed cost. Sampling/development remains in the quote tracker. Light uses common preparation/natural steel finishing; Dark adds incremental PVD and charcoal-packaging premiums. Shared brushing is never removed or counted twice. Extra Dark rework/scrap belongs in its documented premium.

Finish quantities must be whole numbers adding to the selected batch. Enter explicit usable-yield assumptions for each nonzero finish: estimated starts = ceiling(saleable quantity / usable-yield fraction). This plans quantities only; it does not multiply finished-unit quote prices or duplicate monetary scrap. Blank yield leaves the production-start plan incomplete; zero or greater than 100% is invalid. Mixed-batch spend adds tooling once.

- COGS: chassis, clasp/adjustment, machining/preparation, 12 interfaces and complete module sets, module/final assembly, engraving, packaging, QC and monetary scrap/replacement allowance; plus applicable Dark premiums.
- Landed: COGS + inbound freight + duties/import.
- Gross margin: `(tax-exclusive retail − variable landed cost) / retail`; excludes one-time tooling, displayed separately.
- Contribution: gross profit − fulfillment − estimated payment fees.

Payment fees, scrap and duties are currency amounts, not rates. Payment fees are a fixed estimate across retail options; update them for percentage-based fee comparisons. Currency selection changes the label and never converts amounts. Blank or invalid dependencies produce “Incomplete”; explicit zero is allowed for costs included elsewhere. Retail prices start blank. Quotes do not automatically populate the BOM because currencies and inclusions may differ.

## H2 direction and evidence

- One program: Light brushed natural 316L/ivory packaging and Dark brushed black 316L (PVD preferred)/charcoal packaging. Geometry, dimensions, stone system, clasp/sizing, packaging dielines, typography, graphics, inserts, cards and stone order are identical. These are cosmetic finishes, not gendered products.
- The rigid visible upper/front approximately two-thirds contains all 12 positions. Ordinary adjustment belongs at the concealed underside clasp. S/M + M/L chassis and approximately 15–20 mm fine travel are working targets; no wrist coverage is validated. Established telescoping/sliding/micro-adjust candidates remain unselected.
- The current milestone must occupy the physical center-top position while prior stones remain installed. Month 01 = 01 centered + 11 blanks; Month 12 = 12 centered + 01–11. CAD must resolve indexing, pitch, installation sequence and tolerance stack. Twelve positions on an open arc do not establish symmetric equal pitch; diagrams express occupancy, not a solved mechanism. All depicted modules share one envelope. Illustrated glow in earlier renders is not powered illumination.
- The fixed stone design specification is Clarity/Amethyst, Compassion/Rose Quartz, Courage/Garnet, Renewal/Aventurine, Balance/Jade, Presence/Aquamarine, Strength/Tiger’s Eye, Resilience/Carnelian, Perspective/Lapis Lazuli, Gratitude/Rhodonite, Growth/Citrine and Harmony/Onyx. Supplier identity, treatment, cut and validated production material remain unconfirmed.
- Passive NFC per removable module is a development direction. The new requirement is readability loose → partially integrated → installed in final 316L → installed on wrist, with phones, orientation, distance, identity/multitag selection and repeatability documented. Test ferrite/isolation/polymer/antenna-location alternatives. NXP/ST antenna guidance does not prove this geometry works; iPhone background notifications and RF reading are separate observations.
- Installed suppression is superseded. Historical criteria, rows, checks, costs and unknown keys remain in version-1 backups. Old RF rows are marked legacy; the new installed-readability criterion has a separate ID, new static checklists use H2 keys, and imported history prompts re-review. Preserved old reviewed flags or supplier qualifications cannot approve H2 hardware. No old physical pass becomes a current pass automatically.
- Packaging contains exactly 12 branded milestone boxes/cards plus protected bracelet accommodation, with Month 01 immediately available. Earlier 1 + 11 and 2 × 6 studies remain reference alternatives under the shared Light/Dark structure. Source annotations conflict: six 60 mm boxes need 360 mm before allowances, exceeding the labeled 280 mm outer width; a 45 mm inner box cannot fit within a 45 mm outer height. Approved CAD fields stay blank pending a corrected dimension chain and full-size sample.
- Earn → Unbox current milestone → Tap/activate → Install → Wear → Repeat is intended behavior, not validated hardware or UX. Product eligibility remains a separate software concern.
- P0–P8 separate visual/dimensional, wearable fit, clasp/adjustment, retention, installed RF, complete functional, cosmetic finish, packaging and pilot evidence. The next build is a non-RF P0 mockup of both chassis envelopes, all 12 positions, current-center occupancy and three underside mechanism volumes; no production tooling release is implied.
- DESIGN INTENT, WORKING ASSUMPTION and REQUIRES PROTOTYPE distinguish planned work. SUPPLIER-CONFIRMED requires written evidence; PHYSICALLY VALIDATED requires recorded tests for the exact revision. Static diagrams and reference renders establish neither. All loads, cycles, dimensions, chip selection, quotes and wrist ranges remain unvalidated unless the user adds linked evidence.
- The route has `noindex,nofollow,noarchive` and no consumer navigation link. The Vercel production route is publicly reachable and adds no authentication. Noindex is not access control. Keep confidential supplier details in browser-local fields rather than static source.

## Verification

```sh
node --test tests/manufacture-costs.cjs
node tests/manufacture-browser.cjs
node tests/manufacture-resilience.cjs
node tests/manufacture-hardware.cjs
```

Browser tests use bundled Playwright and installed Chrome with the server running, and isolated browser storage. Screenshots/results are in `../qa/manufacture/`. Node tests cover missing/zero/invalid costs, multipliers, finish premiums, mixed quantities, shared tooling, yield, scenario independence, overflow and margins. Browser checks cover 16 sections, editable fields, persistence, theme, responsive widths, cost calculations, export and import. Resilience checks cover large-backup round trips, actual storage-quota failure, corrupted storage preservation, cross-tab write protection, copy fallback, keyboard navigation and CSV/HTML escaping. Hardware integration checks cover authentic legacy migration, preserved retired fields, historical suppression evidence, decisions, finish costs, mixed-batch tooling, yield planning and export/import. Physical hardware performance remains untested.

Implementation also adds `../tests/manufacture-costs.cjs`, `../tests/manufacture-browser.cjs`, `../tests/manufacture-resilience.cjs` and `../tests/manufacture-hardware.cjs`, produces ten route files under `../public/halo-site/manufacture/`. QA artifacts stay outside the served directory. Browser tests resolve `playwright` normally or through `PLAYWRIGHT_MODULE_PATH`; use `NODE_PATH` for a shared runtime install.

## Vercel publication

Use the existing `.vercel/project.json` link and `vercel --prod --yes --scope connorlees-projects`. Production is `https://www.habithalo.app/manufacture`. Preserve Bamboo marketing pages and existing work. Browser data does not transfer across origins: export JSON from the former localhost/ChatGPT Sites workspace and import it on the new host if needed.

Set `MANUFACTURE_BASE_URL=http://127.0.0.1:61022` for browser suites against the local production server. QA captures are local output, not deployed assets.
