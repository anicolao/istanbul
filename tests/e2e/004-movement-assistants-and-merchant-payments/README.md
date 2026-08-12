# Walking every first route through the bazaar

Ada and Bora open a two-player Short Path table, then perform every visible choice in seven consecutive turns. The walkthrough shows orthogonal reachability, assistant drops and pick-up, a neutral-merchant toll and relocation, a player-to-player payment, an unaffordable early ending, the Fountain exception, observer updates, and reload-safe canonical state.

## 1. Ada opens the ordinary table creator

**Ada, the first merchant** — Ada opens the ordinary table creator

![Ada opens the ordinary table creator](./screenshots/000-host-opens-table-creator-desktop.png)

**Verifications:**

- [x] Firebase is ready before any room action
- [x] The landing projection has no room or game history

## 2. Ada enters her public merchant name

**Ada, the first merchant** — Ada enters her public merchant name

![Ada enters her public merchant name](./screenshots/001-host-enters-name-desktop.png)

**Verifications:**

- [x] The name field contains Ada exactly
- [x] No immutable event exists before confirmation

## 3. Ada chooses a two-player table

**Ada, the first merchant** — Ada chooses a two-player table

![Ada chooses a two-player table](./screenshots/002-host-chooses-two-seats-desktop.png)

**Verifications:**

- [x] The visible seat selector now reads 2 players
- [x] Short Path remains the selected route
- [x] Changing the draft form still writes no event

## 4. Ada creates private room MOVES

**Ada, the first merchant** — Ada creates private room MOVES

![Ada creates private room MOVES](./screenshots/003-host-creates-room-desktop.png)

**Verifications:**

- [x] Ada occupies seat one of exactly two
- [x] One creation event projects the lobby

## 5. Bora opens Ada’s invitation

**Bora, the second merchant** — Bora opens Ada’s invitation

![Bora opens Ada’s invitation](./screenshots/000-guest-opens-invitation-desktop.png)

**Verifications:**

- [x] The invitation names Ada and the Short Path
- [x] Bora observes one claimed seat and one event

## 6. Bora enters his public merchant name

**Bora, the second merchant** — Bora enters his public merchant name

![Bora enters his public merchant name](./screenshots/001-guest-enters-name-desktop.png)

**Verifications:**

- [x] The invitation form contains Bora exactly
- [x] Join is enabled while the event stream stays unchanged

## 7. Bora claims clockwise seat two

**Bora, the second merchant** — Bora claims clockwise seat two

![Bora claims clockwise seat two](./screenshots/002-guest-joins-desktop.png)

**Verifications:**

- [x] Both merchants are visible in clockwise order
- [x] The join is the second clean event

## 8. Bora readies for the Short Path

**Bora, the second merchant** — Bora readies for the Short Path

![Bora readies for the Short Path](./screenshots/003-guest-readies-desktop.png)

**Verifications:**

- [x] One of two merchants is visibly ready
- [x] The readiness event changes Bora only

## 9. Ada readies and unlocks the start control

**Ada, the first merchant** — Ada readies and unlocks the start control

![Ada readies and unlocks the start control](./screenshots/004-host-readies-desktop.png)

**Verifications:**

- [x] Table ready and Open the bazaar are visible
- [x] Four events leave the game unmaterialized

## 10. Ada opens the seeded bazaar as first player

**Ada, the first merchant** — Ada opens the seeded bazaar as first player

![Ada opens the seeded bazaar as first player](./screenshots/005-host-starts-seeded-game-desktop.png)

**Verifications:**

- [x] Ada is named as the current route planner
- [x] Reachability is exposed on ten ordinary Place buttons
- [x] Both merchants start at Fountain with five conserved assistants each

## 11. Ada selects Small Mosque two spaces away

**Ada, the first merchant** — Ada selects Small Mosque two spaces away

![Ada selects Small Mosque two spaces away](./screenshots/006-host-selects-neutral-route-desktop.png)

**Verifications:**

- [x] Small Mosque is selected and marked reachable
- [x] The planner offers an assistant drop
- [x] Inspecting a route appends no event

## 12. Ada moves to Small Mosque and leaves an assistant

**Ada, the first merchant** — Ada moves to Small Mosque and leaves an assistant

