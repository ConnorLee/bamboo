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

`website/` is the editable source for the current Halo marketing experience, imported from the September 29 Halo site. It preserves Aeonik Pro, the supplied sculptural logo, light/dark themes, the selected “Time, made tangible” hero (candidate B), its amethyst artwork, and the original stone-lift scroll interaction. The homepage retains B’s original sequence: hero, stone explorer, mineral collection, app gallery, and closing. The build normalizes asset URLs into `public/halo-site/`. That output is generated and ignored by Git.

Next.js rewrites `/`, `/how-it-works`, and `/original` to these complete static documents before filesystem routes run. This preserves the approved design without loading the legacy React landing page's global styling, marquee, or client bundle. Existing `/demo`, `/contact`, `/about`, `/old`, and `/api/subscribe` routes remain available. The original pre-September-29 homepage now lives at `/about`, rendered from `components/legacy-homepage.tsx`; `app/page.tsx` shares it only as a historical fallback. The About route preserves its floating app screens, animated logo, facts toggle, marquee and waitlist. Its home logo uses full-document navigation to cross back to the static B landing. Edit `website/index.html` for the homepage.

`website/original/` preserves candidate B exactly and supplies the homepage’s shared styles and image assets. The root imports those styles instead of duplicating them. `/original` remains a historical design archive with its earlier schedule.

The homepage’s seven material studies are selected examples from months 1, 2, 3, 4, 5, 9 and 12, mapped through `website/milestones.js` to the canonical catalog. Asset numbers are historical render IDs, never eligibility thresholds. The homepage uses the original single-stone jewelry and app artwork. Do not append the newer Halo I, drawer, unboxing or newer mockup sections to B. The former `halo-i-sections.*` source is retained but is not loaded or inserted into the homepage. Physical concept details remain on separate pages. Preserve B’s complete visual composition when updating content.

## Product source of truth

`website/halo-i-catalog.js` owns the twelve proposed monthly stones, chapters, colors, reveal messages and evolution descriptions. The how-it-works adapter and companion geometry consume this shared catalog. `public/halo-i/` contains optimized Blender renders, transparent bracelet states, packaging studies and current app captures. Only the renders needed by the site are included; editable Blender sources remain in the Halo product workspace under `output/halo-v1-system`.

- Halo I: passive brushed 316L steel, twelve circular mechanical receivers and natural gemstone carriers. No electronics in bracelet or stones.
- Twelve stones arrive in twelve concealed drawers. Hidden NFC belongs beneath or behind each packaging cradle. Scan before lifting the stone, then install mechanically.
- One stone per completed month; the first follows month one, the twelfth requires a full year. Natural opal is the final proposed stone.
- Earned history is permanent, including earned milestones not yet activated. Current streaks are separate. A missed check-in alone is never a lapse.
- The authenticated app owns eligibility, kit verification and activation. Website controls are local design previews and never grant milestones or change an account.
- Mechanical fit, retention, sourcing, durability, packaging NFC and secure activation still require validation. Halo II/III are future finish studies, not available products. No final price or delivery date is promised.

The how-it-works waitlist posts to the existing `/api/subscribe` Mailchimp integration. All Halo domains currently alias this same Vercel project, so signup stays on this site. Email delivery is tested with mocked responses; no test subscriber is sent to Mailchimp.

## Landing page variants

`/variants` is the comparison page. The main site remains B, with `/variants/b` as a stable alias. The alternatives live in isolated snapshots under `website/variants/`:

| URL | Design | Preserved source |
| --- | --- | --- |
| `/variants/a` | A support system. For your progress. | September 29, 11:36 refinement (`deab38c`) |
| `/variants/b` | Time, made tangible. | Current minimal homepage; no added Halo I sections |
| `/variants/c` | You meet them once. Then you grow together. | Companion page from the same 11:36 refinement |
| `/variants/d` | A year, made visible. | Separate ivory-and-sage `halo-i-system` concept |

A and C intentionally retain the earlier single-stone imagery and material palette as design studies. Unconfirmed historical price/shipping offers have been removed. D retains its read-only ritual prototype. All signup CTAs lead to the existing waitlist; these controls never grant progress or activate a real stone. Variants and comparison are `noindex`.

The build normalizes HTML and image URLs for extensionless routes; D's JSON requests use explicit public paths. A shares the frozen C companion catalog and geometry. Only runtime assets are packaged—no workstation paths, production credentials or manufacturer documents. Keep each snapshot's visual identity independent from future main-site changes.

These URLs enable manual review and direct-traffic comparisons. Automatic visitor allocation, exposure/conversion analytics and statistical reporting are not configured by this change. `variant=a/c/d` query parameters on signup links identify the entry path, but the existing subscription API still records email only.

## Validation

`pnpm build` now includes TypeScript validation. Next.js is patched to 15.5.24; the legacy lint bypass remains until an ESLint setup is adopted. Local production-browser checks cover all three marketing routes, desktop/mobile layouts, theme persistence, selected monthly material studies, all twelve drawer reveals, evolution previews, keyboard controls, reduced motion and image loading. These checks validate the website, not the unimplemented NFC service or manufactured jewelry.

The native Swift app lives separately in `ConnorLee/habithalo`; it must not be deployed as a Next.js website.
