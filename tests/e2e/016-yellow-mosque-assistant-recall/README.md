# Invoking Yellow Mosque before movement

Ada and Bora open an ordinary two-player bazaar. The reviewed position gives Ada the enabled Yellow Mosque tile and leaves one of her assistants at Small Mosque. Ada invokes the graphical power before moving, pays exactly two Lira, sees the assistant return to her merchant stack, reloads the immutable result, then completes a normal Warehouse turn. Every input and consequence is shown below.

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

## 4. Ada creates private room YELDS

**Ada, the first merchant** — Ada creates private room YELDS

![Ada creates private room YELDS](./screenshots/003-host-creates-room-desktop.png)

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

## 11. Ada reviews an enabled Yellow Mosque recall

**Ada, the first merchant** — Ada reviews an enabled Yellow Mosque recall

![Ada reviews an enabled Yellow Mosque recall](./screenshots/006-host-opens-yellow-recall-desktop.png)

**Verifications:**

- [x] A large square Yellow power and explicit invoke heading replace the phone route copy
- [x] The button names the exact assistant location and two-Lira price
- [x] The reviewed state conserves four assistants and exposes Yellow in Ada’s tray
- [x] Small Mosque visibly holds Ada’s remote assistant

## 12. Ada pays two Lira and recalls the Small Mosque assistant

**Ada, the first merchant** — Ada pays two Lira and recalls the Small Mosque assistant

![Ada pays two Lira and recalls the Small Mosque assistant](./screenshots/007-host-invokes-yellow-recall-desktop.png)

**Verifications:**

- [x] The recalled assistant returns to Ada’s merchant stack
- [x] The immutable action summary names its origin
- [x] The once-per-turn invoke panel closes immediately
- [x] Small Mosque no longer displays Ada’s assistant

## 13. Ada reloads the completed Yellow recall

**Ada, the first merchant** — Ada reloads the completed Yellow recall

![Ada reloads the completed Yellow recall](./screenshots/008-host-reloads-yellow-recall-desktop.png)

**Verifications:**

- [x] The exact Lira, assistant, and used-power state replays
- [x] Yellow remains graphically enabled in Ada’s player mat
- [x] Reload cannot offer a second recall in the same turn

## 14. Ada selects Fruit Warehouse after recalling the assistant

**Ada, the first merchant** — Ada selects Fruit Warehouse after recalling the assistant

![Ada selects Fruit Warehouse after recalling the assistant](./screenshots/009-host-selects-fruit-after-recall-desktop.png)

**Verifications:**

- [x] Fruit Warehouse is still a normal legal route
- [x] The returned assistant makes the drop operation available
- [x] Route inspection adds no event or second ability use

## 15. Ada moves normally and leaves an assistant at Fruit Warehouse

**Ada, the first merchant** — Ada moves normally and leaves an assistant at Fruit Warehouse

![Ada moves normally and leaves an assistant at Fruit Warehouse](./screenshots/010-host-moves-after-yellow-recall-desktop.png)

**Verifications:**

- [x] The Warehouse action opens after the ordinary assistant drop
- [x] Assistant conservation and the used Yellow marker remain exact

## 16. Ada fills fruit after using Yellow

**Ada, the first merchant** — Ada fills fruit after using Yellow

![Ada fills fruit after using Yellow](./screenshots/011-host-fills-fruit-after-recall-desktop.png)

**Verifications:**

- [x] The Warehouse resolves without reopening Yellow
- [x] Fruit fills and the recall remains spent for this turn

## 17. Ada passes after the Yellow-assisted turn

**Ada, the first merchant** — Ada passes after the Yellow-assisted turn

![Ada passes after the Yellow-assisted turn](./screenshots/012-host-ends-yellow-turn-desktop.png)

**Verifications:**

- [x] Bora receives the next movement turn
- [x] The once-per-turn marker resets while the recalled assistant stays conserved
- [x] Bora observes the same public assistant and power state