![Ada moves to Small Mosque and leaves an assistant](./screenshots/007-host-moves-to-neutral-desktop.png)

**Verifications:**

- [x] The neutral encounter opens a mandatory 2-Lira toll
- [x] Bora sees Ada waiting at the same payment boundary
- [x] Movement drops one assistant before the pending payment

## 13. Ada pays the neutral merchant and continues

**Ada, the first merchant** — Ada pays the neutral merchant and continues

![Ada pays the neutral merchant and continues](./screenshots/008-host-pays-neutral-desktop.png)

**Verifications:**

- [x] The Small Mosque action is now ready
- [x] The neutral merchant has deterministically left Place 14
- [x] Ada has paid down to zero Lira in action phase

## 14. Ada skips the not-yet-open Mosque action and ends turn

**Ada, the first merchant** — Ada skips the not-yet-open Mosque action and ends turn

![Ada skips the not-yet-open Mosque action and ends turn](./screenshots/009-host-ends-first-turn-desktop.png)

**Verifications:**

- [x] Bora becomes the visible route planner
- [x] The clockwise turn advances to turn two movement

## 15. Bora selects Ada’s occupied Small Mosque

**Bora, the second merchant** — Bora selects Ada’s occupied Small Mosque

![Bora selects Ada’s occupied Small Mosque](./screenshots/004-guest-selects-occupied-route-desktop.png)

**Verifications:**

- [x] The selected tile names Ada as its merchant occupant
- [x] Bora can move two spaces and leave an assistant
- [x] Route inspection preserves turn two and eight events

## 16. Bora arrives beside Ada and leaves an assistant

**Bora, the second merchant** — Bora arrives beside Ada and leaves an assistant

![Bora arrives beside Ada and leaves an assistant](./screenshots/005-guest-moves-to-host-desktop.png)

**Verifications:**

- [x] A mandatory player-to-player toll is visible
- [x] Ada’s observer sees both merchants on Place 14
- [x] Bora’s drop and exact recipient are pending canonically

## 17. Bora pays Ada the two-Lira encounter toll

**Bora, the second merchant** — Bora pays Ada the two-Lira encounter toll

![Bora pays Ada the two-Lira encounter toll](./screenshots/006-guest-pays-host-desktop.png)

**Verifications:**

- [x] Bora reaches the Small Mosque action panel
- [x] Public resources show Ada at 2 and Bora at 1 Lira

## 18. Bora ends turn after the settled encounter

**Bora, the second merchant** — Bora ends turn after the settled encounter

![Bora ends turn after the settled encounter](./screenshots/007-guest-ends-second-turn-desktop.png)

**Verifications:**

- [x] Ada becomes current for turn three
- [x] Both Place-14 assistants remain on the public board
- [x] Turn three begins with a clean movement phase

## 19. Ada selects adjacent Fabric Warehouse

**Ada, the first merchant** — Ada selects adjacent Fabric Warehouse

![Ada selects adjacent Fabric Warehouse](./screenshots/010-host-selects-fabric-desktop.png)

**Verifications:**

- [x] Fabric Warehouse is visibly selected and reachable
- [x] The next drop is offered without a toll yet
- [x] Selection remains local at eleven canonical events

## 20. Ada moves one space and drops at Fabric Warehouse

**Ada, the first merchant** — Ada moves one space and drops at Fabric Warehouse

![Ada moves one space and drops at Fabric Warehouse](./screenshots/011-host-drops-at-fabric-desktop.png)

**Verifications:**

- [x] Fabric Warehouse opens directly with no occupant toll
- [x] Ada now carries two assistants and has one at Places 14 and 2

## 21. Ada ends the Fabric Warehouse turn

**Ada, the first merchant** — Ada ends the Fabric Warehouse turn

![Ada ends the Fabric Warehouse turn](./screenshots/012-host-ends-third-turn-desktop.png)

**Verifications:**

- [x] Bora becomes current on turn four
- [x] The projection advances without changing public resources

## 22. Bora selects Ada’s occupied Fabric Warehouse

**Bora, the second merchant** — Bora selects Ada’s occupied Fabric Warehouse

![Bora selects Ada’s occupied Fabric Warehouse](./screenshots/008-guest-selects-unaffordable-encounter-desktop.png)

**Verifications:**

