# Halo closing collection — native Blender stills

The closing section uses `website/assets/yearly-bracelets-native-v1.webp`.
It is a 1536 × 1024 WebP export of the native 1800 × 1200 Cycles render.
The earlier image-generation concept remains at `yearly-bracelets.webp` for reference.

## Three directions

- **Trio:** silver, black, and champagne gold on low charcoal stone displays. Selected for the site; finish order matches its caption.
- **Close-up:** champagne gold in the foreground, with silver and black partially framed behind it.
- **Quiet:** all three finishes on a warm honed limestone surface.

`scripts/render-bracelet-campaign.py` reuses the approved setup from
`scripts/render-bracelet.py` and the shared `halo_bracelet_materials.py` library.
The completed twelve-stone model is evaluated before creating static copies.
The three finishes share the same evaluated geometry, repaired UVs, clasp and
mineral materials. Gold copies the brushed silver shader and changes its base
color to linear RGB `(0.68, 0.55, 0.35)`; the master file is never saved over.

Each render's JSON records the source hash before and after, 190 meshes per
bracelet, 12 installed stones per bracelet, zero blanks, shared geometry hash,
framing bounds, camera variant and sample count. Product footprints are separated
in the scene. The original “Yearly collection concept” qualification stays on the site.

## Reproduce

Run with the existing Halo master and its source helpers available in the paths
configured by the canonical renderer:

```sh
blender --background HALO_Bracelet_Master.blend \
  --python scripts/render-bracelet-campaign.py -- \
  --variant trio --width 1800 --samples 128 \
  --output-dir /path/to/campaign-output --save-scene
```

Use `--variant closeup` or `--variant quiet` for the alternatives. The saved trio
scene packs its mineral textures. Renders use deterministic seed 29, Cycles,
AgX, and physically rendered lighting and shadows.

Resize the selected image to 1536 × 1024 with Lanczos, then export WebP at
quality 90, method 6. The site's existing 3:2 aspect ratio, edge masks, responsive
layout, copy, finish labels, and waitlist behavior remain unchanged.
