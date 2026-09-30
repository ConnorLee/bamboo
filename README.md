# Halo website

This repository deploys to the Vercel project `v0-scrapapp-mpjxkfyicbn` in `connorlees-projects`, from `main`. Production is https://www.tryhabithalo.com.

## Editing and running

```sh
pnpm install --frozen-lockfile
pnpm dev
# after changing a file in website/ while the server is running:
pnpm website:build

pnpm build
pnpm start
```

`website/` is the editable source for the current Halo marketing experience, imported from the September 29 Halo site. It preserves Aeonik Pro, the supplied sculptural logo, light/dark themes, the support-system hero, and the twelve-month scroll explorer. `website/halo-i-sections.html` adds the physical product and unboxing story. The build inserts this fragment into `website/index.html` and normalizes asset URLs into `public/halo-site/`. That output is generated and ignored by Git.

Next.js rewrites `/`, `/how-it-works`, and `/original` to these complete static documents before filesystem routes run. This preserves the approved design without loading the legacy React landing page's global styling, marquee, or client bundle. Existing `/demo`, `/contact`, `/about`, `/old`, and `/api/subscribe` routes remain available. The old `app/page.tsx` is retained as historical fallback code, not the marketing source. Edit `website/index.html` for the homepage.

`/original` is an explicitly superseded concept archive. Its earlier hardware and milestone ideas are not current product guidance.

## Product source of truth

`website/halo-i-catalog.js` owns the twelve proposed monthly stones, chapters, colors, reveal messages and evolution descriptions. The how-it-works adapter and companion geometry consume this shared catalog. `public/halo-i/` contains optimized Blender renders, transparent bracelet states, packaging studies and current app captures. Only the renders needed by the site are included; editable Blender sources remain in the Halo product workspace under `output/halo-v1-system`.

- Halo I: passive brushed 316L steel, twelve circular mechanical receivers and natural gemstone carriers. No electronics in bracelet or stones.
- Twelve stones arrive in twelve concealed drawers. Hidden NFC belongs beneath or behind each packaging cradle. Scan before lifting the stone, then install mechanically.
- One stone per completed month; the first follows month one, the twelfth requires a full year. Natural opal is the final proposed stone.
- Earned history is permanent, including earned milestones not yet activated. Current streaks are separate. A missed check-in alone is never a lapse.
- The authenticated app owns eligibility, kit verification and activation. Website controls are local design previews and never grant milestones or change an account.
- Mechanical fit, retention, sourcing, durability, packaging NFC and secure activation still require validation. Halo II/III are future finish studies, not available products. No final price or delivery date is promised.

The waitlist links to Halo's existing https://www.habithalo.app/ experience. This change does not submit visitor data or replace that service.

## Validation

`pnpm build` now includes TypeScript validation. Next.js is patched to 15.2.9; the legacy lint bypass remains until an ESLint setup is adopted. Local production-browser checks cover all three marketing routes, desktop/mobile layouts, theme persistence, twelve scroll states, drawer reveals, evolution previews, keyboard controls, reduced motion and image loading. These checks validate the website, not the unimplemented NFC service or manufactured jewelry.

The native Swift app lives separately in `ConnorLee/habithalo`; it must not be deployed as a Next.js website.
