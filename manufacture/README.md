# Halo Year One partner brief and manufacturing reference

`/brief` opens with a user-supplied luxury visual reference, then a concise, factual Year One brief. The leading GTM hypothesis is a premium membership around $995 upfront and an initial Los Angeles cohort of roughly 100 members; neither is approved or validated, and the current public $189 offer remains separate. The program and community are unbuilt. The bracelet direction is passive jewelry with twelve earned natural stones and no continuous sensing by default. Opal is Month 12; the existing Year One visualization is approved for the MVP and preserved in a collapsed reference. Materials, construction, suppliers, costs and most stone details require qualification. The original H3 engineering, quote and cost workspace remains in a collapsed **Earlier working reference** section, available through `?reference=1` or a direct fragment link. It is historical context, not the premium membership specification or an active supplier brief. The photo header is a visual reference, not a production claim; its parallax is disabled with Reduce Motion.

The public consumer offer still uses **$189**, while `/brief` records a preferred but unvalidated **about $995 upfront** flagship Year One membership. The retained H3 model used **Halo — First Year Collection, $189** and a **$25 fully refundable reservation credited toward $189**; the public site currently offers a Coming soon waitlist, not checkout. The ~$995 price, founding cohort and later differentiated accessible line are hypotheses, not final supplier instructions or a change to the consumer offer. The retained economics brief is [`../docs/first-year-economics.md`](../docs/first-year-economics.md).

In that earlier H3 model, landed product COGS aimed for $70, with $85 the maximum design gate. The $80 working allocation was hardware $28 + 12 stones/inserts $22 + all packaging $12 + assembly/QC/rework $8 + inbound freight/duties $10. These are historical design targets, not supplier prices or gates for the premium hypothesis. Individual category ceilings sum to $100 and cannot all be spent. No supplier costs, prototype performance, fit, yield or profitability are confirmed by this reference.

## Retained H3 technical study

Within the retained study, NFC is optional. A = 12 tagged stones; B = selected stones (three only as a calculator comparison); C = one bracelet element; D = none. D is its provisional cost baseline; investigate C if one ownership/collection tap proves valuable. The app owns milestone eligibility for every option. RF tests are conditional on A–C, not required to approve D.

That study assumed one consumer offer and one provisional finish for cost development. Fit evidence would determine necessary size variants. Twelve individual presentations were included; twelve rigid mini-boxes, two packaging colorways, ornate retention and custom machining were not automatic requirements. Preserve real materials and the progressive bracelet while reconsidering the membership experience. Center-current reseating remains a design candidate: cost/handling findings require a product review before changing meaningful staging.

Earlier manufacturing source remains in Git history. H2 SVGs are visibly labeled historical studies. They do not mandate dual finishes, installed NFC in all stones or an unvalidated mechanism. Old dimensions, checkmarks, RF results, supplier qualifications and cost entries remain historical; they do not approve H3.

## Source and build

- `brief.html`: five short sections led by the luxury launch hypothesis, followed by Year One, jewelry, stones and validation decisions.
- `content.html`: 16 retained technical reference sections, sourcing briefs, economics and evidence gates.
- `page.html`: shell, brief introduction and collapsed working reference.
- `workspace-data.js`: editable dimension/protocol/RF/quote/decision schemas and H3 requirement revision.
- `manufacture.js`: local persistence, schema migration, rendering, CSV/JSON export/import and target feedback.
- `cost-model.js`: dependency-free calculations and $189/$85 target constants, shared with Node tests.
- `manufacture.css`: responsive, theme and print styles.
- `../scripts/build-manufacture.mjs`: builds `/brief` during `pnpm website:build`; explicit asset allowlist excludes documentation/archive sources.

Work in `/Users/connor/Desktop/halo/bamboo`. Run `pnpm website:build`, then the existing Next preview/build workflow. The canonical brief URL is `/brief`; legacy `/manufacture` links redirect there. It is unlisted/noindex, **not authenticated**. Do not add supplier secrets to static sources. No deployment is implied by a local build.

## Cost calculations and evidence

Four alternative batches: 25 / 100 / 500 / 1,000 saleable kits. Twenty-four cost lines remain stable for old backups. New workspaces start with NFC D; the two NFC cost lines have quantity zero and are excluded from arithmetic without erasing saved values. A/B/C apply 12/3/1 to NFC and isolation. Stone assembly remains ×12 regardless of NFC. NFC cost must include inlay, tag assembly/provisioning and testing; isolation is separate. Requote architecture changes rather than treating a bracelet tag and a tiny stone tag as identical prices. Legacy all-NFC quotes must be reviewed for the new complete-operation scope; adding assembly to both lines would double count it.

All physical component prices remain blank until entered with a quote or explicit estimate basis. Blank/invalid applicable dependencies are never treated as zero. An explicit zero requires an inclusion/exclusion explanation. Inactive optional fields remain saved and are labeled excluded. Quotes do not auto-populate prices because currencies, revisions and inclusions differ.

- COGS: applicable components, assembly, all packaging, QC, monetary scrap/rework.
- Landed: COGS + inbound freight + duties/import.
- Selling: outbound fulfillment + payment fees (amounts, not rates).
- Gross margin: tax-exclusive retail less landed cost; contribution also subtracts the modeled selling lines. App/cloud/companion operations, warranty, support, acquisition and unentered operating expenses remain outside that calculator contribution.
- Shared tooling: stored once, separately amortized over the selected total batch; no duplicated Light/Dark tooling.
- Finish/yield alternatives: existing comparison preserved, not consumer variants. Enter explicit zero for the unused finish. Whole-number finish quantities sum to the batch. Yield estimates production starts only; it never silently multiplies finished-unit quotes or duplicates scrap.

The retained H3 gate always evaluates $189 USD and ≤$85 USD landed. It says incomplete, over-budget, or entered scenario within target **with unverified evidence**. It does not evaluate the emerging premium membership. Non-USD entries do not produce a USD gate result; changing a label never converts currency. Historical retail sensitivity fields remain in a collapsed disclosure and do not redefine the product price. Tax-inclusive markets require modeling actual net revenue separately.

## Local persistence and migration

Browser key remains `halo-manufacture-workspace-v1`. Imports preserve older values and unknown historical keys. H3 adds `model.nfcMode` with strict A/B/C/D-option validation. Backups without this field retain `all` (the historical twelve-module arithmetic), and previous revision imports show re-review warnings. New workspaces use `none` as a provisional baseline. Changing an option is explicit; switching back recovers prior unit entries. New H3 checklist keys do not reuse H2 approvals.

Edits are browser-local, not synced or sent to suppliers. Export JSON before clearing storage or changing origin. Storage errors, corrupt-data preservation and cross-tab write blocking remain active. Import replaces the current workspace only after validation. CSV export escapes formula-leading text; JSON is the full-fidelity backup.

## Verification

`node --test tests/manufacture-costs.cjs` covers monetary boundaries, legacy quantities, option switching, incomplete/invalid costs, independent scenarios, single-count tooling and explicit yield planning. This brief revision passed the site build and those 19 cost tests; focused static-browser checks at 390, 768 and 1280 pixels found no overflow or browser errors. The older browser, hardware and resilience suites were not rerun for this copy revision. Manufacturing feasibility still requires supplier quotes and physical tests.
