# Halo closing material portrait

The landing page ends with a close native Blender portrait of the silver bracelet.
The stone-bearing arc runs beyond the right and bottom edges, while the existing
headline, waitlist action, collection note, and company footer remain unchanged.
A separately rendered mobile crop sits below the copy. The still needs no player
JavaScript or motion controls.

`scripts/render-bracelet-closing-macro.py` reuses the existing native rendering
studio and mineral materials. It changes only the presentation camera and light
staging. It does not save over the approved Blender master. The RGBA render lets
the website supply the black backdrop without an artificial edge fade.

The native master, geometry, executed renderer, image hashes, and actual render
times are documented in `closing-bracelet-macro-render.json`. The image is a
product design visualization; natural stones vary.

The completed motion study remains in `marketing/closing-film`, with its delivery
manifest and reproduction notes in `closing-bracelet-film-render.json` and
`closing-bracelet-film.md`. That directory is excluded from website deployment.
The website does not load or ship the film.
