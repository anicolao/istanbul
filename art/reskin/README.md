# Legibility reskin — first review

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

Unapproved visual direction. No tests run and no screenshot baselines updated. Browser previews are inspected for loading and obvious presentation problems only. Particularly review room-art cropping under the frame, resource recognition at 24px, pawn colour consistency, mat slot alignment, and card text density before committing to the direction. Existing source assets remain available in git for comparison; current shared renderers point to the new set.
