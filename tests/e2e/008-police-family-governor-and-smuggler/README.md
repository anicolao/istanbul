# Dispatching family and resolving every bazaar encounter

Ada sends her family member from Police Station to fill the Fabric Warehouse. Bora follows, performs the same warehouse action, meets the Smuggler, catches Ada’s family for a Bonus card, visits the Governor, makes the mandatory payment, checks both independently relocated tokens, reloads the finite turn-end state, and only then passes the turn.

## 1. Ada opens the private-table creator

**Ada, the first merchant** — Ada opens the private-table creator

![Ada opens the private-table creator](./screenshots/000-host-opens-creator-desktop.png)

**Verifications:**

- [x] Firebase reports ready before setup begins
- [x] The landing projection is empty

## 2. Ada enters the first merchant name

**Ada, the first merchant** — Ada enters the first merchant name

![Ada enters the first merchant name](./screenshots/001-host-enters-name-desktop.png)

**Verifications:**

- [x] Ada remains visible in the public-name field
- [x] Typing has not appended an event

## 3. Ada reviews the open-room setup

**Ada, the first merchant** — Ada reviews the open-room setup

![Ada reviews the open-room setup](./screenshots/002-host-reviews-open-room-desktop.png)

**Verifications:**

- [x] Short Path is visible and no player count is requested
- [x] Reviewing the open-room setup still has no immutable history

## 4. Ada creates private room CATCH

**Ada, the first merchant** — Ada creates private room CATCH

![Ada creates private room CATCH](./screenshots/003-host-creates-room-desktop.png)

**Verifications:**

- [x] Ada is the room creator and the room remains open
- [x] One creation event projects a five-player-capacity lobby

## 5. Bora follows Ada’s room invitation

**Bora, the second merchant** — Bora follows Ada’s room invitation

![Bora follows Ada’s room invitation](./screenshots/000-guest-opens-invitation-desktop.png)

**Verifications:**

- [x] Ada and Short Path identify the invited table
- [x] Bora observes exactly the creation event

## 6. Bora enters the second merchant name

**Bora, the second merchant** — Bora enters the second merchant name

![Bora enters the second merchant name](./screenshots/001-guest-enters-name-desktop.png)

**Verifications:**

- [x] Bora remains visible in the join field
- [x] Join is enabled and history is unchanged

## 7. Bora claims clockwise seat two

**Bora, the second merchant** — Bora claims clockwise seat two

![Bora claims clockwise seat two](./screenshots/002-guest-joins-desktop.png)

**Verifications:**

- [x] Both named seats appear in order
- [x] The join is event two with neither merchant ready

## 8. Bora readies for the reviewed layout

**Bora, the second merchant** — Bora readies for the reviewed layout

![Bora readies for the reviewed layout](./screenshots/003-guest-readies-desktop.png)

**Verifications:**

- [x] The table shows one of two merchants ready
- [x] Only Bora is ready in event three

## 9. Ada readies and unlocks the bazaar

**Ada, the first merchant** — Ada readies and unlocks the bazaar

![Ada readies and unlocks the bazaar](./screenshots/004-host-readies-desktop.png)

**Verifications:**

- [x] The host sees Table ready and an enabled start button
- [x] Event four has both merchants ready and no setup yet

## 10. Ada commits the seed and opens the bazaar

**Ada, the first merchant** — Ada commits the seed and opens the bazaar

![Ada commits the seed and opens the bazaar](./screenshots/005-host-starts-game-desktop.png)

**Verifications:**

- [x] All sixteen Place controls are rendered
- [x] Ada is the seeded first merchant at Fountain

## 11. Ada selects adjacent Police Station

**Ada, the first merchant** — Ada selects adjacent Police Station

![Ada selects adjacent Police Station](./screenshots/006-host-selects-police-desktop.png)

**Verifications:**

- [x] Police Station is selected as a one-space route
- [x] Ada is offered the ordinary assistant drop
- [x] Both available families occupy the lower Police corral, outside the visiting-piece row
- [x] The route selection changes no family position

## 12. Ada arrives at Police Station

**Ada, the first merchant** — Ada arrives at Police Station

![Ada arrives at Police Station](./screenshots/007-host-arrives-police-desktop.png)

**Verifications:**

- [x] The family destination control is visible
- [x] The default dispatch truthfully names Wainwright
- [x] The center now distinguishes Ada’s visiting merchant and assistant from both lower-corral families
- [x] Movement enters action without moving the family

## 13. Ada chooses Fabric Warehouse for her family member

**Ada, the first merchant** — Ada chooses Fabric Warehouse for her family member

![Ada chooses Fabric Warehouse for her family member](./screenshots/008-host-chooses-fabric-for-family-desktop.png)

**Verifications:**

- [x] Fabric Warehouse is visibly selected
- [x] The dispatch button updates before commitment
- [x] A local select does not append history

## 14. Ada dispatches her family to Fabric Warehouse

**Ada, the first merchant** — Ada dispatches her family to Fabric Warehouse

![Ada dispatches her family to Fabric Warehouse](./screenshots/009-host-dispatches-family-desktop.png)

**Verifications:**

