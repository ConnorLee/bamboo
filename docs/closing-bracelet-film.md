# Halo closing bracelet film

This native film is retained for future marketing. The landing page uses a separate
close-up still instead. The MP4 and poster are stored in `marketing/closing-film`,
which is excluded from website deployment. The local production output also keeps
the complete native frames, manifests, and an unused browser-player prototype.

## Sequence

The opening plays twelve accurate monthly states once. Each state comes from the
existing canonical year renderer: one installed stone on day one, then additional
stones up to twelve, with the remaining positions occupied by metal blanks.
Short editorial dissolves connect the monthly stills; this is a passage-of-time
visual, not a demonstration of mechanical installation.

The completed bracelet then moves gently through gold, silver, and black finish
portraits. Camera and softbox motion is rendered in Blender, with the geometry
fixed. The 36 frames of each portrait form a three-second native 12 fps cycle.
The delivery runs at 24 fps by repeating frames; it uses no optical-flow synthesis.
Finish transitions are half-second dissolves between matching geometry and poses.
Each portrait repeats its first half-second at its end so overlapping frames have
exactly the same camera pose; this avoids double edges during finish changes.

The movie ends with a matched return to gold. After the first play, the controller
returns to 112/24 seconds, the immediately following camera pose in the completed
gold portrait, keeping all earned stones present. It does not repeat the initial
accumulation on every loop. The final delivery is 328 frames / 13.666667 seconds.

## Native source and rendering

`scripts/render-bracelet-closing-film.py` reuses the setup and mineral library from
`scripts/render-bracelet.py`. The native master is opened without saving over it.
The original closed clasp, twelve-seat mapping, repaired UVs, and stone materials
remain the canonical source. Champagne gold copies the existing brushed metal
shader and uses the same linear `(0.68, 0.55, 0.35)` finish as the prior campaign.

The source master SHA-256 is
`188ada48b8e270a59dcb4959263ffe20512fc073c4dc079574238130d4b9e8eb`.
Each render directory retains its executed script version, frame hashes, actual
generation timestamps, occupancy checks, geometry hashes, camera bounds, and
before/after master hashes. The renderer changes only its in-memory presentation
scene. Raw renders stay in the local production output directory.

Run these from a Blender installation with the existing master and source helpers:

```sh
blender --background HALO_Bracelet_Master.blend \
  --python scripts/render-bracelet-closing-film.py -- \
  --output-dir /path/to/halo-closing-film/months \
  --months 1,2,3,4,5,6,7,8,9,10,11,12 --finishes Gold --frames 1 \
  --width 1152 --samples 32

blender --background HALO_Bracelet_Master.blend \
  --python scripts/render-bracelet-closing-film.py -- \
  --output-dir /path/to/halo-closing-film/motion \
  --months 12 --finishes Gold,Silver,Black --frames 36 \
  --width 1152 --samples 32

blender --background HALO_Bracelet_Master.blend \
  --python scripts/render-bracelet-closing-film.py -- \
  --output-dir /path/to/halo-closing-film/poster \
  --months 12 --finishes Gold --frames 1 --width 1440 --samples 64

python3 scripts/encode-closing-film.py --render-dir /path/to/halo-closing-film
```

The encoder verifies native frame hashes and twelve-position occupancy before
assembly. It writes the silent H.264 MP4 and WebP poster into `marketing/closing-film`,
with a delivery manifest in the render output directory. It requires FFmpeg,
ffprobe, and Pillow. Lossless intermediate movies are reproducible working files and may be removed
after the verified final delivery; original native frames are retained.

## Retained delivery

The finished MP4 is 13.666667 seconds, 1152×768 at 24 fps, silent, and about 2.2 MB.
The delivery manifest records the actual encoder version used to create it; later
changes to its default output directory do not relabel or backdate that render.
The unused player prototype is preserved beside the local native output for later
reuse. It is not loaded by, copied into, or published with the landing page.

These are product design visualizations. Finish changes are editorial transitions,
not a claim that the physical bracelet changes material. The underlying native
model, original render timestamps, frame hashes, and earlier artwork are preserved.
