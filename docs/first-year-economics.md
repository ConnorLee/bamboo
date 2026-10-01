# Halo — First Year Collection

**Product constraint:** $189 consumer retail, strictly below $200. One initial offer; no “from,” starting price, upsell-dependent base kit or $249–299 positioning. The retained planning model applies a $25 fully refundable founding reservation against the $189 purchase price, leaving a $164 balance. The public site currently offers a Coming soon waitlist, not checkout. Any future reservation receipts would not be evidence of profitable production.

The collection includes the Halo bracelet, 12 real milestone stones covering the first year, individual milestone presentation/packaging, the Halo iPhone app, digital milestone collection and companion maturation throughout the year. Preserve the progressive bracelet, material quality, monthly reveal and emotional bond. Finish selection may happen later. Size variants are permitted only when fit evidence requires them, with shared interfaces and tooling wherever practical.

Status: **H3 design targets and planning assumptions; no supplier quotes, landed costs, yield, fit, NFC feasibility or production readiness are confirmed by this document.** Earlier manufacturing source remains in Git history. H3 takes precedence. Existing browser-local quotes, tests and cost entries remain attributable to their original revision and must be reviewed.

## Design backward from $189

Desired landed product COGS: aim for **$70**, accept a substantiated **$70–85** envelope, with **$85 as the maximum design gate**. The following $80 working allocation leaves $5 of headroom to the gate; it is a target allocation, not an estimated supplier quote or demonstrated production cost.

| Cost group, per complete collection | Working allocation | User's investigation target | Scope to avoid double counting |
| --- | ---: | ---: | --- |
| Bracelet / hardware | $28 | ≤ $30 | Chassis, clasp, finishing, interface hardware, blanks, engraving; carriers counted here if quoted with hardware |
| 12 stones / inserts | $22 | ≤ $20–30 total | Natural stones, calibration, seats/carriers if not above; no duplicate carrier charge |
| Packaging | $12 | ≤ $15 | Outer presentation, 12 individual presentations, cards, inserts and transit packaging |
| Assembly + QC | $8 | ≤ $10 | All stone-setting, bracelet assembly, kitting, inspection, rework and monetary scrap allowance |
| Inbound freight / logistics | $10 | ≤ $15 | Freight to fulfillment stock, duties/import and inbound handling |
| **Landed product total** | **$80** | **≤ $85 overall** | All five groups; do not add headroom to each line |

The independent upper bounds add to **$100** ($30 + $30 + $15 + $10 + $15), not $85. They are investigation limits, not simultaneously available budgets. A category increase requires an evidenced offset elsewhere or a redesign. The $80 allocation includes no NFC allowance; any NFC option must fit within the total envelope including integration, testing and yield losses. If a necessary cost cannot fit, report that $189 feasibility remains unproven; do not conceal it, remove the year's stones, or increase retail.

At $189 revenue before tax, $70 / $80 / $85 variable landed costs leave $119 / $109 / $104 respectively, or 63.0% / 57.7% / 55.0% product gross margin. These arithmetic scenarios are **not net margins or profitability claims**. Subtract payment fees on reservation and balance, nonreturned fees on refunds, outbound shipping/fulfillment, returns/warranty/replacements, ongoing app/cloud/companion costs, customer support, acquisition and operating costs. Allocate development, samples and tooling over realistic saleable volume. Reserve cash for refunds. Do not count the $25 twice as extra revenue.

Tax treatment and shipping policy remain explicit launch decisions. In tax-inclusive markets, model net revenue after the applicable tax instead of treating $189 as tax-exclusive revenue; do not evade the retail constraint by inflating the product price with required accessories or hidden product fees. Use quoted freight/duty terms and a stated currency/FX basis. Twelve presentations do not imply twelve shipments: the base planning scenario is one complete first-year kit shipment, not an approved fulfillment promise. Recurring monthly physical fulfillment would require its own full-year logistics/support budget and feasibility review.

## Physical complexity audit

