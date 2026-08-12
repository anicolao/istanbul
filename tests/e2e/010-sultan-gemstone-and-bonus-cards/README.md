# Buying escalating rubies and playing Bonus cards at exact moments

Ada opens a two-player table with the reviewed 15-Lira Dealer and six-good Palace starts. A visible emulator-only review control supplies resources through the same immutable event stream. Ada plays a long-move card, pays the neutral merchant, buys and immediately repeats the Gemstone Dealer at the increased price, then reaches the Sultan, chooses the wild good, buys and repeats at the newly exposed seven-good cost. Along the route she plays direct Lira and good cards, reloads private state, and Bora performs every intervening turn through ordinary controls.

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

## 3. Ada chooses a two-player Short Path table

**Ada, the first merchant** — Ada chooses a two-player Short Path table

![Ada chooses a two-player Short Path table](./screenshots/002-host-chooses-two-seats-desktop.png)

**Verifications:**

- [x] Two players and Short Path are the visible form values
- [x] Draft configuration still has no immutable history

## 4. Ada creates private room RUBYS

**Ada, the first merchant** — Ada creates private room RUBYS

![Ada creates private room RUBYS](./screenshots/003-host-creates-room-desktop.png)

**Verifications:**

- [x] Ada owns seat one of two
- [x] One creation event projects the lobby

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

## 11. Ada supplies reviewed ruby-route resources

**Ada, the first merchant** — Ada supplies reviewed ruby-route resources

![Ada supplies reviewed ruby-route resources](./screenshots/006-host-supplies-reviewed-resources-desktop.png)

**Verifications:**

- [x] The resource rail shows 35 Lira, capacity three, and three of each good
- [x] All supplied cards are real reviewed manifest instances

## 12. Ada inspects A swift passage

**Ada, the first merchant** — Ada inspects A swift passage

![Ada inspects A swift passage](./screenshots/007-host-inspects-long-move-desktop.png)

**Verifications:**

- [x] The private card title and full effect text are visible
- [x] Private inspection writes no event

## 13. Ada plays A swift passage

**Ada, the first merchant** — Ada plays A swift passage

![Ada plays A swift passage](./screenshots/008-host-plays-long-move-desktop.png)

**Verifications:**

- [x] The selected private card is discarded after use
- [x] One canonical Bonus event records the effect

## 14. Ada selects Gemstone Dealer three spaces away

**Ada, the first merchant** — Ada selects Gemstone Dealer three spaces away

![Ada selects Gemstone Dealer three spaces away](./screenshots/009-host-selects-gemstone-long-route-desktop.png)

**Verifications:**

- [x] The distant Dealer is now reachable only through the card
- [x] Movement inspection preserves event seven

## 15. Ada crosses four spaces and meets the neutral Dealer merchant

**Ada, the first merchant** — Ada crosses four spaces and meets the neutral Dealer merchant

![Ada crosses four spaces and meets the neutral Dealer merchant](./screenshots/010-host-meets-neutral-at-dealer-desktop.png)

**Verifications:**

- [x] The neutral toll appears before any ruby purchase
- [x] The long-move effect is consumed by exact movement

## 16. Ada pays the neutral merchant at Gemstone Dealer

**Ada, the first merchant** — Ada pays the neutral merchant at Gemstone Dealer

![Ada pays the neutral merchant at Gemstone Dealer](./screenshots/011-host-pays-dealer-neutral-desktop.png)

**Verifications:**

- [x] The reviewed starting price is 15 Lira
- [x] Payment leaves 33 Lira and relocates the neutral merchant

## 17. Ada buys the 15-Lira Dealer ruby

**Ada, the first merchant** — Ada buys the 15-Lira Dealer ruby

![Ada buys the 15-Lira Dealer ruby](./screenshots/012-host-buys-first-dealer-ruby-desktop.png)

**Verifications:**

- [x] The public track advances immediately to 16
- [x] The completion panel names the exact payment

## 18. Ada inspects A second ruby offer

**Ada, the first merchant** — Ada inspects A second ruby offer

![Ada inspects A second ruby offer](./screenshots/013-host-inspects-repeat-dealer-desktop.png)

**Verifications:**

- [x] The repeat control names the newly increased price
- [x] Inspection preserves the first ruby at event ten

