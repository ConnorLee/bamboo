# HALO twelve-stone year render study

These assets are native Cycles renders derived from `HALO_Bracelet_Master.blend`, not relabeled thirteen-seat imagery. The original rigid stainless chassis and animated rear clasp are retained. In memory, the obsolete Intention socket, filler, module, and blind-pocket Boolean are removed; the remaining receivers are respaced to twelve actual seats. The source master is never saved or overwritten.

The provisional material order is Moonstone, Amethyst, Turquoise, Rose Quartz, Carnelian, Lapis Lazuli, Green Aventurine, Tiger’s Eye, Black Tourmaline, Citrine, Clear Quartz, Opal. Fine color, roughness, mineral-matrix, inclusion, and fiber variation are procedural visual treatments. They are design studies, not material certification or validated manufacturing geometry.

## Asset contracts

- `base-{light|dark}-{00..11}.webp` and `stone-{00..11}.webp`: aligned transparent layers; index 0 represents Month 1, index 11 represents Month 12. The selected month is centered, previous stones retain their history seats, and unearned seats contain metal blanks.
- `progress-{01..12}.webp`: complete Light composites named by installed-stone count. `progress-light-*` and `progress-dark-*` provide explicit finish variants.
- `progress-00.webp` and `empty.webp`: the same genuinely empty twelve-seat Light bracelet; finish-specific empty variants are also supplied.
- `gem-{00..11}.webp`: isolated native mineral renders.
- `finale/{light|dark}-{00..23}.webp`: twenty-four frames per finish showing the completed twelve-stone bracelet and its native clasp movement. The final frame reuses the first closed pose byte for byte.

Website catalog keys retain `aventurine` and `quartz`; render materials internally use `green-aventurine` and `clear-quartz`. The manifest records the public keys. Hero and finale images are 1000 × 875; isolated minerals are 900 × 750. All images retain transparency.

## Reproduction and evidence

Run the repository’s `scripts/render-bracelet.py` inside Blender against the master for both finishes, all twelve indices, empty state (`--months=-1`), and isolated gems (`--gems-only`). Then run `scripts/render-bracelet-finale.py` inside Blender for both finishes. Ordinary Python/Pillow runs `scripts/render-bracelet-pack.py` followed by `scripts/render-bracelet-finale.py --pack`.

The manifests record twelve receiver/pocket positions, per-state mineral placement, camera projection, source SHA-256, finish correspondence, and native clasp angles/transforms. The tests compare every rendered placement to the runtime mapping and verify WebP dimensions, transparency, complete asset coverage, progression aliases, and the finale closure sequence. Original thirteen-seat files remain in `assets/bracelet` as a baseline and are no longer used by the main renderer.