| System | Current risk | H3 direction / proof needed |
| --- | --- | --- |
| NFC in all stones | 12 inlays plus isolation, provisioning, integration, repeated tests and replacement mapping | Open option; compare A–D below. Do not reserve invisible electronics by default. |
| Independent electronics | Power, sealing, component and service complexity can consume margin | Passive jewelry baseline; no battery, screen or powered illumination is required. Natural stones and app growth supply the experience. |
| Stone retention | Tight threaded/bayonet fits, individual fasteners and repeated re-indexing can increase machining, assembly and wear | Compare positive retention candidates using common interfaces. Prefer the fewest parts that meet safety, feel, repeated-use and service criteria. Secure retention is non-negotiable; no untested cheap mechanism is approved. |
| Current stone placement | Previous H2 requires a physically centered current stone and repeated reseating; it may conflict with compact uniform stone staging and cost | Preserve the visible progressive bracelet. Quote manual reseating versus a simpler fixed-row sequence; record a product review before changing the current-stone experience. No automatic carousel or extra socket is required. |
| Custom machining | Small cavities, independent sockets, undercuts and many fixtures can dominate unit cost and yield | Ask for DFM comparisons of formed/cast/standard components and selective machining; preserve finish, contact quality and serviceability. No process is assumed feasible until samples. |
| Packaging | 12 rigid mini-boxes plus drawers, magnets, relief tooling and two colorways multiply cost and hand work | Keep 12 individual reveals; compare folded sleeves, premium small cartons or wrapped inserts within one tactile archival presentation. Retain real material feel, considered print and meaningful cards. The $12 allocation / $15 ceiling covers the entire system. |
| Multiple SKUs | Dual finishes × unvalidated S/M and M/L split minimum orders, QC and inventory | One consumer offer and one provisional finish for costing. Defer finish selection. Fit studies determine genuinely necessary sizes. Preserve past Light/Dark costing as alternatives, not launch commitments. |
| Manual assembly | Setting, adhesive cure, alignment, indexing, NFC provisioning and kitting accumulate labor | Time each operation in pilot, fixture the common envelope, measure accepted yield and rework; include all work in the $8 allocation / $10 ceiling. No invisible free labor. |

Packaging references contain a known dimensional conflict: six 60 mm boxes need 360 mm before walls, exceeding the annotated 280 mm outer width; a 45 mm inner box cannot nest within a 45 mm outer height with base/lid clearance. Preserve the references as visual intent only. Obtain a corrected full-size structure before tooling. Do not release drawings from the render.

## NFC decision: open, with a provisional D baseline

Use **D (no NFC)** for the first cost baseline and user-ritual prototype. Compare **C** if one intentional bracelet tap materially improves ownership/onboarding. A or B need stronger observed user value to justify their repeated integration work. This is a recommendation for investigation, not approval to remove an established shipping capability; no physical option has been validated.

For quote comparison define `t` as a complete installed, provisioned and tested NFC unit (inlay + antenna/isolation + tag assembly + test), `F` as allocated nonrecurring integration/tooling, and `R` as incremental rework/replacement allowance. These are unknowns, not supplier prices. Avoid counting shared stone-setting labor twice. A costs `12t + F + R`; B costs `kt + F + R`; C costs `t + F + R`; D has no physical NFC cost. App verification/support costs still exist for every option. The workspace uses **k = 3** purely as a comparison (e.g. months 1, 6, 12); selection/count are not release commitments.

