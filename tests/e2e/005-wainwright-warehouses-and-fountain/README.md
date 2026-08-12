# Filling every warehouse and gathering an assistant at Fountain

Ada and Bora narrate every action from an empty room through five complete turns. Ada first encounters the honest 7-Lira Wainwright barrier. Bora fills fabric and spice, Ada recalls her Wainwright assistant at Fountain and fills fruit, and both browsers verify the same capacity-bound goods and assistant conservation after replay.

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

## 4. Ada creates private room GOODS

**Ada, the first merchant** — Ada creates private room GOODS

![Ada creates private room GOODS](./screenshots/003-host-creates-room-desktop.png)

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

## 11. Ada selects Wainwright two spaces away

**Ada, the first merchant** — Ada selects Wainwright two spaces away

![Ada selects Wainwright two spaces away](./screenshots/006-host-selects-wainwright-desktop.png)

**Verifications:**

- [x] Wainwright is selected as a legal route
- [x] Ada is offered the required assistant drop
- [x] Inspection does not append event six

## 12. Ada arrives at Wainwright and leaves an assistant

**Ada, the first merchant** — Ada arrives at Wainwright and leaves an assistant

![Ada arrives at Wainwright and leaves an assistant](./screenshots/007-host-arrives-wainwright-desktop.png)

**Verifications:**

- [x] The production action panel explains all three extensions and Ada’s tray shows its empty sockets
- [x] The 7-Lira purchase is truthfully disabled while skip remains available
- [x] Ada has 2 Lira, carries three assistants, and has one at Wainwright

## 13. Ada skips the unaffordable extension and ends turn

**Ada, the first merchant** — Ada skips the unaffordable extension and ends turn

![Ada skips the unaffordable extension and ends turn](./screenshots/008-host-skips-unaffordable-upgrade-desktop.png)

**Verifications:**

- [x] Bora immediately becomes the turn-two route planner
- [x] No Lira, capacity, extension, or supply changed

## 14. Bora selects adjacent Fabric Warehouse

**Bora, the second merchant** — Bora selects adjacent Fabric Warehouse

![Bora selects adjacent Fabric Warehouse](./screenshots/004-guest-selects-fabric-desktop.png)

**Verifications:**

- [x] Fabric Warehouse is selected and reachable
- [x] The drop movement is visible before commitment
- [x] The canonical stream remains at seven events

## 15. Bora arrives at Fabric Warehouse and leaves an assistant

**Bora, the second merchant** — Bora arrives at Fabric Warehouse and leaves an assistant

![Bora arrives at Fabric Warehouse and leaves an assistant](./screenshots/005-guest-arrives-fabric-desktop.png)

**Verifications:**

- [x] The action panel offers an exact fill from 0 to 2 fabric
- [x] The empty two-crate track is accessible
- [x] Movement alone changes no goods

## 16. Bora fills fabric to wheelbarrow capacity

**Bora, the second merchant** — Bora fills fabric to wheelbarrow capacity

![Bora fills fabric to wheelbarrow capacity](./screenshots/006-guest-fills-fabric-desktop.png)

**Verifications:**

- [x] The completed action panel replaces all action controls
- [x] Both fabric goods are public in Bora’s resource rail
- [x] Event nine closes the action against accidental repeat

## 17. Bora passes clockwise after filling fabric

**Bora, the second merchant** — Bora passes clockwise after filling fabric

![Bora passes clockwise after filling fabric](./screenshots/007-guest-ends-fabric-turn-desktop.png)

**Verifications:**

- [x] Ada becomes current for turn three
- [x] Fabric remains 2 while movement reopens

## 18. Ada selects Fountain from Wainwright

**Ada, the first merchant** — Ada selects Fountain from Wainwright

![Ada selects Fountain from Wainwright](./screenshots/009-host-selects-fountain-desktop.png)

**Verifications:**

- [x] Fountain is a reachable two-space route
- [x] The CTA names the no-drop Fountain exception
- [x] Ada’s Wainwright assistant is still placed before moving

## 19. Ada arrives at Fountain without leaving an assistant

**Ada, the first merchant** — Ada arrives at Fountain without leaving an assistant

![Ada arrives at Fountain without leaving an assistant](./screenshots/010-host-arrives-fountain-desktop.png)

**Verifications:**

- [x] Wainwright appears as one available recall choice
- [x] The action initially offers to recall zero assistants
- [x] Fountain movement preserves all assistant counts

## 20. Ada chooses the Wainwright assistant to recall

**Ada, the first merchant** — Ada chooses the Wainwright assistant to recall

