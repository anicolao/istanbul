# Using the zero-distance Bonus move

Ada and Bora open an ordinary two-player bazaar and review both sides of Work where you stand. Ada starts at Fruit Warehouse with an assistant already there, so the card clearly offers to pick it up before opening the Place action. After Ada completes that turn, Bora starts at Fabric Warehouse without a remote assistant, so the same graphical card clearly offers to leave one. The walkthrough proves the exact assistant inventories, zero-distance movement records, private card disposal, immutable replay, fitted UI, and screenshots after every input.

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

## 4. Ada creates private room ZERDS

**Ada, the first merchant** — Ada creates private room ZERDS

![Ada creates private room ZERDS](./screenshots/003-host-creates-room-desktop.png)

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

## 11. Ada opens the reviewed zero-distance position

**Ada, the first merchant** — Ada opens the reviewed zero-distance position

![Ada opens the reviewed zero-distance position](./screenshots/006-host-opens-zero-move-position-desktop.png)

**Verifications:**

- [x] Ada is at Fruit Warehouse with exactly one assistant waiting there
- [x] Both private hands contain a Work where you stand card without exposing the other title
- [x] Fruit Warehouse graphically holds Ada’s assistant beneath her merchant

## 12. Ada inspects the graphical zero-distance card

**Ada, the first merchant** — Ada inspects the graphical zero-distance card

![Ada inspects the graphical zero-distance card](./screenshots/007-host-inspects-zero-move-pickup-desktop.png)

**Verifications:**

- [x] The card explains both normal assistant outcomes
- [x] The current board state produces an explicit pickup action
- [x] Inspecting a private card does not change canonical state

## 13. Ada stays and picks up the assistant at Fruit Warehouse

**Ada, the first merchant** — Ada stays and picks up the assistant at Fruit Warehouse

![Ada stays and picks up the assistant at Fruit Warehouse](./screenshots/008-host-stays-and-picks-up-desktop.png)

**Verifications:**

- [x] The normal Fruit Warehouse action opens at zero distance
- [x] The movement record is distance zero with a real pickup operation
- [x] The spent card log and board both show the pickup consequence

## 14. Ada fills fruit after the zero-distance pickup

**Ada, the first merchant** — Ada fills fruit after the zero-distance pickup

![Ada fills fruit after the zero-distance pickup](./screenshots/009-host-fills-fruit-after-zero-move-desktop.png)

**Verifications:**

- [x] Fruit reaches capacity and the turn is ready to pass
- [x] The ordinary end-turn control remains available

## 15. Ada passes the next zero-distance card to Bora’s turn

**Ada, the first merchant** — Ada passes the next zero-distance card to Bora’s turn

![Ada passes the next zero-distance card to Bora’s turn](./screenshots/010-host-passes-to-second-zero-move-desktop.png)

**Verifications:**

- [x] Bora begins movement at Fabric Warehouse with all four assistants carried
- [x] Ada sees the waiting state instead of Bora’s private decision

## 16. Bora inspects the same card with no assistant at Fabric Warehouse

**Bora, the second merchant** — Bora inspects the same card with no assistant at Fabric Warehouse

![Bora inspects the same card with no assistant at Fabric Warehouse](./screenshots/004-guest-inspects-zero-move-drop-desktop.png)

**Verifications:**

- [x] The current board state produces an explicit leave action
- [x] Bora’s four carried assistants and empty Fabric space are unchanged while inspecting
- [x] Bora sees the full graphical Bonus card while Ada’s remaining card stays private

## 17. Bora stays and leaves an assistant at Fabric Warehouse

**Bora, the second merchant** — Bora stays and leaves an assistant at Fabric Warehouse

![Bora stays and leaves an assistant at Fabric Warehouse](./screenshots/005-guest-stays-and-leaves-assistant-desktop.png)

**Verifications:**

- [x] The normal Fabric Warehouse action opens at zero distance
- [x] The movement record is distance zero with a real drop operation
- [x] The spent card log names the drop and the graphical assistant is rendered at Fabric

## 18. Bora reloads the completed zero-distance drop

**Bora, the second merchant** — Bora reloads the completed zero-distance drop

![Bora reloads the completed zero-distance drop](./screenshots/006-guest-reloads-zero-move-drop-desktop.png)

**Verifications:**

- [x] The exact assistant inventories, discarded card, and action phase replay
- [x] Fabric Warehouse still renders Bora’s graphical assistant
- [x] Reload offers the Place action—not a duplicate Bonus play
