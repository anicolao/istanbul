# Undoing a turn without unseeing hidden information

Ada and Bora open a normal two-player bazaar. Ada plays and undoes a Bonus card, deliberately replays it, moves to Small Market, sells a good, and walks backward through the sale, movement, and card play one immutable undo event at a time. She then replays a different route to Tea House; rolling dice visibly locks undo at the information boundary. Every input is followed by a screenshot and programmatic checks of the controls, canonical log, replayed state, opponent convergence, private hand, goods, demand, assistants, and dice.

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

## 4. Ada creates private room UNDOD

**Ada, the first merchant** — Ada creates private room UNDOD

![Ada creates private room UNDOD](./screenshots/003-host-creates-room-desktop.png)

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

## 11. Ada receives the reviewed goods and real Bonus cards

**Ada, the first merchant** — Ada receives the reviewed goods and real Bonus cards

![Ada receives the reviewed goods and real Bonus cards](./screenshots/006-host-opens-undo-review-position-desktop.png)

**Verifications:**

- [x] The supplied position has three of each good and a profitable bargain
- [x] Review setup itself does not masquerade as an undoable player action

## 12. Ada inspects a profitable bargain before playing it

**Ada, the first merchant** — Ada inspects a profitable bargain before playing it

![Ada inspects a profitable bargain before playing it](./screenshots/007-host-inspects-reversible-bonus-desktop.png)

**Verifications:**

- [x] The private illustrated card promises five Lira
- [x] Private inspection changes no event or public resource

## 13. Ada plays the Bonus card for five Lira

**Ada, the first merchant** — Ada plays the Bonus card for five Lira

![Ada plays the Bonus card for five Lira](./screenshots/008-host-plays-reversible-bonus-desktop.png)

**Verifications:**

- [x] The card moves from hand to discard and raises Ada to forty Lira
- [x] The author receives an enabled semantic undo control
- [x] Bora converges on the public money but still sees only a hidden hand count

## 14. Ada writes an undo event for the Bonus play

**Ada, the first merchant** — Ada writes an undo event for the Bonus play

![Ada writes an undo event for the Bonus play](./screenshots/009-host-undoes-bonus-desktop.png)

**Verifications:**

- [x] Replay restores the exact private hand, money, and discard from before the play
- [x] Immutable history grows to eight and names the reversed event
- [x] The visible log explains that state was restored before the play
- [x] Bora independently replays the same rollback

## 15. Ada selects the restored card to replay her choice

**Ada, the first merchant** — Ada selects the restored card to replay her choice

![Ada selects the restored card to replay her choice](./screenshots/010-host-reselects-restored-bonus-desktop.png)

**Verifications:**

- [x] The same card identity is privately selected again
- [x] Selection remains local while the undo record remains immutable

## 16. Ada deliberately replays the same Bonus effect

**Ada, the first merchant** — Ada deliberately replays the same Bonus effect

![Ada deliberately replays the same Bonus effect](./screenshots/011-host-replays-bonus-desktop.png)

**Verifications:**

- [x] The replacement play is a new ninth event and restores forty Lira
- [x] The new play can itself be undone without resurrecting the old event

## 17. Ada plans a new route to Small Market

**Ada, the first merchant** — Ada plans a new route to Small Market

![Ada plans a new route to Small Market](./screenshots/012-host-selects-small-market-for-replay-desktop.png)

**Verifications:**

- [x] Small Market is selected as reachable
- [x] Route inspection is local and adds no event

## 18. Ada moves to Small Market and leaves an assistant

**Ada, the first merchant** — Ada moves to Small Market and leaves an assistant

![Ada moves to Small Market and leaves an assistant](./screenshots/013-host-moves-to-small-market-desktop.png)

**Verifications:**

- [x] Movement is event ten and becomes the next undo target
- [x] The full five-slot demand is shown for a real sale

## 19. Ada selects the first depicted good for sale

**Ada, the first merchant** — Ada selects the first depicted good for sale

![Ada selects the first depicted good for sale](./screenshots/014-host-selects-market-good-desktop.png)

**Verifications:**

- [x] The demand slot is visibly selected and worth two Lira
- [x] A local checkbox does not alter canonical history

## 20. Ada trades the selected good for two Lira

**Ada, the first merchant** — Ada trades the selected good for two Lira

![Ada trades the selected good for two Lira](./screenshots/015-host-sells-market-good-desktop.png)

**Verifications:**

- [x] The sale spends one printed good, pays two Lira, and rotates demand
- [x] Trading goods remains explicitly undoable

## 21. Ada reverses the market trade

**Ada, the first merchant** — Ada reverses the market trade

![Ada reverses the market trade](./screenshots/016-host-undoes-market-sale-desktop.png)

**Verifications:**

- [x] Goods, Lira, demand order, and action phase return exactly
- [x] The next undo now walks backward to movement
- [x] Bora converges without a compensating money or goods mutation

## 22. Ada reverses movement and recovers her assistant

**Ada, the first merchant** — Ada reverses movement and recovers her assistant

![Ada reverses movement and recovers her assistant](./screenshots/017-host-undoes-market-movement-desktop.png)

**Verifications:**

- [x] The merchant, assistant stack, and movement phase match the pre-route state
- [x] The earlier replacement Bonus play is now the latest active event

## 23. Ada completes the rollback to her original reviewed turn

**Ada, the first merchant** — Ada completes the rollback to her original reviewed turn

![Ada completes the rollback to her original reviewed turn](./screenshots/018-host-undoes-replayed-bonus-desktop.png)

**Verifications:**

- [x] The private card and thirty-five Lira are restored after three consecutive undos
- [x] No active player action remains above the reviewed fixture boundary

## 24. Ada now chooses a different route to Tea House

**Ada, the first merchant** — Ada now chooses a different route to Tea House

![Ada now chooses a different route to Tea House](./screenshots/019-host-selects-tea-house-desktop.png)

**Verifications:**

- [x] Tea House is a legal two-space destination
- [x] The planner offers the normal assistant drop

## 25. Ada arrives at Tea House before any dice are exposed

**Ada, the first merchant** — Ada arrives at Tea House before any dice are exposed

![Ada arrives at Tea House before any dice are exposed](./screenshots/020-host-arrives-tea-house-desktop.png)

**Verifications:**

- [x] The reversible move is event fifteen
- [x] Undo remains enabled until the roll occurs

## 26. Ada rolls at Tea House and reaches the information boundary

**Ada, the first merchant** — Ada rolls at Tea House and reaches the information boundary

![Ada rolls at Tea House and reaches the information boundary](./screenshots/021-host-rolls-and-locks-undo-desktop.png)

**Verifications:**

- [x] The deterministic dice and payout are committed as event sixteen
- [x] Undo is visibly locked because the dice result cannot be unseen
- [x] Bora sees the same dice boundary and no undo event was invented
