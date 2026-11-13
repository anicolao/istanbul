# Istanbul design review — November 13, 2026

Reviewed main at `4c1aead7` after the legibility PR. Sources read in full:

- `../gaiaproject/VISUAL_DESIGN.md` and `../gaiaproject/UX_DESIGN_PRINCIPLES.md`
- `../supermega/VISUAL_DESIGN.md` and `../supermega/UX_DESIGN_PRINCIPLES.md`
- `../vianova/VISUAL_DESIGN.md` and `../vianova/UX_DESIGN_PRINCIPLES.md`

The sources agree on actual-size readability, shared production renderers, contextual direct actions, identity through transitions and honest review evidence. Their artwork construction preferences differ: retain Istanbul's established generated raster components, as Gaia and Supermega do, rather than adopting Via Nova's vector preference wholesale.

## What already works

Istanbul uses shared production faces in the gallery, animation lab, board and zoomed room. Actual Bonus cards and market resources are controls. Arrival effects apply automatically, Undo is contextual, and warnings concern meaningful skipped actions rather than every reversible click. Zoom keeps the location art and orientation; resource flights identify their destinations. The preceding PR improved well contrast, pawn sizing, mosque ability identity and resource clipping. Preserve this direction.

## Changes in this PR

| Finding | Change | Evidence |
| --- | --- | --- |
| Nested art often wins help lookup, reducing live context to a generic name | Prefer explicit enclosing help context; share live resource and pawn explanations between renderers | New tests tap nested pawn/resource images, verify owner/location and live quantities, and assert no action or mat opening |
| Summary resources bypass help because their whole button is exempt | Explain individual totals in help mode; retain opening the mat from its name | Phone and desktop summary help tests |
| Help assumes a fixed 130 px height, allowing longer explanations to leave the viewport | Measure the actual panel, place above/below its source, clamp to viewport, and allow scrolling | 393×852 and 1280×1000 screenshots; viewport bounds and 16 px text assertions |
| Escape exits help and also dismisses the underlying room | Consume Escape in help mode and return focus to Help | Pawn help tests retain the Great Mosque room |
| Room expansion/return loses keyboard context | Keyboard activation focuses Back in the expanded room; closing restores the originating board tile | Reduced-motion keyboard entry/return tests on phone and desktop |
| Drawer scrolling ignores reduced motion | Use immediate scrolling for reduced-motion users | Existing drawer viewport coverage plus source review |

No game rules, randomness, network state, or normal pointer action sequence changed. The help-mode indicator is a static glow/ring, not another animation.

## Next proposed design experiments

These are deliberately recorded separately from the focused fixes above:

1. **Readable phone overview and summaries (highest priority).** `DockPlayerSummary` currently uses 10 px quantities and 12×18 px image boxes below 600 px. Painted symbols are smaller still. The sideways 4×4 board exposes many offers far below the 24 px symbol target. Test a reflowed, larger summary and a readable comparison view of reachable destinations, using the same faces and without requiring an extra confirmation. Compare it with the approved compact dock; do not silently revert that design.
2. **Explain unavailable choices.** Mosque offers say what they require but do not always explain precisely what the current player lacks. Add authoritative reasons in explicit help, preserving immediate selection of valid powers and preventing hover-only explanations.
3. **Reachable and oriented tabletop help/log controls.** Global controls are convenient on a phone but may be out of reach across a large physical table. Prototype per-seat access and orient help toward the invoking player. This requires real table-distance/touch review, not just a large browser screenshot.
4. **Quiet component surfaces.** Review the CSS-backed mosque offer/payout panels alongside the approved illustrated market trays. Any replacement should be independently layered artwork with empty live-information regions, not a newly flattened UI image. Judge the assembled small version before generating more detail.
5. **Animation pace and persistent explanation.** The log preserves outcomes and the lab has playback controls, but live bot turns have no equivalent pause/review affordance. Explore a presentation pause without altering game authority or revealing private information.

## Review evidence and limits

The new [browser tests](tests/e2e/038-contextual-help-and-focus/contextual-help-and-focus.spec.ts) capture explicit help in actual phone and desktop layouts. Inspect the images at native size:

- [Phone resource help](tests/e2e/038-contextual-help-and-focus/screenshots/live-resource-help-phone.png)
- [Desktop resource help](tests/e2e/038-contextual-help-and-focus/screenshots/live-resource-help-desktop.png)
- [Phone pawn help](tests/e2e/038-contextual-help-and-focus/screenshots/pawn-help-phone.png)
- [Desktop pawn help](tests/e2e/038-contextual-help-and-focus/screenshots/pawn-help-desktop.png)

A Chromium measurement of `arrival-3`, four players, bottom seat, at 100% browser zoom found:

| Viewport / surface | Summary quantity font | Summary image box | Board title font | Board mosque power box | Help target |
| --- | --- | --- | --- | --- | --- |
| 393×852 / personal | 10 px | 12×18 px | 9.93 px (sideways) | 15.9×15.9 px | 52×52 px |
| 1280×1000 / personal | 13 px | 20×20 px | 18.62 px | 31.5×31.5 px | 52×52 px |
| 1920×1080 / shared table | No dock | No dock | 18.73 px | 31.8×31.8 px | 52×52 px |

Image boxes include transparent margins, so painted symbols are smaller; these measurements do not certify their recognition. The phone power box is already below target before accounting for padding. Even the desktop summary numerals merit a later sizing experiment.

These checks establish contextual copy, placement and interaction behavior, not approval of all overview symbols. Real iOS touch, screen-reader, across-table reachability and human grayscale recognition checks remain outstanding. The board's compact presentation is explicitly not certified against the new size targets.