## 19. Ada repeats Gemstone Dealer at 16 Lira

**Ada, the first merchant** — Ada repeats Gemstone Dealer at 16 Lira

![Ada repeats Gemstone Dealer at 16 Lira](./screenshots/014-host-repeats-dealer-at-new-price-desktop.png)

**Verifications:**

- [x] The track advances a second time without a new movement
- [x] The discarded repeat card is no longer private

## 20. Ada ends the double-ruby Dealer turn

**Ada, the first merchant** — Ada ends the double-ruby Dealer turn

![Ada ends the double-ruby Dealer turn](./screenshots/015-host-ends-dealer-turn-desktop.png)

**Verifications:**

- [x] Bora begins turn two with Ada’s two rubies public
- [x] Both exact prices survive the completed action copy

## 21. Bora selects Police Station

**Bora, the second merchant** — Bora selects Police Station

![Bora selects Police Station](./screenshots/004-guest-selects-police-first-desktop.png)

**Verifications:**

- [x] Police Station is selected without changing history
- [x] The required assistant operation is visible

## 22. Bora arrives at Police Station

**Bora, the second merchant** — Bora arrives at Police Station

![Bora arrives at Police Station](./screenshots/005-guest-arrives-police-first-desktop.png)

**Verifications:**

- [x] Bora reaches the action phase exactly once
- [x] A Place action may be skipped explicitly

## 23. Bora skips Police Station and passes

**Bora, the second merchant** — Bora skips Police Station and passes

![Bora skips Police Station and passes](./screenshots/006-guest-ends-police-first-desktop.png)

**Verifications:**

- [x] Ada begins turn 3
- [x] Clockwise handoff stays diagnostic-free

## 24. Ada inspects A profitable bargain

**Ada, the first merchant** — Ada inspects A profitable bargain

![Ada inspects A profitable bargain](./screenshots/016-host-inspects-gain-lira-desktop.png)

**Verifications:**

- [x] The private card title and full effect text are visible
- [x] Private inspection writes no event

## 25. Ada plays A profitable bargain

**Ada, the first merchant** — Ada plays A profitable bargain

![Ada plays A profitable bargain](./screenshots/017-host-plays-gain-lira-desktop.png)

**Verifications:**

- [x] The selected private card is discarded after use
- [x] One canonical Bonus event records the effect

## 26. Ada inspects A swift passage

**Ada, the first merchant** — Ada inspects A swift passage

![Ada inspects A swift passage](./screenshots/018-host-inspects-second-long-move-desktop.png)

**Verifications:**

- [x] The private card title and full effect text are visible
- [x] Private inspection writes no event

## 27. Ada plays A swift passage

**Ada, the first merchant** — Ada plays A swift passage

![Ada plays A swift passage](./screenshots/019-host-plays-second-long-move-desktop.png)

**Verifications:**

- [x] The selected private card is discarded after use
- [x] One canonical Bonus event records the effect

## 28. Ada selects Sultan’s Palace beside the Dealer

**Ada, the first merchant** — Ada selects Sultan’s Palace beside the Dealer

![Ada selects Sultan’s Palace beside the Dealer](./screenshots/020-host-selects-palace-desktop.png)

**Verifications:**

- [x] The Palace is a legal adjacent route
- [x] Ada carries seven Lira and the extended goods capacity

## 29. Ada arrives at Sultan’s Palace

**Ada, the first merchant** — Ada arrives at Sultan’s Palace

![Ada arrives at Sultan’s Palace](./screenshots/021-host-arrives-palace-desktop.png)

**Verifications:**

- [x] The two-player track demands six goods
- [x] The exposed Palace index remains exact

## 30. Ada assigns spice to the first Palace wild cost

**Ada, the first merchant** — Ada assigns spice to the first Palace wild cost

![Ada assigns spice to the first Palace wild cost](./screenshots/022-host-chooses-first-palace-wild-desktop.png)

**Verifications:**

- [x] The visible wild selector reads Spice
- [x] Six-goods delivery is now enabled without an event

## 31. Ada delivers six goods for the Palace ruby

**Ada, the first merchant** — Ada delivers six goods for the Palace ruby

