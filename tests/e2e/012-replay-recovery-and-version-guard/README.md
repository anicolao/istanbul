# Recovering an immutable Istanbul table without guessing

Ada and Bora open a normal game, then Ada reloads from a deliberately retained six-event cache while a seventh canonical event already exists remotely. The visible recovery rail identifies the cached projection, its explicit catch-up action merges the live cursor without duplicates, a second reload proves byte-equivalent state, an uncertain committed write is confirmed under its original ID, a stale concurrent turn is contained, and an incompatible future envelope blocks play with direct update guidance. Every user action is followed by DOM and serialized-state checks plus an exact screenshot.

## 1. Ada opens the private-table creator

**Ada, host merchant** — Ada opens the private-table creator

![Ada opens the private-table creator](./screenshots/000-host-opens-creator-desktop.png)

**Verifications:**

- [x] Firebase reports ready before setup begins
- [x] The landing projection is empty

## 2. Ada enters the first merchant name

**Ada, host merchant** — Ada enters the first merchant name

![Ada enters the first merchant name](./screenshots/001-host-enters-name-desktop.png)

**Verifications:**

- [x] Ada remains visible in the public-name field
- [x] Typing has not appended an event

## 3. Ada reviews the open-room setup

**Ada, host merchant** — Ada reviews the open-room setup

![Ada reviews the open-room setup](./screenshots/002-host-reviews-open-room-desktop.png)

**Verifications:**

- [x] Short Path is visible and no player count is requested
- [x] Reviewing the open-room setup still has no immutable history

## 4. Ada creates private room REPLY

**Ada, host merchant** — Ada creates private room REPLY

![Ada creates private room REPLY](./screenshots/003-host-creates-room-desktop.png)

**Verifications:**

- [x] Ada is the room creator and the room remains open
- [x] One creation event projects a five-player-capacity lobby

## 5. Bora follows Ada’s room invitation

**Bora, guest merchant** — Bora follows Ada’s room invitation

![Bora follows Ada’s room invitation](./screenshots/000-guest-opens-invitation-desktop.png)

**Verifications:**

- [x] Ada and Short Path identify the invited table
- [x] Bora observes exactly the creation event

## 6. Bora enters the second merchant name

**Bora, guest merchant** — Bora enters the second merchant name

![Bora enters the second merchant name](./screenshots/001-guest-enters-name-desktop.png)

**Verifications:**

- [x] Bora remains visible in the join field
- [x] Join is enabled and history is unchanged

## 7. Bora claims clockwise seat two

**Bora, guest merchant** — Bora claims clockwise seat two

![Bora claims clockwise seat two](./screenshots/002-guest-joins-desktop.png)

**Verifications:**

- [x] Both named seats appear in order
- [x] The join is event two with neither merchant ready

## 8. Bora readies for the reviewed layout

**Bora, guest merchant** — Bora readies for the reviewed layout

![Bora readies for the reviewed layout](./screenshots/003-guest-readies-desktop.png)

**Verifications:**

- [x] The table shows one of two merchants ready
- [x] Only Bora is ready in event three

## 9. Ada readies and unlocks the bazaar

**Ada, host merchant** — Ada readies and unlocks the bazaar

![Ada readies and unlocks the bazaar](./screenshots/004-host-readies-desktop.png)

**Verifications:**

- [x] The host sees Table ready and an enabled start button
- [x] Event four has both merchants ready and no setup yet

## 10. Ada commits the seed and opens the bazaar

**Ada, host merchant** — Ada commits the seed and opens the bazaar

![Ada commits the seed and opens the bazaar](./screenshots/005-host-starts-game-desktop.png)

**Verifications:**

- [x] All sixteen Place controls are rendered
- [x] Ada is the seeded first merchant at Fountain

## 11. Ada selects Spice Warehouse before a connection break

**Ada, host merchant** — Ada selects Spice Warehouse before a connection break

![Ada selects Spice Warehouse before a connection break](./screenshots/006-host-selects-spice-before-recovery-desktop.png)

**Verifications:**

- [x] The adjacent warehouse route is visibly selected
- [x] Route inspection remains local at event five

## 12. Ada commits movement to Spice Warehouse

**Ada, host merchant** — Ada commits movement to Spice Warehouse

![Ada commits movement to Spice Warehouse](./screenshots/007-host-moves-spice-before-recovery-desktop.png)

**Verifications:**

- [x] The warehouse action panel appears
- [x] Event six places Ada at Spice Warehouse

## 13. Bora observes Ada’s seventh event on the live stream

**Bora, guest merchant** — Bora observes Ada’s seventh event on the live stream

![Bora observes Ada’s seventh event on the live stream](./screenshots/004-guest-observes-live-seventh-event-desktop.png)

**Verifications:**

- [x] The next clockwise turn is Bora’s
- [x] Remote history contains seven accepted events

## 14. Ada reloads the last verified local projection

**Ada, host merchant** — Ada reloads the last verified local projection

![Ada reloads the last verified local projection](./screenshots/008-host-restores-six-event-cache-desktop.png)

**Verifications:**

- [x] The recovery rail reports six cached events and catch-up
- [x] The cached action phase is playable without invented history

## 15. Ada catches the cache up to canonical live history

**Ada, host merchant** — Ada catches the cache up to canonical live history

![Ada catches the cache up to canonical live history](./screenshots/009-host-catches-up-live-cursor-desktop.png)

**Verifications:**

- [x] The rail confirms all seven events are verified
- [x] Cursor merge adds only the missing event

## 16. Ada reloads the caught-up immutable projection

**Ada, host merchant** — Ada reloads the caught-up immutable projection

![Ada reloads the caught-up immutable projection](./screenshots/010-host-reloads-caught-up-projection-desktop.png)

**Verifications:**

- [x] Seven cached events are restored before another live cursor
- [x] Public game projection is byte-equivalent after recovery

## 17. Ada repeats live catch-up without duplicating an event

**Ada, host merchant** — Ada repeats live catch-up without duplicating an event

![Ada repeats live catch-up without duplicating an event](./screenshots/011-host-confirms-idempotent-cursor-desktop.png)

**Verifications:**

- [x] The recovery rail remains at seven verified events
- [x] Duplicate IDs remain one accepted event each

## 18. Ada reviews an uncertain already-committed write

**Ada, host merchant** — Ada reviews an uncertain already-committed write

![Ada reviews an uncertain already-committed write](./screenshots/012-host-stages-same-id-retry-desktop.png)

**Verifications:**

- [x] The recovery rail offers the original sequence ID for retry
- [x] Staging retry changes no accepted event or game state

## 19. Ada confirms the write under its original immutable ID

**Ada, host merchant** — Ada confirms the write under its original immutable ID

![Ada confirms the write under its original immutable ID](./screenshots/013-host-confirms-same-id-retry-desktop.png)

**Verifications:**

- [x] The rail reports the original sequence was retried
- [x] Confirmation neither duplicates nor diagnoses the committed event

## 20. Ada receives a stale concurrent turn event

**Ada, host merchant** — Ada receives a stale concurrent turn event

![Ada receives a stale concurrent turn event](./screenshots/014-host-contains-stale-concurrent-event-desktop.png)

**Verifications:**

- [x] The rail explains that the stale event was contained
- [x] The event is diagnosed, not accepted, and game state is unchanged

## 21. Ada encounters history from a future schema

**Ada, host merchant** — Ada encounters history from a future schema

![Ada encounters history from a future schema](./screenshots/015-host-reviews-incompatible-history-desktop.png)

**Verifications:**

- [x] A blocking update message replaces all game controls
- [x] The future envelope is diagnosed and never accepted
