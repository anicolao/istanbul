# Earning Mosque tiles, permanent abilities, and a paired ruby

Ada fills spice, buys the exposed Green tile at Small Mosque, later fills fabric and pauses in a recoverable Green ability choice to buy extra jewelry. She returns to acquire the Red tile and immediately claims the Small Mosque ruby, then wagers at Tea House, sees the original dice, turns one die to four, reloads the adjusted result, and passes. Bora takes every intervening turn through ordinary board controls so the complete timing remains visible.

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

## 4. Ada creates private room TILES

**Ada, the first merchant** — Ada creates private room TILES

![Ada creates private room TILES](./screenshots/003-host-creates-room-desktop.png)

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

## 11. Ada selects adjacent Spice Warehouse

**Ada, the first merchant** — Ada selects adjacent Spice Warehouse

![Ada selects adjacent Spice Warehouse](./screenshots/006-host-selects-spice-desktop.png)

**Verifications:**

- [x] Spice Warehouse is selected and reachable
- [x] Ada must leave an assistant
- [x] Ada begins without goods or Mosque tiles

## 12. Ada arrives at Spice Warehouse

**Ada, the first merchant** — Ada arrives at Spice Warehouse

![Ada arrives at Spice Warehouse](./screenshots/007-host-arrives-spice-desktop.png)

**Verifications:**

- [x] The fill action names capacity two
- [x] Only movement is event six

## 13. Ada fills spice to wheelbarrow capacity

**Ada, the first merchant** — Ada fills spice to wheelbarrow capacity

![Ada fills spice to wheelbarrow capacity](./screenshots/008-host-fills-spice-desktop.png)

**Verifications:**

- [x] The completed action reports exact capacity
- [x] No Green ability exists before buying its tile
- [x] No extra-good selector is rendered

## 14. Ada passes the completed spice turn

**Ada, the first merchant** — Ada passes the completed spice turn

![Ada passes the completed spice turn](./screenshots/009-host-ends-spice-turn-desktop.png)

**Verifications:**

- [x] Bora receives turn two
- [x] Spice remains available for the Mosque

## 15. Bora selects Police Station

**Bora, the second merchant** — Bora selects Police Station

![Bora selects Police Station](./screenshots/004-guest-selects-police-first-desktop.png)

**Verifications:**

- [x] Police is a legal adjacent route
- [x] Bora must leave an assistant
- [x] The family member still waits at Police

## 16. Bora arrives at Police Station

**Bora, the second merchant** — Bora arrives at Police Station

![Bora arrives at Police Station](./screenshots/005-guest-arrives-police-first-desktop.png)

**Verifications:**

- [x] The family dispatch control opens
- [x] Movement is event nine

## 17. Bora chooses Small Mosque for the family member

**Bora, the second merchant** — Bora chooses Small Mosque for the family member

![Bora chooses Small Mosque for the family member](./screenshots/006-guest-chooses-small-mosque-family-desktop.png)

**Verifications:**

- [x] Small Mosque is the visible destination
- [x] The dispatch button names Small Mosque
- [x] The local choice adds no history

## 18. Bora dispatches family to Small Mosque

**Bora, the second merchant** — Bora dispatches family to Small Mosque

![Bora dispatches family to Small Mosque](./screenshots/007-guest-dispatches-family-to-mosque-desktop.png)

**Verifications:**

- [x] The unaffordable remote Mosque action appears
- [x] Family movement has no merchant encounter

## 19. Bora leaves family at Small Mosque and passes

**Bora, the second merchant** — Bora leaves family at Small Mosque and passes

![Bora leaves family at Small Mosque and passes](./screenshots/008-guest-skips-family-mosque-desktop.png)

**Verifications:**

- [x] Ada begins turn three
- [x] Bora’s family remains available to catch

## 20. Ada selects Small Mosque beside the Spice Warehouse

**Ada, the first merchant** — Ada selects Small Mosque beside the Spice Warehouse

