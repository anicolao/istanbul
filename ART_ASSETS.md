# Original art assets

Istanbul's interface uses original production artwork rather than scans,
publisher files, or temporary placeholders. The art is intentionally distinct
from the published game's illustrations and trade dress. Exact rules text,
names, quantities, ownership, and accessibility labels remain live HTML so the
art never becomes the only source of game information.

## Shipped inventory

The browser receives 73 optimized WebP assets under `static/art/game`:

- 16 individually rendered Place scenes;
- five merchants, five assistants, and five family members, one in every player
  colour;
- a neutral merchant, Governor, Smuggler, first-player marker, and dice;
- ten Bonus-card effect faces, one card back, and one deck image;
- five colour-keyed physical player trays with aligned goods tracks,
  wheelbarrow and ruby sockets, purse and card wells, and four power recesses;
- four goods, Lira, rubies, wheelbarrow extensions, a mail marker, Mosque tiles,
  demand tiles, ruby tracks, and public supply pieces.

`src/lib/game/art.ts` is the typed manifest tying every rules concept to one
asset. `src/lib/game/art.test.ts` fails if a mapping is incomplete, duplicated,
or absent from the static bundle. The browser journey in
`tests/e2e/015-production-graphical-assets` proves that the images load on a
real seeded table while DOM and replay-state assertions prove the visuals do
not alter or hide canonical game information.

The standalone `/gallery/` route is a production component review room, not a
raw-file browser. It renders 85 representative states through the same logical
Svelte boundaries used by live play: `LocationTile` composes location art,
titles, rounded framing, occupants, encounters, and `LocationState` apparatus;
`PlayerTray` composes mats and player resources; `BonusCard` includes its live
rules treatment; `MarketDemand` places five circular, cropped goods portraits
over the generated market medallion; physical pieces use `GameArt`. The
deterministic gallery projection makes changing
Post Office, Caravansary, Market, Mosque, Palace, Police, Fountain, player-tray,
and encounter state visible without requiring a room.

Six rendered states fit on each fixed page at phone and desktop sizes. Every
item opens at review size and carries a stable reference, renderer name, and
representative props. Scenario 021 walks the entire catalogue, validates every
renderer and nested loaded image, enforces the no-scroll/no-clipping contract,
and captures an exact screenshot after every reviewer action. The typed art
manifest remains unit-tested separately to guarantee all 73 underlying files
ship, but source files are never presented as though they were the finished UI.

## Live location state

Every Place scene carries a location-specific physical state apparatus derived
from the canonical replay projection. It shows the current Post Office mail windows;
Caravansary deck size, discard size, and top discard; both Market demands;
Mosque offers, costs, and remaining ruby rewards; Sultan and Gemstone ruby
tracks; and each other Place's applicable capacity, payout, dice, family, or
assistant state. These are arranged as mail boards, card piles, demand tiles,
ruby tracks, cost wells, dice areas, and component racks rather than a shared
status ribbon. The same exact state is included in the Place button's
accessible name and a machine-readable `data-state-summary` attribute.

The state displays compose the existing component artwork rather than baking
changing values into location paintings. E2E journeys therefore verify both
the visible transition after each action and the exact corresponding DOM and
serialized game state.

Mosque powers are full square punchboard assets. They begin as large visible
offers at the two Mosques, then the acquired square appears in the matching
recess on the player's tray. Empty recesses remain visibly empty, making
ownership and ability availability read like physical tabletop state.

## Source and regeneration

The five lossless source atlases live in `art/source-atlases`. They were created
with OpenAI's built-in image-generation tool from the following production
briefs:

- a strict 4×4 atlas of the sixteen bazaar locations in numeric order;
- a strict 5×4 atlas of colour-keyed merchants, assistants, family pieces,
  neutral characters, the starting marker, and dice;
- a strict 4×3 atlas of the ten Bonus-card effects, card back, and deck;
- a strict 1×5 atlas of identically structured colour-keyed physical trays;
- a strict 2×2 atlas of the four square Mosque-power tiles;
- a strict 5×4 atlas of goods, money, rubies, upgrades, tiles, tracks, and
  supplies.

Every brief specified a warm painterly tabletop style with carved wood, brass,
parchment, and jewel-toned enamel; strict row-major order; thumbnail
legibility; and no text, labels, logos, trademarks, watermarks, modern objects,
or publisher trade dress.

To regenerate the optimized browser files after deliberately replacing a
source atlas:

```sh
nix shell nixpkgs#imagemagick --command bash scripts/build-art-assets.sh
```

The generated images and their optimized derivatives are project-bound assets
distributed under the repository's GPL-3.0-only license.
