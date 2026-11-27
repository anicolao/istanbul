# Legibility reskin

70 new raster assets generated with the built-in image-generation tool on 2026-11-26. Exact prompts and original generation paths are recorded in `manifest.json`. The project-consumed images are in `static/art/reskin/`; compact variants use the same artwork, cropped to visible bounds and downsampled for small wells.

Review locally:

- `/gallery/` — production components, including 24/32/48px icon comparisons
- `/dev/animations/?scenario=legibility-review` — full board and animations
- `/dev/animations/mobile?scenario=legibility-review` — external controls around device previews
- `/dev/cards/` — every Bonus card front and back

## Direction

Preserve the warm Ottoman painterly style, brass edges, walnut trays, and jewel colours. Reduce ornamental noise; distinguish resources and roles by silhouette as well as colour. Give each location a dominant focal subject. Use ivory fields behind figures, quantities and goods, and a quiet cream rules panel on cards. Titles and numbers on cream use dark ink.

One shared mat body serves all five players; player colour remains live state. Its resource headers now use the same generated icons as goods, offers, summaries, and flights. Merchants have large round turbans, assistants low caps and parcels, family members simple spherical-headed wooden bodies. Governor and Smuggler have distinct white-turban and pointed-hood silhouettes. Mosque icons show abilities rather than prices.

All 16 locations, 19 player/visitor/first-player figures, 11 Bonus illustrations/back designs, frame, mat, table background, resources, powers, market trays, supply icons, dice icons and help states have been regenerated. Decks reuse the new card back. The existing 3D dice geometry and motion remain procedural; this is an artwork/component presentation pass, not a rule or animation-timing change.

## Review status

The visual direction has been approved for browser regression review. Screenshot baselines now use the reskin across gameplay, the component gallery, and the animation lab. Regression coverage checks fixed-layout Bonus-card text at phone and desktop sizes in Chromium and WebKit, including bounds and consistent line breaks while scaling. Normal verification is required before preview deployment. Existing source assets remain available in git for comparison; current shared renderers point to the new set.

## Deterministic icon downsampling

Full-size component icons use square, power-of-two PNG canvases. Chromium can
[reuse an already downsampled image](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/cc/tiles/software_image_decode_cache.cc)
to draw a smaller copy; non-power-of-two
heights produced different tiny images depending on decode order. Keep the
painted pixels intact and centre them on a transparent 512 × 512 canvas.

The normalized files are `any`, `mosque-fabric`, `mosque-spice`, `goods-supply`,
`ruby-supply`, `wheelbarrow`, `mail`, `die`, and `dice-pair`. Their original heights
were 506, 468, 478, 468, 468, 341, 341, 341, and 341 pixels respectively; width was
512. Padding starts at `floor((512 - height) / 2)` above the image, with the
remaining transparent rows below. No source pixels were resampled or repainted.
The art manifest test protects this canvas contract.

The card back uses a 256 × 512 canvas matching the printed card's 1:2 ratio.
It is the central crop of the original square 512 × 512 image, without
resampling; these are the same central pixels previously shown by `cover`.
This avoids decoding a square texture through a narrow crop at miniature sizes.
