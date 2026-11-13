# Istanbul visual design standard

Keep the approved Ottoman tabletop artwork, gold frames, old-style location numerals, cream wells, and green/gold controls. This standard adapts the Gaia Project, Supermega and Via Nova standards to Istanbul; it does not replace the game's established art direction. See [UX_DESIGN_PRINCIPLES.md](UX_DESIGN_PRINCIPLES.md) and the [November 2026 review](DESIGN_REVIEW.md).

## Shared graphical components

Use the existing production renderers for the game, gallery and animation lab: `LocationFace`, `LocationTile`, `PlayerMat`, `BonusCard`, `MarketDemand`, `GameArt` and `PlayingPiece`. Physical component bodies and frames remain artwork; HTML supplies layout, semantic controls and accurate live state. Generate new raster component artwork as independent layers with transparent openings and recorded prompts. Ordinary help, navigation and review controls need not pretend to be physical pieces.

Do not bake changing costs, quantities, ownership or availability into artwork. Use the same symbol for the same meaning on a mat, offer, flight and summary. Judge visible painted bounds, excluding transparent padding. Crop and prefilter assets where browser downsampling damages their legibility; do not sharpen noise or stretch aspect ratios.

## Information before decoration

Identity and silhouette come first, decision information second, material and ornament third. Keep numbers and symbols on quiet surfaces. A resource must fit completely inside its well; its checkmark and focus indicator must not collide with the rim. Preserve the accepted common baseline of the location numerals. Use clear sans-serif text for changing quantities and rules.

At the smallest intended use, start review with these targets (not claims of current compliance):

| Information | Review target at 100% browser zoom |
| --- | --- |
| Primary symbol | 24 px visible shorter dimension; prefer 32 px for unfamiliar powers |
| Essential secondary symbol | 18 px visible shorter dimension |
| Gameplay quantity | 16 px; larger where players read from across a table |
| Required explanation | 14 px minimum; current explicit help uses 16 px |
| Touch target | 44 × 44 px with no overlapping targets |

If the artwork cannot carry required information at its actual size, simplify or recompose the shared component. Increasing its source resolution or hit area alone does not solve recognition.

## Overview and action surfaces

The overview must identify locations, ownership, destinations and relevant offers well enough to compare choices. The same room may expand for detailed interaction. Do not use help or enlargement as the only way to recover ordinary decision information. Keep the map's aspect ratio, the accepted device-specific board orientation, and contextual movement between board and room; propose a layout experiment before replacing them.

Phone summaries and board-scale offers currently fall below these size targets. Treat that as an open design issue, not a reason to claim the layout passes because all sixteen tiles fit. A future readable overview experiment must retain the fast direct flow and compare against the approved compact layout.

## State and review

Use selection and legal-target treatments only for actual game states. Keyboard focus must remain visible and distinguishable from the player's color. Help mode must be explicit and static under reduced motion. Disabled choices need useful explanations, including any missing resources or prior use.

Review both normal and expanded production components on a 393 px phone, landscape phone, tablet, desktop and crowded shared table. Check grayscale recognition, source/destination continuity, readable text, complete icons and non-overlapping hit areas. Record the viewport, scenario and observed limitations. Screenshot parity detects visual changes; it does not establish human recognition, touch usability or tabletop reachability. Record real hardware checks separately.
