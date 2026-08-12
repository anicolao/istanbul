# Routing mail, trading private cards, and serving both Markets

Ada and Bora narrate every input from an empty private room through seven ordinary turns. They advance the exact Post Office mail track twice, draw and discard Bonus cards from both legal Caravansary sources, fill fabric, make one legal sale at each Market, rotate both Demand stacks, reload the completed Large Market action, and continuously compare canonical state across both browsers.

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

## 4. Ada creates private room TRADE

**Ada, the first merchant** — Ada creates private room TRADE

![Ada creates private room TRADE](./screenshots/003-host-creates-room-desktop.png)

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

## 11. Ada selects Post Office two spaces away

**Ada, the first merchant** — Ada selects Post Office two spaces away

![Ada selects Post Office two spaces away](./screenshots/006-host-selects-post-office-desktop.png)

**Verifications:**

- [x] Post Office is a selected legal route
- [x] The route requires one assistant drop
- [x] Route inspection leaves event five canonical

## 12. Ada arrives and exposes the initial mail route

**Ada, the first merchant** — Ada arrives and exposes the initial mail route

![Ada arrives and exposes the initial mail route](./screenshots/007-host-arrives-post-office-desktop.png)

**Verifications:**

- [x] All four indicators are visibly upper
- [x] The collection control is enabled
- [x] No mail resource is granted by movement alone

## 13. Ada collects the first four uncovered resources

**Ada, the first merchant** — Ada collects the first four uncovered resources

![Ada collects the first four uncovered resources](./screenshots/008-host-collects-first-mail-desktop.png)

**Verifications:**

- [x] The completion copy lists spice, fabric, fruit, and 1 Lira
- [x] The leftmost indicator alone moves lower
- [x] The action cannot be collected twice

## 14. Ada passes the completed mail turn clockwise

**Ada, the first merchant** — Ada passes the completed mail turn clockwise

![Ada passes the completed mail turn clockwise](./screenshots/009-host-ends-mail-turn-desktop.png)

**Verifications:**

- [x] Bora begins turn two in movement
- [x] Mail resources and the lower indicator persist

## 15. Bora selects Caravansary two spaces away

**Bora, the second merchant** — Bora selects Caravansary two spaces away

![Bora selects Caravansary two spaces away](./screenshots/004-guest-selects-caravansary-desktop.png)

**Verifications:**

- [x] Caravansary is selected and reachable
- [x] Bora is offered an assistant drop
- [x] Bora still has one private card

## 16. Bora arrives and previews two deck cards

**Bora, the second merchant** — Bora arrives and previews two deck cards

![Bora arrives and previews two deck cards](./screenshots/005-guest-arrives-caravansary-desktop.png)

**Verifications:**

- [x] Both ordered card sources begin on Draw pile
- [x] Three private discard choices are rendered without exposing them to Ada
- [x] Previewing consumes no card or event

## 17. Bora chooses the original hand card to discard

**Bora, the second merchant** — Bora chooses the original hand card to discard

![Bora chooses the original hand card to discard](./screenshots/006-guest-chooses-original-card-desktop.png)

**Verifications:**

- [x] The named private card is visibly selected
- [x] The trade control becomes enabled
- [x] The local radio choice is not canonical state

## 18. Bora takes two deck cards and discards the original

**Bora, the second merchant** — Bora takes two deck cards and discards the original

![Bora takes two deck cards and discards the original](./screenshots/007-guest-trades-deck-cards-desktop.png)

**Verifications:**

- [x] The completion panel reports two cards retained
- [x] Bora privately sees two cards while Ada sees only a count
- [x] Two draws and one discard conserve the card manifest

## 19. Bora passes after the private card trade

**Bora, the second merchant** — Bora passes after the private card trade

![Bora passes after the private card trade](./screenshots/008-guest-ends-first-caravan-turn-desktop.png)

**Verifications:**

- [x] Ada starts turn three
- [x] The public discard remains face-up in state

## 20. Ada routes from Post Office to Fabric Warehouse

**Ada, the first merchant** — Ada routes from Post Office to Fabric Warehouse

![Ada routes from Post Office to Fabric Warehouse](./screenshots/010-host-selects-fabric-desktop.png)

**Verifications:**

- [x] The adjacent warehouse is selected
- [x] Ada must leave her second assistant
- [x] Ada owns one fabric before filling

## 21. Ada arrives at Fabric Warehouse

