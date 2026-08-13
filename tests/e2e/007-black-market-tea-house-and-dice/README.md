# Wagering at Tea House and rolling for Black Market jewelry

Ada and Bora narrate every input from room creation through deterministic dice at both chance Places. Ada changes and commits a Tea House wager, both clients verify its exact dice and Lira result after reload, Bora deliberately skips an intermediate card stop, Ada crosses Small Market without stock, and Bora chooses spice before the Black Market roll awards the exact jewelry tier.

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

## 4. Ada creates private room WAGER

**Ada, the first merchant** — Ada creates private room WAGER

![Ada creates private room WAGER](./screenshots/003-host-creates-room-desktop.png)

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

## 11. Ada selects Tea House two spaces away

**Ada, the first merchant** — Ada selects Tea House two spaces away

![Ada selects Tea House two spaces away](./screenshots/006-host-selects-tea-house-desktop.png)

**Verifications:**

- [x] Tea House is selected as a legal route
- [x] Ada is offered an assistant drop
- [x] No dice are consumed during route inspection

## 12. Ada arrives at Tea House before declaring

**Ada, the first merchant** — Ada arrives at Tea House before declaring

![Ada arrives at Tea House before declaring](./screenshots/007-host-arrives-tea-house-desktop.png)

**Verifications:**

- [x] The default wager is a visible 7 Lira
- [x] The wager button truthfully names 7
- [x] Movement alone adds no Lira or roll

## 13. Ada raises the Tea House declaration to 10

**Ada, the first merchant** — Ada raises the Tea House declaration to 10

![Ada raises the Tea House declaration to 10](./screenshots/008-host-declares-ten-desktop.png)

**Verifications:**

- [x] The ordinary select visibly reads 10 Lira
- [x] The commitment control updates to Wager 10
- [x] The local declaration has not appended event seven

## 14. Ada commits the wager and rolls both seeded dice

**Ada, the first merchant** — Ada commits the wager and rolls both seeded dice

![Ada commits the wager and rolls both seeded dice](./screenshots/009-host-rolls-tea-house-desktop.png)

**Verifications:**

- [x] Two production dice display the canonical result
- [x] The reward is 10 on success or exactly 2 on failure
- [x] The action closes after one deterministic roll

## 15. Ada reloads the completed Tea House result

**Ada, the first merchant** — Ada reloads the completed Tea House result

![Ada reloads the completed Tea House result](./screenshots/010-host-reloads-tea-result-desktop.png)

**Verifications:**

- [x] The exact two dice return after replay
- [x] The declared wager and reward are unchanged
- [x] Roll cannot be repeated after hydration

## 16. Ada passes the resolved Tea House turn

**Ada, the first merchant** — Ada passes the resolved Tea House turn

![Ada passes the resolved Tea House turn](./screenshots/011-host-ends-tea-turn-desktop.png)

**Verifications:**

- [x] Bora becomes the turn-two merchant
- [x] The immutable Tea result remains in history

## 17. Bora selects Caravansary as a Black Market waypoint

**Bora, the second merchant** — Bora selects Caravansary as a Black Market waypoint

![Bora selects Caravansary as a Black Market waypoint](./screenshots/004-guest-selects-caravan-waypoint-desktop.png)

**Verifications:**

- [x] Caravansary is a legal two-space route
- [x] Bora must leave an assistant
- [x] The Tea result is not consumed by a new route

## 18. Bora arrives at Caravansary without drawing

**Bora, the second merchant** — Bora arrives at Caravansary without drawing

![Bora arrives at Caravansary without drawing](./screenshots/005-guest-arrives-caravan-waypoint-desktop.png)

**Verifications:**

- [x] The full Caravansary card controls are visible
- [x] Card counts remain untouched by movement

## 19. Bora skips the optional Caravansary trade

**Bora, the second merchant** — Bora skips the optional Caravansary trade

![Bora skips the optional Caravansary trade](./screenshots/006-guest-skips-caravan-desktop.png)

**Verifications:**

- [x] Ada starts turn three immediately
- [x] No Bonus card moved while advancing

## 20. Ada selects adjacent Small Market as a crossing

**Ada, the first merchant** — Ada selects adjacent Small Market as a crossing

![Ada selects adjacent Small Market as a crossing](./screenshots/012-host-selects-market-waypoint-desktop.png)

**Verifications:**

- [x] Small Market is selected beside Tea House
- [x] Ada can leave her second assistant
- [x] Ada has no goods available to sell

## 21. Ada arrives at Small Market with an empty wheelbarrow

**Ada, the first merchant** — Ada arrives at Small Market with an empty wheelbarrow

![Ada arrives at Small Market with an empty wheelbarrow](./screenshots/013-host-arrives-empty-market-desktop.png)

**Verifications:**

- [x] Every Demand choice is visible but unaffordable
- [x] The zero-good sale is disabled
- [x] Demand has not rotated

## 22. Ada skips the unaffordable sale

**Ada, the first merchant** — Ada skips the unaffordable sale

![Ada skips the unaffordable sale](./screenshots/014-host-skips-empty-market-desktop.png)

**Verifications:**

- [x] Bora starts turn four at the Black Market waypoint
- [x] Skipping neither rotates Demand nor adds a roll

## 23. Bora selects adjacent Black Market

**Bora, the second merchant** — Bora selects adjacent Black Market

![Bora selects adjacent Black Market](./screenshots/007-guest-selects-black-market-desktop.png)

**Verifications:**

- [x] Black Market is a one-space legal route
- [x] The tile displays all three jewelry thresholds before the roll
- [x] Bora must leave a second assistant
- [x] Bora begins with no goods

## 24. Bora arrives before choosing a basic good

**Bora, the second merchant** — Bora arrives before choosing a basic good

![Bora arrives before choosing a basic good](./screenshots/008-guest-arrives-black-market-desktop.png)

**Verifications:**

- [x] Fabric is the transparent default choice
- [x] The roll control names fabric
- [x] No good or new roll is granted by arrival

## 25. Bora chooses spice as the guaranteed good

**Bora, the second merchant** — Bora chooses spice as the guaranteed good

![Bora chooses spice as the guaranteed good](./screenshots/009-guest-chooses-spice-desktop.png)

**Verifications:**

- [x] Spice is visibly selected
- [x] The commitment control now names spice
- [x] The local choice changes no canonical goods

## 26. Bora takes spice and rolls for jewelry

**Bora, the second merchant** — Bora takes spice and rolls for jewelry

![Bora takes spice and rolls for jewelry](./screenshots/010-guest-rolls-black-market-desktop.png)

**Verifications:**

- [x] The two seeded dice are displayed as production pieces
- [x] The jewelry reward matches the official 7/9/11 thresholds
- [x] One event records both the choice and derived roll

## 27. Bora reloads the completed Black Market result

**Bora, the second merchant** — Bora reloads the completed Black Market result

![Bora reloads the completed Black Market result](./screenshots/011-guest-reloads-black-result-desktop.png)

**Verifications:**

- [x] The exact dice pair returns after replay
- [x] Spice, jewelry, and reward are unchanged
- [x] The observer projects the same public dice outcome

## 28. Bora passes the replayed Black Market turn

**Bora, the second merchant** — Bora passes the replayed Black Market turn

![Bora passes the replayed Black Market turn](./screenshots/012-guest-ends-black-market-turn-desktop.png)

**Verifications:**

- [x] Ada begins turn five
- [x] Fifteen events close with deterministic public dice
- [x] Both clients agree on every public player resource
