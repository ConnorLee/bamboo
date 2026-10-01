# Halo bracelet mineral albedo

These twelve existing geological color textures are used by
`../halo_bracelet_materials.py` for the native website bracelet renders. They
are art-directed mineral visualizations, not measured material scans. Generated
local XY coordinates keep the structure attached to every moving stone.
Blender supplies polish, transmission, internal haze and lighting.

This material pass changes neither the canonical twelve-stone order nor the
master geometry. The loose-stone carousel and packaging assets are independent.

Render the monthly layers and both full finale sequences after any material or
lighting change. Do not use `--resume` after changing a shader: it only checks
whether the raw image exists. Use `--output-dir` and `--asset-dir` for isolated
proofs. The native master and its helper source live in the project's
`output/halo-bracelet-master` directory; rendering never saves that master.
