# Halo closing material portrait

The landing page ends with a close native Blender portrait of the bracelet:
silver for light mode and native Black PVD for dark mode.
The stone-bearing arc runs beyond the right and bottom edges, while the existing
headline, waitlist action, collection note, and company footer remain unchanged.
A separately rendered mobile crop sits below the copy. The still needs no player
JavaScript or motion controls.

`scripts/render-bracelet-closing-macro.py` reuses the existing native rendering
studio and mineral materials. It changes only the presentation camera and light
staging, with `--finish Light` (the default) or `--finish Dark` selecting the
existing native metal material. Both finishes use identical camera, geometry,
lighting and gemstone settings. It does not save over the approved Blender master.
The RGBA render lets the website supply its backdrop without an artificial edge fade.

The native master, geometry, executed renderer, image hashes, and actual render
times are documented in the original `closing-bracelet-macro-render.json` for
Silver and the separate `closing-bracelet-macro-dark-render.json` for Black.
The Silver record and assets are retained unchanged. Each finish has a 2400 × 1400
landscape render and a 1200 × 1100 mobile render at 96 Cycles samples. The Dark
WebP exports retain lossless alpha and use quality 92, method 6; they are native
render encodings, not recolored Silver images. These are product design
visualizations; natural stones vary.

The completed motion study remains in `marketing/closing-film`, with its delivery
manifest and reproduction notes in `closing-bracelet-film-render.json` and
`closing-bracelet-film.md`. That directory is excluded from website deployment.
The website does not load or ship the film.
