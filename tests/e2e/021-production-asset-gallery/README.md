# Reviewing every Istanbul production component

The reviewer opens the dedicated gallery without creating a game and walks every page of live locations, player trays, playing pieces, Bonus cards, Market demands, and physical components. Locations are the same rectangular, titled, rounded LocationTile instances used on the board; their status apparatus and occupants come from a deterministic game projection. Trays use PlayerTray, rules cards use BonusCard, and demands use MarketDemand. Stable review IDs, renderer names, representative props, loaded production images, responsive pagination, and the no-scroll/no-clipping contract are checked after every input.

## 1. The reviewer opens the complete production gallery

**The art reviewer** — The reviewer opens the complete production gallery

![The reviewer opens the complete production gallery](./screenshots/000-reviewer-opens-gallery-desktop.png)

**Verifications:**

- [x] The gallery declares 85 rendered review states backed by the complete 73-asset manifest
- [x] All six logical-component category totals are immediately visible
- [x] The first six numbered locations are real LocationTile components with public state

## 2. The reviewer enlarges the Wainwright board square

**The art reviewer** — The reviewer enlarges the Wainwright board square

![The reviewer enlarges the Wainwright board square](./screenshots/001-reviewer-enlarges-wainwright-desktop.png)

**Verifications:**

- [x] The modal names the stable review reference, renderer, and representative props
- [x] The full component is rectangular, rounded, titled, and backed by loaded production art

## 3. The reviewer closes the enlarged board square

**The art reviewer** — The reviewer closes the enlarged board square

![The reviewer closes the enlarged board square](./screenshots/002-reviewer-closes-wainwright-desktop.png)

**Verifications:**

- [x] The unclipped first LocationTile page returns

## 4. The reviewer advances to board squares seven through twelve

**The art reviewer** — The reviewer advances to board squares seven through twelve

![The reviewer advances to board squares seven through twelve](./screenshots/003-reviewer-opens-board-squares-7-12-desktop.png)

**Verifications:**

- [x] The next exact rendered-state slice replaces the prior page without scrolling

## 5. The reviewer advances to the final four board squares

**The art reviewer** — The reviewer advances to the final four board squares

![The reviewer advances to the final four board squares](./screenshots/004-reviewer-opens-board-squares-13-16-desktop.png)

**Verifications:**

- [x] The next exact rendered-state slice replaces the prior page without scrolling

## 6. The reviewer opens five live PlayerTray states

**The art reviewer** — The reviewer opens five live PlayerTray states

![The reviewer opens five live PlayerTray states](./screenshots/005-reviewer-opens-player-mats-desktop.png)

**Verifications:**

- [x] Player trays resets to its first complete rendered-component page

## 7. The reviewer opens the first GameArt playing-piece page

**The art reviewer** — The reviewer opens the first GameArt playing-piece page

![The reviewer opens the first GameArt playing-piece page](./screenshots/006-reviewer-opens-player-pieces-desktop.png)

**Verifications:**

- [x] Playing pieces resets to its first complete rendered-component page

## 8. The reviewer advances through assistants and family members

**The art reviewer** — The reviewer advances through assistants and family members

![The reviewer advances through assistants and family members](./screenshots/007-reviewer-opens-assistants-desktop.png)

**Verifications:**

- [x] The next exact rendered-state slice replaces the prior page without scrolling

## 9. The reviewer advances through family and neutral figures

**The art reviewer** — The reviewer advances through family and neutral figures

![The reviewer advances through family and neutral figures](./screenshots/008-reviewer-opens-families-and-neutrals-desktop.png)

**Verifications:**

- [x] The next exact rendered-state slice replaces the prior page without scrolling

## 10. The reviewer reaches the first-player and dice markers

**The art reviewer** — The reviewer reaches the first-player and dice markers

![The reviewer reaches the first-player and dice markers](./screenshots/009-reviewer-opens-special-markers-desktop.png)

**Verifications:**

- [x] The next exact rendered-state slice replaces the prior page without scrolling

## 11. The reviewer opens the first six Bonus-card faces

**The art reviewer** — The reviewer opens the first six Bonus-card faces

![The reviewer opens the first six Bonus-card faces](./screenshots/010-reviewer-opens-first-bonus-faces-desktop.png)

**Verifications:**

- [x] Bonus cards resets to its first complete rendered-component page

## 12. The reviewer reaches every remaining face, back, and deck image

**The art reviewer** — The reviewer reaches every remaining face, back, and deck image

![The reviewer reaches every remaining face, back, and deck image](./screenshots/011-reviewer-opens-remaining-bonus-art-desktop.png)

**Verifications:**

- [x] The next exact rendered-state slice replaces the prior page without scrolling

## 13. The reviewer opens all six Large MarketDemand states

**The art reviewer** — The reviewer opens all six Large MarketDemand states

![The reviewer opens all six Large MarketDemand states](./screenshots/012-reviewer-opens-large-demand-tiles-desktop.png)

**Verifications:**

- [x] Market demands resets to its first complete rendered-component page
- [x] Each demand uses five circular resource portraits over the printed medallion positions

## 14. The reviewer opens all six Small MarketDemand states

**The art reviewer** — The reviewer opens all six Small MarketDemand states

![The reviewer opens all six Small MarketDemand states](./screenshots/013-reviewer-opens-small-demand-tiles-desktop.png)

**Verifications:**

- [x] The next exact rendered-state slice replaces the prior page without scrolling
- [x] The second demand set preserves all five circular resource overlays

## 15. The reviewer opens the goods, money, and ruby GameArt components

**The art reviewer** — The reviewer opens the goods, money, and ruby GameArt components

![The reviewer opens the goods, money, and ruby GameArt components](./screenshots/014-reviewer-opens-goods-and-rubies-desktop.png)

**Verifications:**

- [x] Physical components resets to its first complete rendered-component page

## 16. The reviewer advances through upgrades, markers, and the first Mosque powers

**The art reviewer** — The reviewer advances through upgrades, markers, and the first Mosque powers

![The reviewer advances through upgrades, markers, and the first Mosque powers](./screenshots/015-reviewer-opens-upgrades-and-first-powers-desktop.png)

**Verifications:**

- [x] The next exact rendered-state slice replaces the prior page without scrolling

## 17. The reviewer advances through the remaining powers and public tracks

**The art reviewer** — The reviewer advances through the remaining powers and public tracks

![The reviewer advances through the remaining powers and public tracks](./screenshots/016-reviewer-opens-powers-and-public-tracks-desktop.png)

**Verifications:**

- [x] The next exact rendered-state slice replaces the prior page without scrolling

## 18. The reviewer reaches the final ruby and goods supplies

**The art reviewer** — The reviewer reaches the final ruby and goods supplies

![The reviewer reaches the final ruby and goods supplies](./screenshots/017-reviewer-opens-public-supplies-desktop.png)

**Verifications:**

- [x] The next exact rendered-state slice replaces the prior page without scrolling

## 19. The reviewer enlarges the final goods-supply component

**The art reviewer** — The reviewer enlarges the final goods-supply component

![The reviewer enlarges the final goods-supply component](./screenshots/018-reviewer-enlarges-final-component-desktop.png)

**Verifications:**

- [x] The last review state names its stable reference and exact GameArt props
- [x] The final logical component loads at full review size
