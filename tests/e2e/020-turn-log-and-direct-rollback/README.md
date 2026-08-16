# Reviewing and rewinding a complete turn

Ada reviews every action before passing, uses Undo Turn to erase a three-action reversible suffix with one immutable event, replays the line, opens the full game log, and rolls back directly to movement. She then rolls dice at Tea House and sees every action at or below that information barrier greyed out. Ending the turn creates one new reversible action above the barrier, which the game log restores directly without crossing the dice result. Every input is followed by a screenshot and exact state, log, authorization, resource, assistant, demand, and observer checks.

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

## 4. Ada creates private room LOGDS

**Ada, the first merchant** — Ada creates private room LOGDS

![Ada creates private room LOGDS](./screenshots/003-host-creates-room-desktop.png)

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

## 11. Ada receives reviewed goods and real Bonus cards

**Ada, the first merchant** — Ada receives reviewed goods and real Bonus cards

![Ada receives reviewed goods and real Bonus cards](./screenshots/006-host-supplies-rollback-review-desktop.png)

**Verifications:**

- [x] The reviewed setup is outside the player-action log
- [x] The global game log is available beside Undo

## 12. Ada inspects a profitable bargain for the first turn line

**Ada, the first merchant** — Ada inspects a profitable bargain for the first turn line

![Ada inspects a profitable bargain for the first turn line](./screenshots/007-host-inspects-first-turn-bonus-desktop.png)

**Verifications:**

- [x] The selected card is the real five-Lira card

## 13. Ada plays the Bonus card before moving

**Ada, the first merchant** — Ada plays the Bonus card before moving

![Ada plays the Bonus card before moving](./screenshots/008-host-plays-first-turn-bonus-desktop.png)

**Verifications:**

- [x] The first turn action is logged and pays five Lira

## 14. Ada selects Small Market for the reviewed line

**Ada, the first merchant** — Ada selects Small Market for the reviewed line

![Ada selects Small Market for the reviewed line](./screenshots/009-host-selects-first-small-market-desktop.png)

**Verifications:**

- [x] Route inspection remains local

## 15. Ada moves and leaves an assistant at Small Market

**Ada, the first merchant** — Ada moves and leaves an assistant at Small Market

![Ada moves and leaves an assistant at Small Market](./screenshots/010-host-moves-first-small-market-desktop.png)

**Verifications:**

- [x] The game log can now roll back two actions from the Bonus play
- [x] Every matching demand slot is preselected at the maximum payout

## 16. Ada completes the market sale and reviews the turn before passing

**Ada, the first merchant** — Ada completes the market sale and reviews the turn before passing

![Ada completes the market sale and reviews the turn before passing](./screenshots/011-host-reviews-completed-turn-desktop.png)

**Verifications:**

- [x] The turn review lists Bonus play, movement, and sale in order
- [x] Undo Turn reaches the beginning of all three reversible actions
- [x] Canonical state contains three active actions and the rotated demand

## 17. Ada uses one Undo Turn event to restore the reviewed starting position

**Ada, the first merchant** — Ada uses one Undo Turn event to restore the reviewed starting position

![Ada uses one Undo Turn event to restore the reviewed starting position](./screenshots/012-host-undoes-entire-turn-desktop.png)

**Verifications:**

- [x] The Bonus card, Lira, merchant, assistant, goods, and demand all return exactly
- [x] Bora independently converges from the same single rollback event

## 18. Ada selects the restored Bonus card for a second line

**Ada, the first merchant** — Ada selects the restored Bonus card for a second line

![Ada selects the restored Bonus card for a second line](./screenshots/013-host-reselects-turn-bonus-desktop.png)

**Verifications:**

- [x] Selection changes no immutable state

## 19. Ada replays the profitable bargain

**Ada, the first merchant** — Ada replays the profitable bargain

![Ada replays the profitable bargain](./screenshots/014-host-replays-turn-bonus-desktop.png)

**Verifications:**