| Criterion | A · NFC in all 12 stones | B · NFC in selected milestone stones | C · One NFC element in bracelet | D · No NFC; Halo verifies digitally |
| --- | --- | --- | --- | --- |
| BOM impact | 12 full integration/test costs, potentially different tuning/tooling | k repeated costs plus tagged/untagged handling | One installed element plus shared integration | No physical NFC; app operations remain |
| Assembly difficulty | 12 placements, mapping/provisioning and tests | Fewer placements but two module recipes to control | One assembly/provisioning station; access/service still needed | Simplest physical recipe; stone setting still needs QC |
| Reliability | More individual RF failure opportunities; metal, neighboring tags and exposure require testing | Similar local RF questions on fewer stones | One RF location and one potential loss of tap function | No RF failure; depends on app progress/recovery reliability |
| Scan ergonomics | Small targets and wrong-neighbor selection risk as bracelet fills | Scan teaching applies only on selected months; potentially inconsistent ritual | One learned tap location, but wrist/metal/phone access may be awkward | Open Halo and confirm earned milestone; no scan ritual |
| User value | Each physical stone can invoke its own story; validate whether repeated taps matter | Special milestone taps could feel deliberate if clearly staged | Ownership/onboarding or opening the collection; cannot identify the stone installed | Full digital collection and companion growth; monthly physical reveal remains |
| Fraud prevention | Basic UID/URL is not proof of progress or authenticity; secure tags require backend keys and anti-replay handling | Same limitations, and untagged stones offer no hardware signal | Can associate bracelet ownership, not prove each milestone or current wearer | Server eligibility/deduplication/recovery; no physical authenticity proof |
| Manufacturing yield | Many dependent installations and tests can compound accepted-kit loss; measure actual rework and correlations | Fewer tag tests but wrong-recipe/mapping errors must be measured | One RF yield factor; full-kit acceptance still includes all mechanical/stone processes | Removes RF attrition only; stone, fit, finish and packaging yield remain unknown |

For intuition only, independent 99% tag-install acceptance would give `0.99^12 = 88.6%` all-12 tag acceptance before rework; this is an illustrative sensitivity calculation, **not a Halo yield estimate**. Real failures can be correlated and repairable. Track saleable-kit costs, production starts and monetary scrap separately to avoid multiplying finished-unit quotes by yield twice.

[NXP's antenna guidance](https://www.nxp.com/docs/en/application-note/AN11564.pdf) explains nearby-metal effects and ferrite mitigation; it is reader guidance and does not validate Halo's module. [ST's passive-tag antenna note](https://www.st.com/resource/en/application_note/an2866-how-to-design-a-1356-mhz-customized-antenna-for-st25-nfcrfid-tags-stmicroelectronics.pdf) supports testing the final tuned application. [NXP NTAG 424 DNA](https://www.nxp.com/products/rfid-nfc/nfc-hf/ntag-for-tags-and-labels/ntag-424-dna-424-dna-tagtamper-advanced-security-and-privacy-for-trusted-iot-applications:NTAG424DNA) provides cryptographic capabilities; the inference for Halo is that stronger authentication requires implementation and operations beyond a static URL. None establishes cost, scan success or fraud elimination for Halo. A physical tap never grants an unearned milestone; Halo remains the eligibility authority in every option.

## Evidence gates before production commitment

1. Record the fixed offer, candidate NFC mode, one-finish baseline and necessary fit-size hypothesis. Product owner reviews any change to current-stone staging.
2. Request comparable itemized quotes at 25 / 100 / 500 / 1,000 saleable kits with dated scope, currency, Incoterm, material identity/treatments, inclusions, exclusions, tooling, labor, yield basis and duties. No contact or quote is fabricated here.
3. Prototype fit/clasp/retention and the twelve monthly reveal sequence with real material samples. Define measured acceptance criteria first. For A–C, test the actual chosen RF location loose, integrated and installed/on wrist, correct identity, supported phones and post-cycle exposure; D records RF as not applicable with an owned decision.
4. Build a full-size packaging sample; time assembly and kitting; validate extraction, surface transfer, shipping protection, repair and replacement.
5. Pilot a traceable build. Reconcile all landed lines to ≤$85 and the operating contribution after app, fulfillment, returns, payment and support costs. Reject incomplete/over-budget business cases; do not call targets quotes or a reservation a production approval.

The manufacturing calculator retains historical alternative retail entries only for sensitivity/audit. Its H3 gate always evaluates **$189 USD** and **≤$85 USD landed**, regardless of those entries. Changing currency does not convert it. New workspaces start with NFC D provisionally; older backups without an NFC selection keep their original A quantities and a revision-review warning, so existing evidence is never silently recosted.