![Ada selects Small Mosque beside the Spice Warehouse](./screenshots/010-host-selects-small-mosque-green-desktop.png)

**Verifications:**

- [x] Small Mosque is a one-space route
- [x] Ada is ready to leave a second assistant
- [x] The exposed two-good stacks remain untouched

## 21. Ada arrives and meets the neutral merchant at Small Mosque

**Ada, the first merchant** — Ada arrives and meets the neutral merchant at Small Mosque

![Ada arrives and meets the neutral merchant at Small Mosque](./screenshots/011-host-meets-neutral-at-small-mosque-desktop.png)

**Verifications:**

- [x] The neutral merchant toll precedes the Mosque action
- [x] Ada can afford the exact two-Lira toll
- [x] Neither tile nor family reward resolves early

## 22. Ada pays and relocates the neutral merchant

**Ada, the first merchant** — Ada pays and relocates the neutral merchant

![Ada pays and relocates the neutral merchant](./screenshots/012-host-pays-neutral-at-mosque-desktop.png)

**Verifications:**

- [x] Both official Small Mosque powers are presented as large square offers
- [x] Green is affordable and Red is disabled
- [x] Payment spends Lira but no goods

## 23. Ada pays one spice for the Green Mosque tile

**Ada, the first merchant** — Ada pays one spice for the Green Mosque tile

![Ada pays one spice for the Green Mosque tile](./screenshots/013-host-buys-green-tile-desktop.png)

**Verifications:**

- [x] The full Green power tile settles into Ada’s tray
- [x] One spice is paid before the mandatory family catch
- [x] Small Mosque replaces Green’s cost with the next exposed requirement and devotes the display to both tiles
- [x] The acquisition summary identifies the paid color

## 24. Ada catches Bora’s family for three Lira

**Ada, the first merchant** — Ada catches Bora’s family for three Lira

![Ada catches Bora’s family for three Lira](./screenshots/014-host-catches-family-for-lira-desktop.png)

**Verifications:**

- [x] The catch closes every remaining encounter
- [x] Bora’s family returns to Police and Ada receives three
- [x] The encounter ledger records the chosen reward

## 25. Ada ends the Green-tile turn

**Ada, the first merchant** — Ada ends the Green-tile turn

![Ada ends the Green-tile turn](./screenshots/015-host-ends-green-tile-turn-desktop.png)

**Verifications:**

- [x] Bora begins turn four
- [x] Green ownership persists publicly

## 26. Bora returns from Police to Fountain

**Bora, the second merchant** — Bora returns from Police to Fountain

![Bora returns from Police to Fountain](./screenshots/009-guest-selects-fountain-first-desktop.png)

**Verifications:**

- [x] Fountain is selected as Bora’s legal route
- [x] The assistant operation is explicit before movement
- [x] Inspection does not alter immutable history

## 27. Bora arrives at Fountain

**Bora, the second merchant** — Bora arrives at Fountain

![Bora arrives at Fountain](./screenshots/010-guest-arrives-fountain-first-desktop.png)

**Verifications:**

- [x] Fountain action controls replace the route planner
- [x] Bora’s move is a clean action-phase event

## 28. Bora skips Fountain and passes

**Bora, the second merchant** — Bora skips Fountain and passes

![Bora skips Fountain and passes](./screenshots/011-guest-skips-fountain-first-desktop.png)

**Verifications:**

- [x] Ada begins turn 5
- [x] Skipping creates no resources or Mosque ownership

## 29. Ada selects Fabric Warehouse with the Green tile

**Ada, the first merchant** — Ada selects Fabric Warehouse with the Green tile

![Ada selects Fabric Warehouse with the Green tile](./screenshots/016-host-selects-fabric-with-green-desktop.png)

**Verifications:**

- [x] Fabric is adjacent to Small Mosque
- [x] Ada leaves her third assistant
- [x] The Green ability has not been used this turn

## 30. Ada arrives at Fabric Warehouse