**Ada, the first merchant** — Ada arrives at Fabric Warehouse

![Ada arrives at Fabric Warehouse](./screenshots/011-host-arrives-fabric-desktop.png)

**Verifications:**

- [x] The CTA offers capacity two
- [x] Movement leaves goods unchanged

## 22. Ada fills fabric to wheelbarrow capacity

**Ada, the first merchant** — Ada fills fabric to wheelbarrow capacity

![Ada fills fabric to wheelbarrow capacity](./screenshots/012-host-fills-fabric-desktop.png)

**Verifications:**

- [x] The two-crate track is full
- [x] The warehouse closes in turn-end

## 23. Ada passes the filled warehouse turn

**Ada, the first merchant** — Ada passes the filled warehouse turn

![Ada passes the filled warehouse turn](./screenshots/013-host-ends-fabric-turn-desktop.png)

**Verifications:**

- [x] Bora starts turn four
- [x] Ada’s market stock remains public

## 24. Bora routes two spaces north to Post Office

**Bora, the second merchant** — Bora routes two spaces north to Post Office

![Bora routes two spaces north to Post Office](./screenshots/009-guest-selects-post-office-desktop.png)

**Verifications:**

- [x] Post Office is selected from Caravansary
- [x] A second placed assistant is required
- [x] Exactly the first mail indicator is already lower

## 25. Bora arrives at the advanced mail track

**Bora, the second merchant** — Bora arrives at the advanced mail track

![Bora arrives at the advanced mail track](./screenshots/010-guest-arrives-post-office-desktop.png)

**Verifications:**

- [x] The accessible track names lower then three upper indicators
- [x] Bora still has no goods before collection

## 26. Bora collects the second mail combination

**Bora, the second merchant** — Bora collects the second mail combination

![Bora collects the second mail combination](./screenshots/011-guest-collects-second-mail-desktop.png)

**Verifications:**

- [x] The completion copy names two fabric, one fruit, and 1 Lira
- [x] The first two indicators are now lower

## 27. Bora passes after the second mail collection

**Bora, the second merchant** — Bora passes after the second mail collection

![Bora passes after the second mail collection](./screenshots/012-guest-ends-mail-turn-desktop.png)

**Verifications:**

- [x] Ada starts turn five
- [x] Both merchants retain their distinct goods

## 28. Ada selects Small Market two spaces south

**Ada, the first merchant** — Ada selects Small Market two spaces south

![Ada selects Small Market two spaces south](./screenshots/014-host-selects-small-market-desktop.png)

**Verifications:**

- [x] Small Market is visibly reachable
- [x] Ada can leave a third assistant
- [x] No Demand rotates during inspection

## 29. Ada arrives at Small Market with sale stock

**Ada, the first merchant** — Ada arrives at Small Market with sale stock

![Ada arrives at Small Market with sale stock](./screenshots/015-host-arrives-small-market-desktop.png)

**Verifications:**

- [x] Five depicted Demand slots are ordinary checkboxes
- [x] No selection means the sale is disabled
- [x] The active Demand is still on top

## 30. Ada selects one depicted fabric for the Small Market

**Ada, the first merchant** — Ada selects one depicted fabric for the Small Market

![Ada selects one depicted fabric for the Small Market](./screenshots/016-host-chooses-small-sale-desktop.png)

**Verifications:**

- [x] The chosen Demand slot is visibly checked
- [x] One good earns the official 2 Lira
- [x] Selection does not rotate or spend yet

## 31. Ada completes the one-good Small Market sale

**Ada, the first merchant** — Ada completes the one-good Small Market sale

![Ada completes the one-good Small Market sale](./screenshots/017-host-sells-small-market-desktop.png)

**Verifications:**

- [x] The completion panel reports the exact revenue
- [x] The used Demand moves to the bottom
- [x] Exactly the selected good was spent

## 32. Ada passes after rotating Small Market

**Ada, the first merchant** — Ada passes after rotating Small Market

![Ada passes after rotating Small Market](./screenshots/018-host-ends-small-market-turn-desktop.png)

**Verifications:**

- [x] Bora starts turn six
- [x] The rotation remains canonical in movement

## 33. Bora selects her placed Caravansary assistant

**Bora, the second merchant** — Bora selects her placed Caravansary assistant

![Bora selects her placed Caravansary assistant](./screenshots/013-guest-selects-return-caravan-desktop.png)