![Ada delivers six goods for the Palace ruby](./screenshots/023-host-buys-first-palace-ruby-desktop.png)

**Verifications:**

- [x] The first delivery conserves the extended goods
- [x] The completion panel reports the exact six-good delivery

## 32. Ada inspects A useful connection for jewelry

**Ada, the first merchant** — Ada inspects A useful connection for jewelry

![Ada inspects A useful connection for jewelry](./screenshots/024-host-inspects-gain-jewelry-desktop.png)

**Verifications:**

- [x] The private card title and full effect text are visible
- [x] Private inspection writes no event

## 33. Ada plays A useful connection for jewelry

**Ada, the first merchant** — Ada plays A useful connection for jewelry

![Ada plays A useful connection for jewelry](./screenshots/025-host-plays-gain-jewelry-desktop.png)

**Verifications:**

- [x] The selected private card is discarded after use
- [x] One canonical Bonus event records the effect

## 34. Ada inspects the next useful connection

**Ada, the first merchant** — Ada inspects the next useful connection

![Ada inspects the next useful connection](./screenshots/026-host-inspects-gain-spice-desktop.png)

**Verifications:**

- [x] The second private good card opens independently
- [x] Opening another private card writes no event

## 35. Ada chooses spice on the next useful connection

**Ada, the first merchant** — Ada chooses spice on the next useful connection

![Ada chooses spice on the next useful connection](./screenshots/027-host-chooses-spice-bonus-desktop.png)

**Verifications:**

- [x] The private selector visibly reads Spice
- [x] Changing a private card choice writes no event

## 36. Ada plays a useful connection for spice

**Ada, the first merchant** — Ada plays a useful connection for spice

![Ada plays a useful connection for spice](./screenshots/028-host-plays-gain-spice-desktop.png)

**Verifications:**

- [x] Spice and jewelry are both restored to two
- [x] The action remains in the repeat timing window

## 37. Ada inspects The Sultan grants another audience

**Ada, the first merchant** — Ada inspects The Sultan grants another audience

![Ada inspects The Sultan grants another audience](./screenshots/029-host-inspects-repeat-palace-desktop.png)

**Verifications:**

- [x] The repeat names the newly exposed seven-good cost
- [x] The replenished post-purchase goods are exact

## 38. Ada repeats Sultan’s Palace at seven goods

**Ada, the first merchant** — Ada repeats Sultan’s Palace at seven goods

![Ada repeats Sultan’s Palace at seven goods](./screenshots/030-host-repeats-palace-at-new-cost-desktop.png)

**Verifications:**

- [x] A fourth ruby and the eight-good next cost are public
- [x] The completion copy records both Palace deliveries

## 39. Ada reloads the completed repeat decision

**Ada, the first merchant** — Ada reloads the completed repeat decision

![Ada reloads the completed repeat decision](./screenshots/031-host-reloads-completed-repeat-desktop.png)

**Verifications:**

- [x] The spent private repeat card stays discarded
- [x] Replay restores event twenty-one byte-for-byte

## 40. Ada passes after the reviewed Palace shortfall

**Ada, the first merchant** — Ada passes after the reviewed Palace shortfall

![Ada passes after the reviewed Palace shortfall](./screenshots/032-host-ends-palace-turn-desktop.png)

**Verifications:**

- [x] Bora begins turn four
- [x] All four earned rubies remain public

## 41. Bora selects Fountain

**Bora, the second merchant** — Bora selects Fountain

![Bora selects Fountain](./screenshots/007-guest-selects-fountain-desktop.png)

**Verifications:**

- [x] Fountain is selected without changing history
- [x] The required assistant operation is visible

## 42. Bora arrives at Fountain

**Bora, the second merchant** — Bora arrives at Fountain

![Bora arrives at Fountain](./screenshots/008-guest-arrives-fountain-desktop.png)

**Verifications:**

- [x] Bora reaches the action phase exactly once
- [x] A Place action may be skipped explicitly

## 43. Bora skips Fountain and passes

**Bora, the second merchant** — Bora skips Fountain and passes

![Bora skips Fountain and passes](./screenshots/009-guest-ends-fountain-desktop.png)

**Verifications:**

- [x] Ada begins turn 5
- [x] Clockwise handoff stays diagnostic-free