**Ada, the first merchant** — Ada arrives at Fabric Warehouse

![Ada arrives at Fabric Warehouse](./screenshots/017-host-arrives-fabric-with-green-desktop.png)

**Verifications:**

- [x] Fabric still fills before the optional ability
- [x] Movement alone changes no goods

## 31. Ada fills fabric and opens the Green ability choice

**Ada, the first merchant** — Ada fills fabric and opens the Green ability choice

![Ada fills fabric and opens the Green ability choice](./screenshots/018-host-opens-green-ability-desktop.png)

**Verifications:**

- [x] The Green timing panel pauses turn completion
- [x] Jewelry is the default open-capacity extra good
- [x] The finite choice is canonical event twenty

## 32. Ada pays two Lira for one extra jewelry

**Ada, the first merchant** — Ada pays two Lira for one extra jewelry

![Ada pays two Lira for one extra jewelry](./screenshots/019-host-buys-extra-jewelry-desktop.png)

**Verifications:**

- [x] The completion summary includes both Warehouse effects
- [x] The exact payment and good are applied once
- [x] The ability controls cannot repeat

## 33. Ada ends the Green-assisted Warehouse turn

**Ada, the first merchant** — Ada ends the Green-assisted Warehouse turn

![Ada ends the Green-assisted Warehouse turn](./screenshots/020-host-ends-green-ability-turn-desktop.png)

**Verifications:**

- [x] Bora begins turn six
- [x] Per-turn ability timing resets on handoff

## 34. Bora returns to collect the Police assistant

**Bora, the second merchant** — Bora returns to collect the Police assistant

![Bora returns to collect the Police assistant](./screenshots/012-guest-selects-police-return-desktop.png)

**Verifications:**

- [x] Police Station is selected as Bora’s legal route
- [x] The assistant operation is explicit before movement
- [x] Inspection does not alter immutable history

## 35. Bora arrives at Police Station

**Bora, the second merchant** — Bora arrives at Police Station

![Bora arrives at Police Station](./screenshots/013-guest-picks-up-at-police-desktop.png)

**Verifications:**

- [x] Police Station action controls replace the route planner
- [x] Bora’s move is a clean action-phase event

## 36. Bora skips Police Station and passes

**Bora, the second merchant** — Bora skips Police Station and passes

![Bora skips Police Station and passes](./screenshots/014-guest-skips-police-return-desktop.png)

**Verifications:**

- [x] Ada begins turn 7
- [x] Skipping creates no resources or Mosque ownership

## 37. Ada returns to Small Mosque for the Red tile

**Ada, the first merchant** — Ada returns to Small Mosque for the Red tile

![Ada returns to Small Mosque for the Red tile](./screenshots/021-host-selects-small-mosque-red-desktop.png)

**Verifications:**

- [x] Small Mosque is adjacent to Fabric Warehouse
- [x] Ada will collect the assistant left earlier
- [x] Fabric two satisfies the exposed Red requirement

## 38. Ada picks up her Small Mosque assistant

**Ada, the first merchant** — Ada picks up her Small Mosque assistant

![Ada picks up her Small Mosque assistant](./screenshots/022-host-returns-small-mosque-desktop.png)

**Verifications:**

- [x] Red is affordable while Green is enabled in the tray
- [x] Assistant pickup and action state are exact

## 39. Ada buys Red and completes the Small Mosque pair

**Ada, the first merchant** — Ada buys Red and completes the Small Mosque pair

![Ada buys Red and completes the Small Mosque pair](./screenshots/023-host-completes-small-mosque-pair-desktop.png)

**Verifications:**

- [x] The action announces the paired ruby
- [x] Both tile IDs and one ruby are conserved
- [x] The paired-ruby reward is recorded on Ada while the tile display remains uncluttered
- [x] Red and Green square powers are both enabled in the tray

## 40. Ada passes with the Small Mosque ruby