**Verifications:**

- [x] Caravansary is selected two spaces south
- [x] The CTA now offers assistant pick-up
- [x] The public discard still holds Bora’s original card

## 34. Bora returns and picks up the Caravansary assistant

**Bora, the second merchant** — Bora returns and picks up the Caravansary assistant

![Bora returns and picks up the Caravansary assistant](./screenshots/014-guest-returns-caravansary-desktop.png)

**Verifications:**

- [x] The discard source is now enabled
- [x] Bora carries three assistants after the pick-up

## 35. Bora chooses the face-up discard as the first draw

**Bora, the second merchant** — Bora chooses the face-up discard as the first draw

![Bora chooses the face-up discard as the first draw](./screenshots/015-guest-selects-discard-source-desktop.png)

**Verifications:**

- [x] The first source visibly reads Discard pile
- [x] The preview names the returned original card
- [x] Changing a private source appends no event

## 36. Bora selects one current hand card for the exchange

**Bora, the second merchant** — Bora selects one current hand card for the exchange

![Bora selects one current hand card for the exchange](./screenshots/016-guest-chooses-new-discard-desktop.png)

**Verifications:**

- [x] The chosen private title is checked
- [x] The discard/deck exchange is enabled
- [x] Bora still owns two canonical cards before committing

## 37. Bora takes one discard and one deck card, then discards one

**Bora, the second merchant** — Bora takes one discard and one deck card, then discards one

![Bora takes one discard and one deck card, then discards one](./screenshots/017-guest-trades-discard-card-desktop.png)

**Verifications:**

- [x] The second trade leaves exactly three cards in hand
- [x] The new face-up discard is the selected hand card
- [x] Ada sees three hidden cards and no private title

## 38. Bora passes after reclaiming the face-up card

**Bora, the second merchant** — Bora passes after reclaiming the face-up card

![Bora passes after reclaiming the face-up card](./screenshots/018-guest-ends-second-caravan-turn-desktop.png)

**Verifications:**

- [x] Ada starts turn seven
- [x] All private-card counts survive turn closure

## 39. Ada selects Large Market two spaces away

**Ada, the first merchant** — Ada selects Large Market two spaces away

![Ada selects Large Market two spaces away](./screenshots/019-host-selects-large-market-desktop.png)

**Verifications:**

- [x] Large Market is a legal final route
- [x] Ada can leave her last carried assistant
- [x] Large Demand has not rotated yet

## 40. Ada arrives at Large Market with remaining stock

**Ada, the first merchant** — Ada arrives at Large Market with remaining stock

![Ada arrives at Large Market with remaining stock](./screenshots/020-host-arrives-large-market-desktop.png)

**Verifications:**

- [x] Five Large Market slots are visible
- [x] The sale begins disabled with zero selected
- [x] Ada now has zero carried assistants but may finish this action

## 41. Ada selects one depicted fabric for Large Market

**Ada, the first merchant** — Ada selects one depicted fabric for Large Market

![Ada selects one depicted fabric for Large Market](./screenshots/021-host-chooses-large-sale-desktop.png)

**Verifications:**

- [x] The Large Market slot is checked
- [x] One good again displays the 2-Lira tier
- [x] The local selection has not spent stock

## 42. Ada completes the Large Market sale

**Ada, the first merchant** — Ada completes the Large Market sale

![Ada completes the Large Market sale](./screenshots/022-host-sells-large-market-desktop.png)

**Verifications:**

- [x] The exact sale summary is visible
- [x] Large Demand rotates independently
- [x] Bora observes the same public market state

## 43. Ada reloads the completed Large Market turn

**Ada, the first merchant** — Ada reloads the completed Large Market turn

![Ada reloads the completed Large Market turn](./screenshots/023-host-reloads-large-market-desktop.png)

**Verifications:**

- [x] Replay restores the non-repeatable completion panel
- [x] Both Demand rotations and card exchange replay exactly
- [x] End turn is the sole continuation

## 44. Ada passes the fully replayed economy turn

**Ada, the first merchant** — Ada passes the fully replayed economy turn

![Ada passes the fully replayed economy turn](./screenshots/024-host-ends-large-market-turn-desktop.png)

**Verifications:**

- [x] Bora begins turn eight
- [x] Twenty-six canonical events close with no diagnostics
- [x] Both browsers project identical public players, Demand, mail, and discard