- [x] The route is legal and visibly occupied by Ada
- [x] The movement control still truthfully offers the required assistant drop
- [x] Bora still has only 1 Lira before committing

## 23. Bora arrives but cannot pay, ending the turn immediately

**Bora, the second merchant** — Bora arrives but cannot pay, ending the turn immediately

![Bora arrives but cannot pay, ending the turn immediately](./screenshots/009-guest-cannot-pay-desktop.png)

**Verifications:**

- [x] The turn banner explains the exact unaffordable 2-Lira barrier
- [x] No payment or Place-action control can be used after the early ending
- [x] Bora still moves and drops, but no Lira transfers and turn five belongs to Ada

## 24. Ada selects adjacent Fountain from Fabric Warehouse

**Ada, the first merchant** — Ada selects adjacent Fountain from Fabric Warehouse

![Ada selects adjacent Fountain from Fabric Warehouse](./screenshots/013-host-selects-fountain-desktop.png)

**Verifications:**

- [x] Fountain is selected as a reachable one-space route
- [x] The CTA states the Fountain assistant exception explicitly
- [x] Ada still carries two assistants before moving

## 25. Ada moves to Fountain without changing assistants

**Ada, the first merchant** — Ada moves to Fountain without changing assistants

![Ada moves to Fountain without changing assistants](./screenshots/014-host-moves-to-fountain-desktop.png)

**Verifications:**

- [x] Fountain action opens without a drop or pick-up
- [x] Ada’s two carried and two placed assistants remain unchanged

## 26. Ada ends the Fountain turn

**Ada, the first merchant** — Ada ends the Fountain turn

![Ada ends the Fountain turn](./screenshots/015-host-ends-fountain-turn-desktop.png)

**Verifications:**

- [x] Bora becomes current on turn six
- [x] Turn six is a new movement boundary

## 27. Bora also selects the adjacent Fountain

**Bora, the second merchant** — Bora also selects the adjacent Fountain

![Bora also selects the adjacent Fountain](./screenshots/010-guest-selects-fountain-desktop.png)

**Verifications:**

- [x] Fountain is reachable despite Bora having only two assistants carried
- [x] The no-assistant movement control is available
- [x] Selecting it changes no canonical state

## 28. Bora moves to Fountain without leaving an assistant

**Bora, the second merchant** — Bora moves to Fountain without leaving an assistant

![Bora moves to Fountain without leaving an assistant](./screenshots/011-guest-moves-to-fountain-desktop.png)

**Verifications:**

- [x] Both merchants are now visibly at Fountain
- [x] Bora’s assistant counts are unchanged in action phase

## 29. Bora ends the Fountain turn

**Bora, the second merchant** — Bora ends the Fountain turn

![Bora ends the Fountain turn](./screenshots/012-guest-ends-fountain-turn-desktop.png)

**Verifications:**

- [x] Ada starts turn seven at Fountain
- [x] The prior unaffordable notice no longer changes the active phase

## 30. Ada selects her own assistant at Fabric Warehouse

**Ada, the first merchant** — Ada selects her own assistant at Fabric Warehouse

![Ada selects her own assistant at Fabric Warehouse](./screenshots/016-host-selects-own-assistant-desktop.png)

**Verifications:**

- [x] The reachable tile visibly contains both placed assistants
- [x] The movement CTA switches from drop to pick-up
- [x] No event is appended while Ada reviews the recovery

## 31. Ada returns to Fabric Warehouse and picks up her assistant

**Ada, the first merchant** — Ada returns to Fabric Warehouse and picks up her assistant

![Ada returns to Fabric Warehouse and picks up her assistant](./screenshots/017-host-picks-up-assistant-desktop.png)

**Verifications:**

- [x] Fabric Warehouse action opens after the pick-up
- [x] Ada now carries three and only her Place-14 assistant remains
- [x] Bora’s observer receives the same public final projection

## 32. Ada reloads while the Fabric Warehouse action is pending

**Ada, the first merchant** — Ada reloads while the Fabric Warehouse action is pending

![Ada reloads while the Fabric Warehouse action is pending](./screenshots/018-host-reloads-pending-action-desktop.png)

**Verifications:**

- [x] The exact Place-action panel returns after fresh replay
- [x] No local route selection is falsely restored
- [x] The immutable payment, early-end, Fountain, and pick-up history remains clean