- [x] A new active Bonus action follows the three inactive originals

## 20. Ada selects Small Market again

**Ada, the first merchant** — Ada selects Small Market again

![Ada selects Small Market again](./screenshots/015-host-reselects-small-market-desktop.png)

**Verifications:**

- [x] The replacement route is reachable without a new event

## 21. Ada repeats the movement to Small Market

**Ada, the first merchant** — Ada repeats the movement to Small Market

![Ada repeats the movement to Small Market](./screenshots/016-host-replays-small-market-move-desktop.png)

**Verifications:**

- [x] The replacement movement is the fifth logged action
- [x] The replayed market again prepares every matching good

## 22. Ada completes the replayed market turn

**Ada, the first merchant** — Ada completes the replayed market turn

![Ada completes the replayed market turn](./screenshots/017-host-completes-second-market-sale-desktop.png)

**Verifications:**

- [x] The replacement sale reaches turn review at event thirteen

## 23. Ada opens the full immutable game log beside Undo

**Ada, the first merchant** — Ada opens the full immutable game log beside Undo

![Ada opens the full immutable game log beside Undo](./screenshots/018-host-opens-direct-rollback-log-desktop.png)

**Verifications:**

- [x] The dialog offers direct one-, two-, and three-action rollback points
- [x] Previously undone actions remain visible as grey immutable history

## 24. Ada restores the state before movement with one direct rollback event

**Ada, the first merchant** — Ada restores the state before movement with one direct rollback event

![Ada restores the state before movement with one direct rollback event](./screenshots/019-host-rolls-back-directly-to-movement-desktop.png)

**Verifications:**

- [x] Movement and sale are inactive while the Bonus play remains active
- [x] The dialog closes after the atomic rollback

## 25. Ada chooses Tea House as the replacement route

**Ada, the first merchant** — Ada chooses Tea House as the replacement route

![Ada chooses Tea House as the replacement route](./screenshots/020-host-selects-tea-after-direct-rollback-desktop.png)

**Verifications:**

- [x] Tea House is selected with no event

## 26. Ada moves to Tea House after the direct rollback

**Ada, the first merchant** — Ada moves to Tea House after the direct rollback

![Ada moves to Tea House after the direct rollback](./screenshots/021-host-moves-tea-after-direct-rollback-desktop.png)

**Verifications:**

- [x] The move is reversible before dice are shown

## 27. Ada rolls dice and reviews the visibly blocked turn history

**Ada, the first merchant** — Ada rolls dice and reviews the visibly blocked turn history

![Ada rolls dice and reviews the visibly blocked turn history](./screenshots/022-host-sees-grey-barrier-turn-log-desktop.png)

**Verifications:**

- [x] Every active turn row is grey because rollback would cross the dice result
- [x] Undo Turn is disabled at the information boundary
- [x] The canonical log exposes the same barrier reasons

## 28. Ada passes, creating one reversible action above the dice barrier

**Ada, the first merchant** — Ada passes, creating one reversible action above the dice barrier

![Ada passes, creating one reversible action above the dice barrier](./screenshots/023-host-passes-above-dice-barrier-desktop.png)

**Verifications:**

- [x] Bora begins turn two while Ada owns the latest end-turn action
- [x] Bora sees the same clockwise handoff

## 29. Ada opens the log after passing the dice barrier

**Ada, the first merchant** — Ada opens the log after passing the dice barrier

![Ada opens the log after passing the dice barrier](./screenshots/024-host-opens-log-above-barrier-desktop.png)

**Verifications:**

- [x] End turn is selectable but the roll and all earlier actions are grey

## 30. Ada rolls back only the action above the barrier

**Ada, the first merchant** — Ada rolls back only the action above the barrier

![Ada rolls back only the action above the barrier](./screenshots/025-host-restores-end-turn-only-desktop.png)

**Verifications:**

- [x] Ada returns to turn review without changing the dice, payout, or lower history
- [x] Undo Turn remains visibly blocked exactly at the retained dice barrier