- [x] The remote Warehouse action opens in place of Police
- [x] Ada leaves the Police corral while Bora remains available there
- [x] Ada’s family marker leaves Police for Place 2
- [x] No merchant toll or encounter interrupts family travel

## 15. Ada’s family fills her fabric wheelbarrow

**Ada, the first merchant** — Ada’s family fills her fabric wheelbarrow

![Ada’s family fills her fabric wheelbarrow](./screenshots/010-host-family-fills-fabric-desktop.png)

**Verifications:**

- [x] The family action reports exact capacity
- [x] Ada gains fabric while her merchant stays at Police
- [x] The only continuation is a deliberate turn end

## 16. Ada ends the completed family turn

**Ada, the first merchant** — Ada ends the completed family turn

![Ada ends the completed family turn](./screenshots/011-host-ends-family-turn-desktop.png)

**Verifications:**

- [x] Bora becomes the turn-two merchant
- [x] Ada’s family remains at Fabric Warehouse

## 17. Bora selects Fabric Warehouse where Ada’s family waits

**Bora, the second merchant** — Bora selects Fabric Warehouse where Ada’s family waits

![Bora selects Fabric Warehouse where Ada’s family waits](./screenshots/004-guest-selects-family-location-desktop.png)

**Verifications:**

- [x] The occupied Warehouse is a legal route
- [x] Bora can leave an assistant there
- [x] The Governor and Smuggler still share Place 2

## 18. Bora arrives among Ada’s family, Governor, and Smuggler

**Bora, the second merchant** — Bora arrives among Ada’s family, Governor, and Smuggler

![Bora arrives among Ada’s family, Governor, and Smuggler](./screenshots/005-guest-arrives-with-three-encounters-desktop.png)

**Verifications:**

- [x] Place action correctly precedes every other encounter
- [x] Arrival itself has not caught or moved any token
- [x] All family and special tokens remain at Fabric Warehouse in public state

## 19. Bora fills fabric before choosing encounter order

**Bora, the second merchant** — Bora fills fabric before choosing encounter order

![Bora fills fabric before choosing encounter order](./screenshots/006-guest-fills-before-encounters-desktop.png)

**Verifications:**

- [x] Three distinct encounter panels are offered
- [x] Every mandatory and optional choice is persisted
- [x] The Place action is complete before encounter event twelve

## 20. Bora chooses jewelry from the Smuggler

**Bora, the second merchant** — Bora chooses jewelry from the Smuggler

![Bora chooses jewelry from the Smuggler](./screenshots/007-guest-chooses-smuggled-jewelry-desktop.png)

**Verifications:**

- [x] Jewelry is the visible gain choice
- [x] The goods-payment button names jewelry and fabric
- [x] The uncommitted selection changes no goods

## 21. Bora takes jewelry and pays one fabric

**Bora, the second merchant** — Bora takes jewelry and pays one fabric

![Bora takes jewelry and pays one fabric](./screenshots/008-guest-trades-with-smuggler-desktop.png)

**Verifications:**

- [x] Smuggler controls disappear while other encounters remain
- [x] The trade and independent relocation are atomic
- [x] The Smuggler’s seeded result is public

## 22. Bora catches Ada’s family for a Bonus card

**Bora, the second merchant** — Bora catches Ada’s family for a Bonus card

![Bora catches Ada’s family for a Bonus card](./screenshots/009-guest-catches-family-for-card-desktop.png)

**Verifications:**

- [x] The mandatory family panel is gone
- [x] Ada’s returned family rejoins Bora in the lower Police corral
- [x] Ada’s family returns to Police and Bora’s hand grows
- [x] Governor remains independently optional

## 23. Bora accepts the Governor’s Bonus card

**Bora, the second merchant** — Bora accepts the Governor’s Bonus card

![Bora accepts the Governor’s Bonus card](./screenshots/010-guest-draws-from-governor-desktop.png)

**Verifications:**

- [x] Payment replaces the optional visit immediately
- [x] The drawn card is already available to discard
- [x] Reload-safe state requires payment before any other choice

## 24. Bora pays the Governor and rolls its relocation

**Bora, the second merchant** — Bora pays the Governor and rolls its relocation

![Bora pays the Governor and rolls its relocation](./screenshots/011-guest-pays-and-relocates-governor-desktop.png)

**Verifications:**

- [x] All encounters close into turn end
- [x] Governor payment, dice, and destination are one event
- [x] The two encounter tokens used independent public rolls

## 25. Bora reloads before ending the encounter turn

**Bora, the second merchant** — Bora reloads before ending the encounter turn

![Bora reloads before ending the encounter turn](./screenshots/012-guest-reloads-complete-encounters-desktop.png)

**Verifications:**

- [x] The complete encounter history returns inside the turn log
- [x] Both token positions, resources, and private hand replay exactly
- [x] The turn cannot repeat any completed encounter

## 26. Bora ends the fully resolved encounter turn

**Bora, the second merchant** — Bora ends the fully resolved encounter turn

![Bora ends the fully resolved encounter turn](./screenshots/013-guest-ends-encounter-turn-desktop.png)

**Verifications:**

- [x] Ada begins turn three
- [x] The transient ledger clears without undoing consequences
- [x] The observing client agrees after clockwise handoff