**Ada, the first merchant** — Ada passes with the Small Mosque ruby

![Ada passes with the Small Mosque ruby](./screenshots/024-host-ends-paired-mosque-turn-desktop.png)

**Verifications:**

- [x] Bora begins turn eight
- [x] The paired reward remains public

## 41. Bora returns to Fountain again

**Bora, the second merchant** — Bora returns to Fountain again

![Bora returns to Fountain again](./screenshots/015-guest-selects-fountain-second-desktop.png)

**Verifications:**

- [x] Fountain is selected as Bora’s legal route
- [x] The assistant operation is explicit before movement
- [x] Inspection does not alter immutable history

## 42. Bora arrives at Fountain

**Bora, the second merchant** — Bora arrives at Fountain

![Bora arrives at Fountain](./screenshots/016-guest-arrives-fountain-second-desktop.png)

**Verifications:**

- [x] Fountain action controls replace the route planner
- [x] Bora’s move is a clean action-phase event

## 43. Bora skips Fountain and passes

**Bora, the second merchant** — Bora skips Fountain and passes

![Bora skips Fountain and passes](./screenshots/017-guest-ends-fountain-second-desktop.png)

**Verifications:**

- [x] Ada begins turn 9
- [x] Skipping creates no resources or Mosque ownership

## 44. Ada selects Tea House with the Red tile

**Ada, the first merchant** — Ada selects Tea House with the Red tile

![Ada selects Tea House with the Red tile](./screenshots/025-host-selects-tea-with-red-desktop.png)

**Verifications:**

- [x] Tea House is a legal two-space route
- [x] Ada has an assistant available to leave
- [x] Red ownership is present before the roll

## 45. Ada arrives at Tea House with Red privilege

**Ada, the first merchant** — Ada arrives at Tea House with Red privilege

![Ada arrives at Tea House with Red privilege](./screenshots/026-host-arrives-tea-with-red-desktop.png)

**Verifications:**

- [x] Tea House still requires a declaration first
- [x] No dice exist before commitment

## 46. Ada declares a six-Lira Tea House wager

**Ada, the first merchant** — Ada declares a six-Lira Tea House wager

![Ada declares a six-Lira Tea House wager](./screenshots/027-host-declares-six-desktop.png)

**Verifications:**

- [x] The select visibly reads six
- [x] The roll button updates to wager six
- [x] The local declaration adds no event

## 47. Ada rolls three and two before using Red

**Ada, the first merchant** — Ada rolls three and two before using Red

![Ada rolls three and two before using Red](./screenshots/028-host-sees-original-red-roll-desktop.png)

**Verifications:**

- [x] The original dice are visible before adjustment
- [x] Every official Red choice is offered
- [x] Reward waits in a finite post-roll phase

## 48. Ada turns the first die to four and wins six Lira

**Ada, the first merchant** — Ada turns the first die to four and wins six Lira

![Ada turns the first die to four and wins six Lira](./screenshots/029-host-turns-first-die-to-four-desktop.png)

**Verifications:**

- [x] Production dice show the adjusted four and two
- [x] The adjusted total meets the declared wager exactly
- [x] The completion copy records the Red choice

## 49. Ada reloads the adjusted Tea House result

**Ada, the first merchant** — Ada reloads the adjusted Tea House result

![Ada reloads the adjusted Tea House result](./screenshots/030-host-reloads-adjusted-roll-desktop.png)

**Verifications:**

- [x] The adjusted dice and reward return exactly
- [x] No adjustment controls can be repeated
- [x] Both permanent powers and the paired ruby remain visible

## 50. Ada ends the adjusted Tea House turn

**Ada, the first merchant** — Ada ends the adjusted Tea House turn

![Ada ends the adjusted Tea House turn](./screenshots/031-host-ends-red-ability-turn-desktop.png)

**Verifications:**

- [x] Bora begins turn ten
- [x] Thirty-three events finish with clean permanent abilities
- [x] The observer projects the same public resources