![Ada chooses the Wainwright assistant to recall](./screenshots/011-host-chooses-assistant-desktop.png)

**Verifications:**

- [x] The ordinary checkbox is visibly checked
- [x] The CTA updates to exactly one assistant
- [x] The local choice has not yet changed canonical assistants

## 21. Ada recalls the selected assistant to her merchant stack

**Ada, the first merchant** — Ada recalls the selected assistant to her merchant stack

![Ada recalls the selected assistant to her merchant stack](./screenshots/012-host-recalls-assistant-desktop.png)

**Verifications:**

- [x] The completion panel reports one recalled assistant
- [x] The Wainwright assistant marker disappears for both observers
- [x] Four carried plus one supply assistant conserve Ada’s five

## 22. Ada passes clockwise after the recall

**Ada, the first merchant** — Ada passes clockwise after the recall

![Ada passes clockwise after the recall](./screenshots/013-host-ends-fountain-turn-desktop.png)

**Verifications:**

- [x] Bora becomes current for turn four
- [x] The recalled assistant remains carried in movement

## 23. Bora selects Spice Warehouse two spaces away

**Bora, the second merchant** — Bora selects Spice Warehouse two spaces away

![Bora selects Spice Warehouse two spaces away](./screenshots/008-guest-selects-spice-desktop.png)

**Verifications:**

- [x] Spice Warehouse is selected and reachable
- [x] A second assistant drop is required
- [x] Bora still has fabric 2 and spice 0 before moving

## 24. Bora arrives at Spice Warehouse and leaves an assistant

**Bora, the second merchant** — Bora arrives at Spice Warehouse and leaves an assistant

![Bora arrives at Spice Warehouse and leaves an assistant](./screenshots/009-guest-arrives-spice-desktop.png)

**Verifications:**

- [x] The panel offers a fill from 0 to 2 spice
- [x] Bora now carries two assistants with one at each warehouse

## 25. Bora fills spice to wheelbarrow capacity

**Bora, the second merchant** — Bora fills spice to wheelbarrow capacity

![Bora fills spice to wheelbarrow capacity](./screenshots/010-guest-fills-spice-desktop.png)

**Verifications:**

- [x] The completion message names capacity 2
- [x] Bora publicly holds fabric 2 and spice 2

## 26. Bora passes clockwise after filling spice

**Bora, the second merchant** — Bora passes clockwise after filling spice

![Bora passes clockwise after filling spice](./screenshots/011-guest-ends-spice-turn-desktop.png)

**Verifications:**

- [x] Ada becomes current for turn five
- [x] Both filled goods survive turn advancement

## 27. Ada selects Fruit Warehouse two spaces away

**Ada, the first merchant** — Ada selects Fruit Warehouse two spaces away

![Ada selects Fruit Warehouse two spaces away](./screenshots/014-host-selects-fruit-desktop.png)

**Verifications:**

- [x] Fruit Warehouse is selected and reachable
- [x] Ada can leave one of her four carried assistants
- [x] Fruit is zero before the action

## 28. Ada arrives at Fruit Warehouse and leaves an assistant

**Ada, the first merchant** — Ada arrives at Fruit Warehouse and leaves an assistant

![Ada arrives at Fruit Warehouse and leaves an assistant](./screenshots/015-host-arrives-fruit-desktop.png)

**Verifications:**

- [x] The panel offers an exact fill to capacity 2
- [x] Ada carries three assistants and has one at Fruit

## 29. Ada fills fruit to wheelbarrow capacity

**Ada, the first merchant** — Ada fills fruit to wheelbarrow capacity

![Ada fills fruit to wheelbarrow capacity](./screenshots/016-host-fills-fruit-desktop.png)

**Verifications:**

- [x] The completion panel reports fruit at capacity 2
- [x] Ada publicly holds exactly two fruit
- [x] The eighteenth event records the typed warehouse action once

## 30. Ada reloads before ending the completed Fruit turn

**Ada, the first merchant** — Ada reloads before ending the completed Fruit turn

![Ada reloads before ending the completed Fruit turn](./screenshots/017-host-reloads-completed-fruit-desktop.png)

**Verifications:**

- [x] The completed action panel returns instead of a repeatable fill
- [x] End turn is the only canonical continuation
- [x] Fresh replay restores every good and assistant without diagnostics

## 31. Ada passes the completed Fruit turn clockwise

**Ada, the first merchant** — Ada passes the completed Fruit turn clockwise

![Ada passes the completed Fruit turn clockwise](./screenshots/018-host-ends-fruit-turn-desktop.png)

**Verifications:**

- [x] Bora begins turn six in movement
- [x] All three warehouse fills remain public to both browsers
