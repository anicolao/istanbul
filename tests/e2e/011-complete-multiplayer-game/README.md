# Five merchants play an entire Istanbul game and open a rematch

Five isolated browsers join one immutable table. Ada alternates Tea House earnings with the Gemstone Dealer while every other merchant takes and closes each intervening ordinary turn. The journey records every route selection, movement, wager, ruby purchase, pass, final direct-resource choice, shared ranking projection, reload, and seeded rematch. No projected state is injected: every canonical event originates in visible game controls.

## 1. Ada opens the five-seat table creator

**Ada, merchant 1** — Ada opens the five-seat table creator

![Ada opens the five-seat table creator](./screenshots/000-ada-host-opens-five-seat-creator-desktop.png)

**Verifications:**

- [x] Firebase is ready before setup
- [x] The landing projection is empty

## 2. Ada enters her merchant name

**Ada, merchant 1** — Ada enters her merchant name

![Ada enters her merchant name](./screenshots/001-ada-host-enters-name-desktop.png)

**Verifications:**

- [x] The typed name is visible
- [x] Typing writes no event

## 3. Ada chooses five seats

**Ada, merchant 1** — Ada chooses five seats

![Ada chooses five seats](./screenshots/002-ada-host-selects-five-seats-desktop.png)

**Verifications:**

- [x] The selector shows five players
- [x] The creator remains local

## 4. Ada creates the private five-seat room

**Ada, merchant 1** — Ada creates the private five-seat room

![Ada creates the private five-seat room](./screenshots/003-ada-host-creates-five-seat-room-desktop.png)

**Verifications:**

- [x] Room FIVES or RACES is visible
- [x] One canonical creation event opens five seats

## 5. Bora opens the invitation

**Bora, merchant 2** — Bora opens the invitation

![Bora opens the invitation](./screenshots/000-bora-guest-opens-invitation-desktop.png)

**Verifications:**

- [x] The invited room is found
- [x] The player remains unseated

## 6. Bora enters a public name

**Bora, merchant 2** — Bora enters a public name

![Bora enters a public name](./screenshots/001-bora-guest-enters-name-desktop.png)

**Verifications:**

- [x] The public name is visible
- [x] Typing writes no event

## 7. Bora claims seat 2

**Bora, merchant 2** — Bora claims seat 2

![Bora claims seat 2](./screenshots/002-bora-guest-joins-room-desktop.png)

**Verifications:**

- [x] The ordered seat is visible
- [x] One join event adds the seat

## 8. Cem opens the invitation

**Cem, merchant 3** — Cem opens the invitation

![Cem opens the invitation](./screenshots/000-cem-guest-opens-invitation-desktop.png)

**Verifications:**

- [x] The invited room is found
- [x] The player remains unseated

## 9. Cem enters a public name

**Cem, merchant 3** — Cem enters a public name

![Cem enters a public name](./screenshots/001-cem-guest-enters-name-desktop.png)

**Verifications:**

- [x] The public name is visible
- [x] Typing writes no event

## 10. Cem claims seat 3

**Cem, merchant 3** — Cem claims seat 3

![Cem claims seat 3](./screenshots/002-cem-guest-joins-room-desktop.png)

**Verifications:**

- [x] The ordered seat is visible
- [x] One join event adds the seat

## 11. Derya opens the invitation

**Derya, merchant 4** — Derya opens the invitation

![Derya opens the invitation](./screenshots/000-derya-guest-opens-invitation-desktop.png)

**Verifications:**

- [x] The invited room is found
- [x] The player remains unseated

## 12. Derya enters a public name

**Derya, merchant 4** — Derya enters a public name

![Derya enters a public name](./screenshots/001-derya-guest-enters-name-desktop.png)

**Verifications:**

- [x] The public name is visible
- [x] Typing writes no event

## 13. Derya claims seat 4

**Derya, merchant 4** — Derya claims seat 4

![Derya claims seat 4](./screenshots/002-derya-guest-joins-room-desktop.png)

**Verifications:**

- [x] The ordered seat is visible
- [x] One join event adds the seat

## 14. Emre opens the invitation

**Emre, merchant 5** — Emre opens the invitation

![Emre opens the invitation](./screenshots/000-emre-guest-opens-invitation-desktop.png)

**Verifications:**

- [x] The invited room is found
- [x] The player remains unseated

## 15. Emre enters a public name

**Emre, merchant 5** — Emre enters a public name

![Emre enters a public name](./screenshots/001-emre-guest-enters-name-desktop.png)

**Verifications:**

- [x] The public name is visible
- [x] Typing writes no event

## 16. Emre claims seat 5

**Emre, merchant 5** — Emre claims seat 5

![Emre claims seat 5](./screenshots/002-emre-guest-joins-room-desktop.png)

**Verifications:**

- [x] The ordered seat is visible
- [x] One join event adds the seat

## 17. Bora readies the seat

**Bora, merchant 2** — Bora readies the seat

![Bora readies the seat](./screenshots/003-bora-guest-readies-desktop.png)

**Verifications:**

- [x] The seat readiness is true in the public projection
- [x] Readiness appends once

## 18. Cem readies the seat

**Cem, merchant 3** — Cem readies the seat

![Cem readies the seat](./screenshots/003-cem-guest-readies-desktop.png)

**Verifications:**

- [x] The seat readiness is true in the public projection
- [x] Readiness appends once

## 19. Derya readies the seat

**Derya, merchant 4** — Derya readies the seat

![Derya readies the seat](./screenshots/003-derya-guest-readies-desktop.png)

**Verifications:**

- [x] The seat readiness is true in the public projection
- [x] Readiness appends once

## 20. Emre readies the seat

**Emre, merchant 5** — Emre readies the seat

![Emre readies the seat](./screenshots/003-emre-guest-readies-desktop.png)

**Verifications:**

- [x] The seat readiness is true in the public projection
- [x] Readiness appends once

## 21. Ada readies the final seat

**Ada, merchant 1** — Ada readies the final seat

![Ada readies the final seat](./screenshots/004-ada-host-readies-desktop.png)

**Verifications:**

- [x] The five-seat table reports ready
- [x] All five readiness values are true

## 22. Ada opens the complete bazaar game

**Ada, merchant 1** — Ada opens the complete bazaar game

![Ada opens the complete bazaar game](./screenshots/005-ada-host-starts-complete-game-desktop.png)

**Verifications:**

- [x] Ada is the deterministic starting merchant
- [x] The target is five and every ordinary-turn counter starts at zero

## 23. Ada inspects her opening Lira Bonus

**Ada, merchant 1** — Ada inspects her opening Lira Bonus

![Ada inspects her opening Lira Bonus](./screenshots/006-ada-host-inspects-opening-bonus-desktop.png)

**Verifications:**

- [x] The private card effect is readable
- [x] Inspection writes no event

## 24. Ada plays the opening Lira Bonus

**Ada, merchant 1** — Ada plays the opening Lira Bonus

![Ada plays the opening Lira Bonus](./screenshots/007-ada-host-plays-opening-bonus-desktop.png)

**Verifications:**

- [x] Ada has 7 Lira
- [x] The private card moves to discard

## 25. Ada selects Tea House

**Ada, merchant 1** — Ada selects Tea House

![Ada selects Tea House](./screenshots/008-ada-cycle-1-ada-selects-tea-house-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 26. Ada moves to Tea House

**Ada, merchant 1** — Ada moves to Tea House

![Ada moves to Tea House](./screenshots/009-ada-cycle-1-ada-moves-tea-house-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 27. Ada declares 7 at Tea House

**Ada, merchant 1** — Ada declares 7 at Tea House

![Ada declares 7 at Tea House](./screenshots/010-ada-cycle-1-ada-declares-wager-desktop.png)

**Verifications:**

- [x] The visible wager matches the plan
- [x] The wager choice is local until submitted

## 28. Ada rolls at Tea House

**Ada, merchant 1** — Ada rolls at Tea House

![Ada rolls at Tea House](./screenshots/011-ada-cycle-1-ada-rolls-tea-desktop.png)

**Verifications:**

- [x] Seeded dice and Lira resolve into immutable state
- [x] The two dice are visibly rendered

## 29. Ada completes ordinary turn 1

**Ada, merchant 1** — Ada completes ordinary turn 1

![Ada completes ordinary turn 1](./screenshots/012-ada-cycle-1-ada-ends-desktop.png)

**Verifications:**

- [x] Bora begins the next clockwise turn
- [x] Ada’s ordinary-turn counter advances exactly once

## 30. Bora selects Fabric Warehouse

**Bora, merchant 2** — Bora selects Fabric Warehouse

![Bora selects Fabric Warehouse](./screenshots/004-bora-cycle-1-bora-selects-fabric-warehouse-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 31. Bora moves to Fabric Warehouse

**Bora, merchant 2** — Bora moves to Fabric Warehouse

![Bora moves to Fabric Warehouse](./screenshots/005-bora-cycle-1-bora-moves-fabric-warehouse-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 32. Bora passes clockwise

**Bora, merchant 2** — Bora passes clockwise

![Bora passes clockwise](./screenshots/006-bora-cycle-1-bora-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 33. Cem selects Spice Warehouse

**Cem, merchant 3** — Cem selects Spice Warehouse

![Cem selects Spice Warehouse](./screenshots/004-cem-cycle-1-cem-selects-spice-warehouse-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 34. Cem moves to Spice Warehouse

**Cem, merchant 3** — Cem moves to Spice Warehouse

![Cem moves to Spice Warehouse](./screenshots/005-cem-cycle-1-cem-moves-spice-warehouse-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 35. Cem passes clockwise

**Cem, merchant 3** — Cem passes clockwise

![Cem passes clockwise](./screenshots/006-cem-cycle-1-cem-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 36. Derya selects Fruit Warehouse

**Derya, merchant 4** — Derya selects Fruit Warehouse

![Derya selects Fruit Warehouse](./screenshots/004-derya-cycle-1-derya-selects-fruit-warehouse-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 37. Derya moves to Fruit Warehouse

**Derya, merchant 4** — Derya moves to Fruit Warehouse

![Derya moves to Fruit Warehouse](./screenshots/005-derya-cycle-1-derya-moves-fruit-warehouse-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 38. Derya passes clockwise

**Derya, merchant 4** — Derya passes clockwise

![Derya passes clockwise](./screenshots/006-derya-cycle-1-derya-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 39. Emre selects Caravansary

**Emre, merchant 5** — Emre selects Caravansary

![Emre selects Caravansary](./screenshots/004-emre-cycle-1-emre-selects-caravansary-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 40. Emre moves to Caravansary

**Emre, merchant 5** — Emre moves to Caravansary

![Emre moves to Caravansary](./screenshots/005-emre-cycle-1-emre-moves-caravansary-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 41. Emre passes clockwise

**Emre, merchant 5** — Emre passes clockwise

![Emre passes clockwise](./screenshots/006-emre-cycle-1-emre-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 42. Ada selects Gemstone Dealer

**Ada, merchant 1** — Ada selects Gemstone Dealer

![Ada selects Gemstone Dealer](./screenshots/013-ada-cycle-2-ada-selects-gemstone-dealer-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 43. Ada moves to Gemstone Dealer

**Ada, merchant 1** — Ada moves to Gemstone Dealer

![Ada moves to Gemstone Dealer](./screenshots/014-ada-cycle-2-ada-moves-gemstone-dealer-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 44. Ada completes ordinary turn 2

**Ada, merchant 1** — Ada completes ordinary turn 2

![Ada completes ordinary turn 2](./screenshots/015-ada-cycle-2-ada-ends-desktop.png)

**Verifications:**

- [x] Bora begins the next clockwise turn
- [x] Ada’s ordinary-turn counter advances exactly once

## 45. Bora selects Fountain

**Bora, merchant 2** — Bora selects Fountain

![Bora selects Fountain](./screenshots/007-bora-cycle-2-bora-selects-fountain-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 46. Bora moves to Fountain

**Bora, merchant 2** — Bora moves to Fountain

![Bora moves to Fountain](./screenshots/008-bora-cycle-2-bora-moves-fountain-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 47. Bora passes clockwise

**Bora, merchant 2** — Bora passes clockwise

![Bora passes clockwise](./screenshots/009-bora-cycle-2-bora-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 48. Cem selects Fountain

**Cem, merchant 3** — Cem selects Fountain

![Cem selects Fountain](./screenshots/007-cem-cycle-2-cem-selects-fountain-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 49. Cem moves to Fountain

**Cem, merchant 3** — Cem moves to Fountain

![Cem moves to Fountain](./screenshots/008-cem-cycle-2-cem-moves-fountain-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 50. Cem passes clockwise

**Cem, merchant 3** — Cem passes clockwise

![Cem passes clockwise](./screenshots/009-cem-cycle-2-cem-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 51. Derya selects Fountain

**Derya, merchant 4** — Derya selects Fountain

![Derya selects Fountain](./screenshots/007-derya-cycle-2-derya-selects-fountain-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 52. Derya moves to Fountain

**Derya, merchant 4** — Derya moves to Fountain

![Derya moves to Fountain](./screenshots/008-derya-cycle-2-derya-moves-fountain-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 53. Derya passes clockwise

**Derya, merchant 4** — Derya passes clockwise

![Derya passes clockwise](./screenshots/009-derya-cycle-2-derya-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 54. Emre selects Fountain

**Emre, merchant 5** — Emre selects Fountain

![Emre selects Fountain](./screenshots/007-emre-cycle-2-emre-selects-fountain-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 55. Emre moves to Fountain

**Emre, merchant 5** — Emre moves to Fountain

![Emre moves to Fountain](./screenshots/008-emre-cycle-2-emre-moves-fountain-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 56. Emre passes clockwise

**Emre, merchant 5** — Emre passes clockwise

![Emre passes clockwise](./screenshots/009-emre-cycle-2-emre-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 57. Ada selects Tea House

**Ada, merchant 1** — Ada selects Tea House

![Ada selects Tea House](./screenshots/016-ada-cycle-3-ada-selects-tea-house-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 58. Ada moves to Tea House

**Ada, merchant 1** — Ada moves to Tea House

![Ada moves to Tea House](./screenshots/017-ada-cycle-3-ada-moves-tea-house-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 59. Ada declares 12 at Tea House

**Ada, merchant 1** — Ada declares 12 at Tea House

![Ada declares 12 at Tea House](./screenshots/018-ada-cycle-3-ada-declares-wager-desktop.png)

**Verifications:**

- [x] The visible wager matches the plan
- [x] The wager choice is local until submitted

## 60. Ada rolls at Tea House

**Ada, merchant 1** — Ada rolls at Tea House

![Ada rolls at Tea House](./screenshots/019-ada-cycle-3-ada-rolls-tea-desktop.png)

**Verifications:**

- [x] Seeded dice and Lira resolve into immutable state
- [x] The two dice are visibly rendered

## 61. Ada completes ordinary turn 3

**Ada, merchant 1** — Ada completes ordinary turn 3

![Ada completes ordinary turn 3](./screenshots/020-ada-cycle-3-ada-ends-desktop.png)

**Verifications:**

- [x] Bora begins the next clockwise turn
- [x] Ada’s ordinary-turn counter advances exactly once

## 62. Bora selects Fabric Warehouse

**Bora, merchant 2** — Bora selects Fabric Warehouse

![Bora selects Fabric Warehouse](./screenshots/010-bora-cycle-3-bora-selects-fabric-warehouse-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 63. Bora moves to Fabric Warehouse

**Bora, merchant 2** — Bora moves to Fabric Warehouse

![Bora moves to Fabric Warehouse](./screenshots/011-bora-cycle-3-bora-moves-fabric-warehouse-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 64. Bora passes clockwise

**Bora, merchant 2** — Bora passes clockwise

![Bora passes clockwise](./screenshots/012-bora-cycle-3-bora-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 65. Cem selects Spice Warehouse

**Cem, merchant 3** — Cem selects Spice Warehouse

![Cem selects Spice Warehouse](./screenshots/010-cem-cycle-3-cem-selects-spice-warehouse-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 66. Cem moves to Spice Warehouse

**Cem, merchant 3** — Cem moves to Spice Warehouse

![Cem moves to Spice Warehouse](./screenshots/011-cem-cycle-3-cem-moves-spice-warehouse-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 67. Cem passes clockwise

**Cem, merchant 3** — Cem passes clockwise

![Cem passes clockwise](./screenshots/012-cem-cycle-3-cem-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 68. Derya selects Fruit Warehouse

**Derya, merchant 4** — Derya selects Fruit Warehouse

![Derya selects Fruit Warehouse](./screenshots/010-derya-cycle-3-derya-selects-fruit-warehouse-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 69. Derya moves to Fruit Warehouse

**Derya, merchant 4** — Derya moves to Fruit Warehouse

![Derya moves to Fruit Warehouse](./screenshots/011-derya-cycle-3-derya-moves-fruit-warehouse-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 70. Derya passes clockwise

**Derya, merchant 4** — Derya passes clockwise

![Derya passes clockwise](./screenshots/012-derya-cycle-3-derya-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 71. Emre selects Caravansary

**Emre, merchant 5** — Emre selects Caravansary

![Emre selects Caravansary](./screenshots/010-emre-cycle-3-emre-selects-caravansary-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 72. Emre moves to Caravansary

**Emre, merchant 5** — Emre moves to Caravansary

![Emre moves to Caravansary](./screenshots/011-emre-cycle-3-emre-moves-caravansary-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 73. Emre passes clockwise

**Emre, merchant 5** — Emre passes clockwise

![Emre passes clockwise](./screenshots/012-emre-cycle-3-emre-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 74. Ada selects Gemstone Dealer

**Ada, merchant 1** — Ada selects Gemstone Dealer

![Ada selects Gemstone Dealer](./screenshots/021-ada-cycle-4-ada-selects-gemstone-dealer-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 75. Ada moves to Gemstone Dealer

**Ada, merchant 1** — Ada moves to Gemstone Dealer

![Ada moves to Gemstone Dealer](./screenshots/022-ada-cycle-4-ada-moves-gemstone-dealer-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 76. Ada buys the 12-Lira ruby

**Ada, merchant 1** — Ada buys the 12-Lira ruby

![Ada buys the 12-Lira ruby](./screenshots/023-ada-cycle-4-ada-buys-ruby-desktop.png)

**Verifications:**

- [x] The escalating Dealer track advances by one
- [x] The exact payment is reported

## 77. Ada completes ordinary turn 4

**Ada, merchant 1** — Ada completes ordinary turn 4

![Ada completes ordinary turn 4](./screenshots/024-ada-cycle-4-ada-ends-desktop.png)

**Verifications:**

- [x] Bora begins the next clockwise turn
- [x] Ada’s ordinary-turn counter advances exactly once

## 78. Bora selects Fountain

**Bora, merchant 2** — Bora selects Fountain

![Bora selects Fountain](./screenshots/013-bora-cycle-4-bora-selects-fountain-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 79. Bora moves to Fountain

**Bora, merchant 2** — Bora moves to Fountain

![Bora moves to Fountain](./screenshots/014-bora-cycle-4-bora-moves-fountain-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 80. Bora passes clockwise

**Bora, merchant 2** — Bora passes clockwise

![Bora passes clockwise](./screenshots/015-bora-cycle-4-bora-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 81. Cem selects Fountain

**Cem, merchant 3** — Cem selects Fountain

![Cem selects Fountain](./screenshots/013-cem-cycle-4-cem-selects-fountain-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 82. Cem moves to Fountain

**Cem, merchant 3** — Cem moves to Fountain

![Cem moves to Fountain](./screenshots/014-cem-cycle-4-cem-moves-fountain-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 83. Cem passes clockwise

**Cem, merchant 3** — Cem passes clockwise

![Cem passes clockwise](./screenshots/015-cem-cycle-4-cem-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 84. Derya selects Fountain

**Derya, merchant 4** — Derya selects Fountain

![Derya selects Fountain](./screenshots/013-derya-cycle-4-derya-selects-fountain-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 85. Derya moves to Fountain

**Derya, merchant 4** — Derya moves to Fountain

![Derya moves to Fountain](./screenshots/014-derya-cycle-4-derya-moves-fountain-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 86. Derya passes clockwise

**Derya, merchant 4** — Derya passes clockwise

![Derya passes clockwise](./screenshots/015-derya-cycle-4-derya-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 87. Emre selects Fountain

**Emre, merchant 5** — Emre selects Fountain

![Emre selects Fountain](./screenshots/013-emre-cycle-4-emre-selects-fountain-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 88. Emre moves to Fountain

**Emre, merchant 5** — Emre moves to Fountain

![Emre moves to Fountain](./screenshots/014-emre-cycle-4-emre-moves-fountain-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 89. Emre passes clockwise

**Emre, merchant 5** — Emre passes clockwise

![Emre passes clockwise](./screenshots/015-emre-cycle-4-emre-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 90. Ada selects Tea House

**Ada, merchant 1** — Ada selects Tea House

![Ada selects Tea House](./screenshots/025-ada-cycle-5-ada-selects-tea-house-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 91. Ada moves to Tea House

**Ada, merchant 1** — Ada moves to Tea House

![Ada moves to Tea House](./screenshots/026-ada-cycle-5-ada-moves-tea-house-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 92. Ada declares 11 at Tea House

**Ada, merchant 1** — Ada declares 11 at Tea House

![Ada declares 11 at Tea House](./screenshots/027-ada-cycle-5-ada-declares-wager-desktop.png)

**Verifications:**

- [x] The visible wager matches the plan
- [x] The wager choice is local until submitted

## 93. Ada rolls at Tea House

**Ada, merchant 1** — Ada rolls at Tea House

![Ada rolls at Tea House](./screenshots/028-ada-cycle-5-ada-rolls-tea-desktop.png)

**Verifications:**

- [x] Seeded dice and Lira resolve into immutable state
- [x] The two dice are visibly rendered

## 94. Ada completes ordinary turn 5

**Ada, merchant 1** — Ada completes ordinary turn 5

![Ada completes ordinary turn 5](./screenshots/029-ada-cycle-5-ada-ends-desktop.png)

**Verifications:**

- [x] Bora begins the next clockwise turn
- [x] Ada’s ordinary-turn counter advances exactly once

## 95. Bora selects Fabric Warehouse

**Bora, merchant 2** — Bora selects Fabric Warehouse

![Bora selects Fabric Warehouse](./screenshots/016-bora-cycle-5-bora-selects-fabric-warehouse-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 96. Bora moves to Fabric Warehouse

**Bora, merchant 2** — Bora moves to Fabric Warehouse

![Bora moves to Fabric Warehouse](./screenshots/017-bora-cycle-5-bora-moves-fabric-warehouse-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 97. Bora passes clockwise

**Bora, merchant 2** — Bora passes clockwise

![Bora passes clockwise](./screenshots/018-bora-cycle-5-bora-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 98. Cem selects Spice Warehouse

**Cem, merchant 3** — Cem selects Spice Warehouse

![Cem selects Spice Warehouse](./screenshots/016-cem-cycle-5-cem-selects-spice-warehouse-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 99. Cem moves to Spice Warehouse

**Cem, merchant 3** — Cem moves to Spice Warehouse

![Cem moves to Spice Warehouse](./screenshots/017-cem-cycle-5-cem-moves-spice-warehouse-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 100. Cem passes clockwise

**Cem, merchant 3** — Cem passes clockwise

![Cem passes clockwise](./screenshots/018-cem-cycle-5-cem-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 101. Derya selects Fruit Warehouse

**Derya, merchant 4** — Derya selects Fruit Warehouse

![Derya selects Fruit Warehouse](./screenshots/016-derya-cycle-5-derya-selects-fruit-warehouse-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 102. Derya moves to Fruit Warehouse

**Derya, merchant 4** — Derya moves to Fruit Warehouse

![Derya moves to Fruit Warehouse](./screenshots/017-derya-cycle-5-derya-moves-fruit-warehouse-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 103. Derya passes clockwise

**Derya, merchant 4** — Derya passes clockwise

![Derya passes clockwise](./screenshots/018-derya-cycle-5-derya-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 104. Emre selects Caravansary

**Emre, merchant 5** — Emre selects Caravansary

![Emre selects Caravansary](./screenshots/016-emre-cycle-5-emre-selects-caravansary-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 105. Emre moves to Caravansary

**Emre, merchant 5** — Emre moves to Caravansary

![Emre moves to Caravansary](./screenshots/017-emre-cycle-5-emre-moves-caravansary-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 106. Emre passes clockwise

**Emre, merchant 5** — Emre passes clockwise

![Emre passes clockwise](./screenshots/018-emre-cycle-5-emre-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 107. Ada selects Gemstone Dealer

**Ada, merchant 1** — Ada selects Gemstone Dealer

![Ada selects Gemstone Dealer](./screenshots/030-ada-cycle-6-ada-selects-gemstone-dealer-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 108. Ada moves to Gemstone Dealer

**Ada, merchant 1** — Ada moves to Gemstone Dealer

![Ada moves to Gemstone Dealer](./screenshots/031-ada-cycle-6-ada-moves-gemstone-dealer-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 109. Ada buys the 13-Lira ruby

**Ada, merchant 1** — Ada buys the 13-Lira ruby

![Ada buys the 13-Lira ruby](./screenshots/032-ada-cycle-6-ada-buys-ruby-desktop.png)

**Verifications:**

- [x] The escalating Dealer track advances by one
- [x] The exact payment is reported

## 110. Ada completes ordinary turn 6

**Ada, merchant 1** — Ada completes ordinary turn 6

![Ada completes ordinary turn 6](./screenshots/033-ada-cycle-6-ada-ends-desktop.png)

**Verifications:**

- [x] Bora begins the next clockwise turn
- [x] Ada’s ordinary-turn counter advances exactly once

## 111. Bora selects Fountain

**Bora, merchant 2** — Bora selects Fountain

![Bora selects Fountain](./screenshots/019-bora-cycle-6-bora-selects-fountain-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 112. Bora moves to Fountain

**Bora, merchant 2** — Bora moves to Fountain

![Bora moves to Fountain](./screenshots/020-bora-cycle-6-bora-moves-fountain-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 113. Bora passes clockwise

**Bora, merchant 2** — Bora passes clockwise

![Bora passes clockwise](./screenshots/021-bora-cycle-6-bora-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 114. Cem selects Fountain

**Cem, merchant 3** — Cem selects Fountain

![Cem selects Fountain](./screenshots/019-cem-cycle-6-cem-selects-fountain-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 115. Cem moves to Fountain

**Cem, merchant 3** — Cem moves to Fountain

![Cem moves to Fountain](./screenshots/020-cem-cycle-6-cem-moves-fountain-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 116. Cem passes clockwise

**Cem, merchant 3** — Cem passes clockwise

![Cem passes clockwise](./screenshots/021-cem-cycle-6-cem-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 117. Derya selects Fountain

**Derya, merchant 4** — Derya selects Fountain

![Derya selects Fountain](./screenshots/019-derya-cycle-6-derya-selects-fountain-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 118. Derya moves to Fountain

**Derya, merchant 4** — Derya moves to Fountain

![Derya moves to Fountain](./screenshots/020-derya-cycle-6-derya-moves-fountain-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 119. Derya passes clockwise

**Derya, merchant 4** — Derya passes clockwise

![Derya passes clockwise](./screenshots/021-derya-cycle-6-derya-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 120. Emre selects Fountain

**Emre, merchant 5** — Emre selects Fountain

![Emre selects Fountain](./screenshots/019-emre-cycle-6-emre-selects-fountain-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 121. Emre moves to Fountain

**Emre, merchant 5** — Emre moves to Fountain

![Emre moves to Fountain](./screenshots/020-emre-cycle-6-emre-moves-fountain-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 122. Emre passes clockwise

**Emre, merchant 5** — Emre passes clockwise

![Emre passes clockwise](./screenshots/021-emre-cycle-6-emre-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 123. Ada selects Tea House

**Ada, merchant 1** — Ada selects Tea House

![Ada selects Tea House](./screenshots/034-ada-cycle-7-ada-selects-tea-house-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 124. Ada moves to Tea House

**Ada, merchant 1** — Ada moves to Tea House

![Ada moves to Tea House](./screenshots/035-ada-cycle-7-ada-moves-tea-house-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 125. Ada declares 12 at Tea House

**Ada, merchant 1** — Ada declares 12 at Tea House

![Ada declares 12 at Tea House](./screenshots/036-ada-cycle-7-ada-declares-wager-desktop.png)

**Verifications:**

- [x] The visible wager matches the plan
- [x] The wager choice is local until submitted

## 126. Ada rolls at Tea House

**Ada, merchant 1** — Ada rolls at Tea House

![Ada rolls at Tea House](./screenshots/037-ada-cycle-7-ada-rolls-tea-desktop.png)

**Verifications:**

- [x] Seeded dice and Lira resolve into immutable state
- [x] The two dice are visibly rendered

## 127. Ada completes ordinary turn 7

**Ada, merchant 1** — Ada completes ordinary turn 7

![Ada completes ordinary turn 7](./screenshots/038-ada-cycle-7-ada-ends-desktop.png)

**Verifications:**

- [x] Bora begins the next clockwise turn
- [x] Ada’s ordinary-turn counter advances exactly once

## 128. Bora selects Fabric Warehouse

**Bora, merchant 2** — Bora selects Fabric Warehouse

![Bora selects Fabric Warehouse](./screenshots/022-bora-cycle-7-bora-selects-fabric-warehouse-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 129. Bora moves to Fabric Warehouse

**Bora, merchant 2** — Bora moves to Fabric Warehouse

![Bora moves to Fabric Warehouse](./screenshots/023-bora-cycle-7-bora-moves-fabric-warehouse-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 130. Bora passes clockwise

**Bora, merchant 2** — Bora passes clockwise

![Bora passes clockwise](./screenshots/024-bora-cycle-7-bora-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 131. Cem selects Spice Warehouse

**Cem, merchant 3** — Cem selects Spice Warehouse

![Cem selects Spice Warehouse](./screenshots/022-cem-cycle-7-cem-selects-spice-warehouse-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 132. Cem moves to Spice Warehouse

**Cem, merchant 3** — Cem moves to Spice Warehouse

![Cem moves to Spice Warehouse](./screenshots/023-cem-cycle-7-cem-moves-spice-warehouse-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 133. Cem passes clockwise

**Cem, merchant 3** — Cem passes clockwise

![Cem passes clockwise](./screenshots/024-cem-cycle-7-cem-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 134. Derya selects Fruit Warehouse

**Derya, merchant 4** — Derya selects Fruit Warehouse

![Derya selects Fruit Warehouse](./screenshots/022-derya-cycle-7-derya-selects-fruit-warehouse-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 135. Derya moves to Fruit Warehouse

**Derya, merchant 4** — Derya moves to Fruit Warehouse

![Derya moves to Fruit Warehouse](./screenshots/023-derya-cycle-7-derya-moves-fruit-warehouse-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 136. Derya passes clockwise

**Derya, merchant 4** — Derya passes clockwise

![Derya passes clockwise](./screenshots/024-derya-cycle-7-derya-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 137. Emre selects Caravansary

**Emre, merchant 5** — Emre selects Caravansary

![Emre selects Caravansary](./screenshots/022-emre-cycle-7-emre-selects-caravansary-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 138. Emre moves to Caravansary

**Emre, merchant 5** — Emre moves to Caravansary

![Emre moves to Caravansary](./screenshots/023-emre-cycle-7-emre-moves-caravansary-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 139. Emre passes clockwise

**Emre, merchant 5** — Emre passes clockwise

![Emre passes clockwise](./screenshots/024-emre-cycle-7-emre-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 140. Ada selects Gemstone Dealer

**Ada, merchant 1** — Ada selects Gemstone Dealer

![Ada selects Gemstone Dealer](./screenshots/039-ada-cycle-8-ada-selects-gemstone-dealer-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 141. Ada moves to Gemstone Dealer

**Ada, merchant 1** — Ada moves to Gemstone Dealer

![Ada moves to Gemstone Dealer](./screenshots/040-ada-cycle-8-ada-moves-gemstone-dealer-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 142. Ada buys the 14-Lira ruby

**Ada, merchant 1** — Ada buys the 14-Lira ruby

![Ada buys the 14-Lira ruby](./screenshots/041-ada-cycle-8-ada-buys-ruby-desktop.png)

**Verifications:**

- [x] The escalating Dealer track advances by one
- [x] The exact payment is reported

## 143. Ada completes ordinary turn 8

**Ada, merchant 1** — Ada completes ordinary turn 8

![Ada completes ordinary turn 8](./screenshots/042-ada-cycle-8-ada-ends-desktop.png)

**Verifications:**

- [x] Bora begins the next clockwise turn
- [x] Ada’s ordinary-turn counter advances exactly once

## 144. Bora selects Fountain

**Bora, merchant 2** — Bora selects Fountain

![Bora selects Fountain](./screenshots/025-bora-cycle-8-bora-selects-fountain-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 145. Bora moves to Fountain

**Bora, merchant 2** — Bora moves to Fountain

![Bora moves to Fountain](./screenshots/026-bora-cycle-8-bora-moves-fountain-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 146. Bora passes clockwise

**Bora, merchant 2** — Bora passes clockwise

![Bora passes clockwise](./screenshots/027-bora-cycle-8-bora-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 147. Cem selects Fountain

**Cem, merchant 3** — Cem selects Fountain

![Cem selects Fountain](./screenshots/025-cem-cycle-8-cem-selects-fountain-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 148. Cem moves to Fountain

**Cem, merchant 3** — Cem moves to Fountain

![Cem moves to Fountain](./screenshots/026-cem-cycle-8-cem-moves-fountain-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 149. Cem passes clockwise

**Cem, merchant 3** — Cem passes clockwise

![Cem passes clockwise](./screenshots/027-cem-cycle-8-cem-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 150. Derya selects Fountain

**Derya, merchant 4** — Derya selects Fountain

![Derya selects Fountain](./screenshots/025-derya-cycle-8-derya-selects-fountain-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 151. Derya moves to Fountain

**Derya, merchant 4** — Derya moves to Fountain

![Derya moves to Fountain](./screenshots/026-derya-cycle-8-derya-moves-fountain-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 152. Derya passes clockwise

**Derya, merchant 4** — Derya passes clockwise

![Derya passes clockwise](./screenshots/027-derya-cycle-8-derya-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 153. Emre selects Fountain

**Emre, merchant 5** — Emre selects Fountain

![Emre selects Fountain](./screenshots/025-emre-cycle-8-emre-selects-fountain-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 154. Emre moves to Fountain

**Emre, merchant 5** — Emre moves to Fountain

![Emre moves to Fountain](./screenshots/026-emre-cycle-8-emre-moves-fountain-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 155. Emre passes clockwise

**Emre, merchant 5** — Emre passes clockwise

![Emre passes clockwise](./screenshots/027-emre-cycle-8-emre-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 156. Ada selects Tea House

**Ada, merchant 1** — Ada selects Tea House

![Ada selects Tea House](./screenshots/043-ada-cycle-9-ada-selects-tea-house-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 157. Ada moves to Tea House

**Ada, merchant 1** — Ada moves to Tea House

![Ada moves to Tea House](./screenshots/044-ada-cycle-9-ada-moves-tea-house-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 158. Ada declares 10 at Tea House

**Ada, merchant 1** — Ada declares 10 at Tea House

![Ada declares 10 at Tea House](./screenshots/045-ada-cycle-9-ada-declares-wager-desktop.png)

**Verifications:**

- [x] The visible wager matches the plan
- [x] The wager choice is local until submitted

## 159. Ada rolls at Tea House

**Ada, merchant 1** — Ada rolls at Tea House

![Ada rolls at Tea House](./screenshots/046-ada-cycle-9-ada-rolls-tea-desktop.png)

**Verifications:**

- [x] Seeded dice and Lira resolve into immutable state
- [x] The two dice are visibly rendered

## 160. Ada completes ordinary turn 9

**Ada, merchant 1** — Ada completes ordinary turn 9

![Ada completes ordinary turn 9](./screenshots/047-ada-cycle-9-ada-ends-desktop.png)

**Verifications:**

- [x] Bora begins the next clockwise turn
- [x] Ada’s ordinary-turn counter advances exactly once

## 161. Bora selects Fabric Warehouse

**Bora, merchant 2** — Bora selects Fabric Warehouse

![Bora selects Fabric Warehouse](./screenshots/028-bora-cycle-9-bora-selects-fabric-warehouse-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 162. Bora moves to Fabric Warehouse

**Bora, merchant 2** — Bora moves to Fabric Warehouse

![Bora moves to Fabric Warehouse](./screenshots/029-bora-cycle-9-bora-moves-fabric-warehouse-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 163. Bora passes clockwise

**Bora, merchant 2** — Bora passes clockwise

![Bora passes clockwise](./screenshots/030-bora-cycle-9-bora-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 164. Cem selects Spice Warehouse

**Cem, merchant 3** — Cem selects Spice Warehouse

![Cem selects Spice Warehouse](./screenshots/028-cem-cycle-9-cem-selects-spice-warehouse-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 165. Cem moves to Spice Warehouse

**Cem, merchant 3** — Cem moves to Spice Warehouse

![Cem moves to Spice Warehouse](./screenshots/029-cem-cycle-9-cem-moves-spice-warehouse-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 166. Cem passes clockwise

**Cem, merchant 3** — Cem passes clockwise

![Cem passes clockwise](./screenshots/030-cem-cycle-9-cem-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 167. Derya selects Fruit Warehouse

**Derya, merchant 4** — Derya selects Fruit Warehouse

![Derya selects Fruit Warehouse](./screenshots/028-derya-cycle-9-derya-selects-fruit-warehouse-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 168. Derya moves to Fruit Warehouse

**Derya, merchant 4** — Derya moves to Fruit Warehouse

![Derya moves to Fruit Warehouse](./screenshots/029-derya-cycle-9-derya-moves-fruit-warehouse-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 169. Derya passes clockwise

**Derya, merchant 4** — Derya passes clockwise

![Derya passes clockwise](./screenshots/030-derya-cycle-9-derya-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 170. Emre selects Caravansary

**Emre, merchant 5** — Emre selects Caravansary

![Emre selects Caravansary](./screenshots/028-emre-cycle-9-emre-selects-caravansary-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 171. Emre moves to Caravansary

**Emre, merchant 5** — Emre moves to Caravansary

![Emre moves to Caravansary](./screenshots/029-emre-cycle-9-emre-moves-caravansary-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 172. Emre passes clockwise

**Emre, merchant 5** — Emre passes clockwise

![Emre passes clockwise](./screenshots/030-emre-cycle-9-emre-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 173. Ada selects Gemstone Dealer

**Ada, merchant 1** — Ada selects Gemstone Dealer

![Ada selects Gemstone Dealer](./screenshots/048-ada-cycle-10-ada-selects-gemstone-dealer-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 174. Ada moves to Gemstone Dealer

**Ada, merchant 1** — Ada moves to Gemstone Dealer

![Ada moves to Gemstone Dealer](./screenshots/049-ada-cycle-10-ada-moves-gemstone-dealer-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 175. Ada buys the 15-Lira ruby

**Ada, merchant 1** — Ada buys the 15-Lira ruby

![Ada buys the 15-Lira ruby](./screenshots/050-ada-cycle-10-ada-buys-ruby-desktop.png)

**Verifications:**

- [x] The escalating Dealer track advances by one
- [x] The exact payment is reported

## 176. Ada completes ordinary turn 10

**Ada, merchant 1** — Ada completes ordinary turn 10

![Ada completes ordinary turn 10](./screenshots/051-ada-cycle-10-ada-ends-desktop.png)

**Verifications:**

- [x] Bora begins the next clockwise turn
- [x] Ada’s ordinary-turn counter advances exactly once

## 177. Bora selects Fountain

**Bora, merchant 2** — Bora selects Fountain

![Bora selects Fountain](./screenshots/031-bora-cycle-10-bora-selects-fountain-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 178. Bora moves to Fountain

**Bora, merchant 2** — Bora moves to Fountain

![Bora moves to Fountain](./screenshots/032-bora-cycle-10-bora-moves-fountain-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 179. Bora passes clockwise

**Bora, merchant 2** — Bora passes clockwise

![Bora passes clockwise](./screenshots/033-bora-cycle-10-bora-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 180. Cem selects Fountain

**Cem, merchant 3** — Cem selects Fountain

![Cem selects Fountain](./screenshots/031-cem-cycle-10-cem-selects-fountain-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 181. Cem moves to Fountain

**Cem, merchant 3** — Cem moves to Fountain

![Cem moves to Fountain](./screenshots/032-cem-cycle-10-cem-moves-fountain-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 182. Cem passes clockwise

**Cem, merchant 3** — Cem passes clockwise

![Cem passes clockwise](./screenshots/033-cem-cycle-10-cem-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 183. Derya selects Fountain

**Derya, merchant 4** — Derya selects Fountain

![Derya selects Fountain](./screenshots/031-derya-cycle-10-derya-selects-fountain-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 184. Derya moves to Fountain

**Derya, merchant 4** — Derya moves to Fountain

![Derya moves to Fountain](./screenshots/032-derya-cycle-10-derya-moves-fountain-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 185. Derya passes clockwise

**Derya, merchant 4** — Derya passes clockwise

![Derya passes clockwise](./screenshots/033-derya-cycle-10-derya-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 186. Emre selects Fountain

**Emre, merchant 5** — Emre selects Fountain

![Emre selects Fountain](./screenshots/031-emre-cycle-10-emre-selects-fountain-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 187. Emre moves to Fountain

**Emre, merchant 5** — Emre moves to Fountain

![Emre moves to Fountain](./screenshots/032-emre-cycle-10-emre-moves-fountain-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 188. Emre passes clockwise

**Emre, merchant 5** — Emre passes clockwise

![Emre passes clockwise](./screenshots/033-emre-cycle-10-emre-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 189. Ada selects Tea House

**Ada, merchant 1** — Ada selects Tea House

![Ada selects Tea House](./screenshots/052-ada-cycle-11-ada-selects-tea-house-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 190. Ada moves to Tea House

**Ada, merchant 1** — Ada moves to Tea House

![Ada moves to Tea House](./screenshots/053-ada-cycle-11-ada-moves-tea-house-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 191. Ada declares 9 at Tea House

**Ada, merchant 1** — Ada declares 9 at Tea House

![Ada declares 9 at Tea House](./screenshots/054-ada-cycle-11-ada-declares-wager-desktop.png)

**Verifications:**

- [x] The visible wager matches the plan
- [x] The wager choice is local until submitted

## 192. Ada rolls at Tea House

**Ada, merchant 1** — Ada rolls at Tea House

![Ada rolls at Tea House](./screenshots/055-ada-cycle-11-ada-rolls-tea-desktop.png)

**Verifications:**

- [x] Seeded dice and Lira resolve into immutable state
- [x] The two dice are visibly rendered

## 193. Ada completes ordinary turn 11

**Ada, merchant 1** — Ada completes ordinary turn 11

![Ada completes ordinary turn 11](./screenshots/056-ada-cycle-11-ada-ends-desktop.png)

**Verifications:**

- [x] Bora begins the next clockwise turn
- [x] Ada’s ordinary-turn counter advances exactly once

## 194. Bora selects Fabric Warehouse

**Bora, merchant 2** — Bora selects Fabric Warehouse

![Bora selects Fabric Warehouse](./screenshots/034-bora-cycle-11-bora-selects-fabric-warehouse-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 195. Bora moves to Fabric Warehouse

**Bora, merchant 2** — Bora moves to Fabric Warehouse

![Bora moves to Fabric Warehouse](./screenshots/035-bora-cycle-11-bora-moves-fabric-warehouse-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 196. Bora passes clockwise

**Bora, merchant 2** — Bora passes clockwise

![Bora passes clockwise](./screenshots/036-bora-cycle-11-bora-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 197. Cem selects Spice Warehouse

**Cem, merchant 3** — Cem selects Spice Warehouse

![Cem selects Spice Warehouse](./screenshots/034-cem-cycle-11-cem-selects-spice-warehouse-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 198. Cem moves to Spice Warehouse

**Cem, merchant 3** — Cem moves to Spice Warehouse

![Cem moves to Spice Warehouse](./screenshots/035-cem-cycle-11-cem-moves-spice-warehouse-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 199. Cem passes clockwise

**Cem, merchant 3** — Cem passes clockwise

![Cem passes clockwise](./screenshots/036-cem-cycle-11-cem-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 200. Derya selects Fruit Warehouse

**Derya, merchant 4** — Derya selects Fruit Warehouse

![Derya selects Fruit Warehouse](./screenshots/034-derya-cycle-11-derya-selects-fruit-warehouse-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 201. Derya moves to Fruit Warehouse

**Derya, merchant 4** — Derya moves to Fruit Warehouse

![Derya moves to Fruit Warehouse](./screenshots/035-derya-cycle-11-derya-moves-fruit-warehouse-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 202. Derya passes clockwise

**Derya, merchant 4** — Derya passes clockwise

![Derya passes clockwise](./screenshots/036-derya-cycle-11-derya-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 203. Emre selects Caravansary

**Emre, merchant 5** — Emre selects Caravansary

![Emre selects Caravansary](./screenshots/034-emre-cycle-11-emre-selects-caravansary-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 204. Emre moves to Caravansary

**Emre, merchant 5** — Emre moves to Caravansary

![Emre moves to Caravansary](./screenshots/035-emre-cycle-11-emre-moves-caravansary-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 205. Emre passes clockwise

**Emre, merchant 5** — Emre passes clockwise

![Emre passes clockwise](./screenshots/036-emre-cycle-11-emre-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 206. Ada selects Gemstone Dealer

**Ada, merchant 1** — Ada selects Gemstone Dealer

![Ada selects Gemstone Dealer](./screenshots/057-ada-cycle-12-ada-selects-gemstone-dealer-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 207. Ada moves to Gemstone Dealer

**Ada, merchant 1** — Ada moves to Gemstone Dealer

![Ada moves to Gemstone Dealer](./screenshots/058-ada-cycle-12-ada-moves-gemstone-dealer-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 208. Ada completes ordinary turn 12

**Ada, merchant 1** — Ada completes ordinary turn 12

![Ada completes ordinary turn 12](./screenshots/059-ada-cycle-12-ada-ends-desktop.png)

**Verifications:**

- [x] Bora begins the next clockwise turn
- [x] Ada’s ordinary-turn counter advances exactly once

## 209. Bora selects Fountain

**Bora, merchant 2** — Bora selects Fountain

![Bora selects Fountain](./screenshots/037-bora-cycle-12-bora-selects-fountain-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 210. Bora moves to Fountain

**Bora, merchant 2** — Bora moves to Fountain

![Bora moves to Fountain](./screenshots/038-bora-cycle-12-bora-moves-fountain-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 211. Bora passes clockwise

**Bora, merchant 2** — Bora passes clockwise

![Bora passes clockwise](./screenshots/039-bora-cycle-12-bora-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 212. Cem selects Fountain

**Cem, merchant 3** — Cem selects Fountain

![Cem selects Fountain](./screenshots/037-cem-cycle-12-cem-selects-fountain-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 213. Cem moves to Fountain

**Cem, merchant 3** — Cem moves to Fountain

![Cem moves to Fountain](./screenshots/038-cem-cycle-12-cem-moves-fountain-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 214. Cem passes clockwise

**Cem, merchant 3** — Cem passes clockwise

![Cem passes clockwise](./screenshots/039-cem-cycle-12-cem-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 215. Derya selects Fountain

**Derya, merchant 4** — Derya selects Fountain

![Derya selects Fountain](./screenshots/037-derya-cycle-12-derya-selects-fountain-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 216. Derya moves to Fountain

**Derya, merchant 4** — Derya moves to Fountain

![Derya moves to Fountain](./screenshots/038-derya-cycle-12-derya-moves-fountain-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 217. Derya passes clockwise

**Derya, merchant 4** — Derya passes clockwise

![Derya passes clockwise](./screenshots/039-derya-cycle-12-derya-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 218. Emre selects Fountain

**Emre, merchant 5** — Emre selects Fountain

![Emre selects Fountain](./screenshots/037-emre-cycle-12-emre-selects-fountain-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 219. Emre moves to Fountain

**Emre, merchant 5** — Emre moves to Fountain

![Emre moves to Fountain](./screenshots/038-emre-cycle-12-emre-moves-fountain-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 220. Emre passes clockwise

**Emre, merchant 5** — Emre passes clockwise

![Emre passes clockwise](./screenshots/039-emre-cycle-12-emre-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 221. Ada selects Tea House

**Ada, merchant 1** — Ada selects Tea House

![Ada selects Tea House](./screenshots/060-ada-cycle-13-ada-selects-tea-house-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 222. Ada moves to Tea House

**Ada, merchant 1** — Ada moves to Tea House

![Ada moves to Tea House](./screenshots/061-ada-cycle-13-ada-moves-tea-house-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 223. Ada declares 12 at Tea House

**Ada, merchant 1** — Ada declares 12 at Tea House

![Ada declares 12 at Tea House](./screenshots/062-ada-cycle-13-ada-declares-wager-desktop.png)

**Verifications:**

- [x] The visible wager matches the plan
- [x] The wager choice is local until submitted

## 224. Ada rolls at Tea House

**Ada, merchant 1** — Ada rolls at Tea House

![Ada rolls at Tea House](./screenshots/063-ada-cycle-13-ada-rolls-tea-desktop.png)

**Verifications:**

- [x] Seeded dice and Lira resolve into immutable state
- [x] The two dice are visibly rendered

## 225. Ada completes ordinary turn 13

**Ada, merchant 1** — Ada completes ordinary turn 13

![Ada completes ordinary turn 13](./screenshots/064-ada-cycle-13-ada-ends-desktop.png)

**Verifications:**

- [x] Bora begins the next clockwise turn
- [x] Ada’s ordinary-turn counter advances exactly once

## 226. Bora selects Fabric Warehouse

**Bora, merchant 2** — Bora selects Fabric Warehouse

![Bora selects Fabric Warehouse](./screenshots/040-bora-cycle-13-bora-selects-fabric-warehouse-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 227. Bora moves to Fabric Warehouse

**Bora, merchant 2** — Bora moves to Fabric Warehouse

![Bora moves to Fabric Warehouse](./screenshots/041-bora-cycle-13-bora-moves-fabric-warehouse-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 228. Bora passes clockwise

**Bora, merchant 2** — Bora passes clockwise

![Bora passes clockwise](./screenshots/042-bora-cycle-13-bora-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 229. Cem selects Spice Warehouse

**Cem, merchant 3** — Cem selects Spice Warehouse

![Cem selects Spice Warehouse](./screenshots/040-cem-cycle-13-cem-selects-spice-warehouse-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 230. Cem moves to Spice Warehouse

**Cem, merchant 3** — Cem moves to Spice Warehouse

![Cem moves to Spice Warehouse](./screenshots/041-cem-cycle-13-cem-moves-spice-warehouse-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 231. Cem passes clockwise

**Cem, merchant 3** — Cem passes clockwise

![Cem passes clockwise](./screenshots/042-cem-cycle-13-cem-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 232. Derya selects Fruit Warehouse

**Derya, merchant 4** — Derya selects Fruit Warehouse

![Derya selects Fruit Warehouse](./screenshots/040-derya-cycle-13-derya-selects-fruit-warehouse-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 233. Derya moves to Fruit Warehouse

**Derya, merchant 4** — Derya moves to Fruit Warehouse

![Derya moves to Fruit Warehouse](./screenshots/041-derya-cycle-13-derya-moves-fruit-warehouse-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 234. Derya passes clockwise

**Derya, merchant 4** — Derya passes clockwise

![Derya passes clockwise](./screenshots/042-derya-cycle-13-derya-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 235. Emre selects Caravansary

**Emre, merchant 5** — Emre selects Caravansary

![Emre selects Caravansary](./screenshots/040-emre-cycle-13-emre-selects-caravansary-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 236. Emre moves to Caravansary

**Emre, merchant 5** — Emre moves to Caravansary

![Emre moves to Caravansary](./screenshots/041-emre-cycle-13-emre-moves-caravansary-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 237. Emre passes clockwise

**Emre, merchant 5** — Emre passes clockwise

![Emre passes clockwise](./screenshots/042-emre-cycle-13-emre-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 238. Ada selects Gemstone Dealer

**Ada, merchant 1** — Ada selects Gemstone Dealer

![Ada selects Gemstone Dealer](./screenshots/065-ada-cycle-14-ada-selects-gemstone-dealer-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 239. Ada moves to Gemstone Dealer

**Ada, merchant 1** — Ada moves to Gemstone Dealer

![Ada moves to Gemstone Dealer](./screenshots/066-ada-cycle-14-ada-moves-gemstone-dealer-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 240. Ada buys the 16-Lira ruby

**Ada, merchant 1** — Ada buys the 16-Lira ruby

![Ada buys the 16-Lira ruby](./screenshots/067-ada-cycle-14-ada-buys-ruby-desktop.png)

**Verifications:**

- [x] The escalating Dealer track advances by one
- [x] The exact payment is reported

## 241. Ada completes ordinary turn 14

**Ada, merchant 1** — Ada completes ordinary turn 14

![Ada completes ordinary turn 14](./screenshots/068-ada-cycle-14-ada-ends-desktop.png)

**Verifications:**

- [x] Bora begins the next clockwise turn
- [x] Ada’s ordinary-turn counter advances exactly once

## 242. Bora selects Fountain

**Bora, merchant 2** — Bora selects Fountain

![Bora selects Fountain](./screenshots/043-bora-cycle-14-bora-selects-fountain-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 243. Bora moves to Fountain

**Bora, merchant 2** — Bora moves to Fountain

![Bora moves to Fountain](./screenshots/044-bora-cycle-14-bora-moves-fountain-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 244. Bora passes clockwise

**Bora, merchant 2** — Bora passes clockwise

![Bora passes clockwise](./screenshots/045-bora-cycle-14-bora-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 245. Cem selects Fountain

**Cem, merchant 3** — Cem selects Fountain

![Cem selects Fountain](./screenshots/043-cem-cycle-14-cem-selects-fountain-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 246. Cem moves to Fountain

**Cem, merchant 3** — Cem moves to Fountain

![Cem moves to Fountain](./screenshots/044-cem-cycle-14-cem-moves-fountain-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 247. Cem passes clockwise

**Cem, merchant 3** — Cem passes clockwise

![Cem passes clockwise](./screenshots/045-cem-cycle-14-cem-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 248. Derya selects Fountain

**Derya, merchant 4** — Derya selects Fountain

![Derya selects Fountain](./screenshots/043-derya-cycle-14-derya-selects-fountain-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 249. Derya moves to Fountain

**Derya, merchant 4** — Derya moves to Fountain

![Derya moves to Fountain](./screenshots/044-derya-cycle-14-derya-moves-fountain-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 250. Derya passes clockwise

**Derya, merchant 4** — Derya passes clockwise

![Derya passes clockwise](./screenshots/045-derya-cycle-14-derya-ends-desktop.png)

**Verifications:**

- [x] The next merchant begins movement
- [x] The visible turn banner agrees with replay

## 251. Emre selects Fountain

**Emre, merchant 5** — Emre selects Fountain

![Emre selects Fountain](./screenshots/043-emre-cycle-14-emre-selects-fountain-desktop.png)

**Verifications:**

- [x] The route is selected without appending history
- [x] The required assistant operation is enabled

## 252. Emre moves to Fountain

**Emre, merchant 5** — Emre moves to Fountain

![Emre moves to Fountain](./screenshots/044-emre-cycle-14-emre-moves-fountain-desktop.png)

**Verifications:**

- [x] One movement event reaches the action phase
- [x] The inspector names the arrived Place

## 253. Emre passes clockwise

**Emre, merchant 5** — Emre passes clockwise

![Emre passes clockwise](./screenshots/045-emre-cycle-14-emre-ends-desktop.png)

**Verifications:**

- [x] The equal-turn round opens the final Bonus window
- [x] The visible turn banner agrees with replay

## 254. The equal-turn round closes into final Bonus windows

**Ada, merchant 1** — The equal-turn round closes into final Bonus windows

![The equal-turn round closes into final Bonus windows](./screenshots/069-ada-table-enters-final-window-desktop.png)

**Verifications:**

- [x] Every merchant completed fourteen ordinary turns
- [x] Only direct-resource cards remain legal

## 255. Ada finishes the final Bonus window

**Ada, merchant 1** — Ada finishes the final Bonus window

![Ada finishes the final Bonus window](./screenshots/070-ada-final-ada-finishes-desktop.png)

**Verifications:**

- [x] Bora receives the next final window
- [x] One final-window event is accepted without diagnostics

## 256. Bora finishes the final Bonus window

**Bora, merchant 2** — Bora finishes the final Bonus window

![Bora finishes the final Bonus window](./screenshots/046-bora-final-bora-finishes-desktop.png)

**Verifications:**

- [x] Cem receives the next final window
- [x] One final-window event is accepted without diagnostics

## 257. Cem finishes the final Bonus window

**Cem, merchant 3** — Cem finishes the final Bonus window

![Cem finishes the final Bonus window](./screenshots/046-cem-final-cem-finishes-desktop.png)

**Verifications:**

- [x] Derya receives the next final window
- [x] One final-window event is accepted without diagnostics

## 258. Derya inspects a direct-resource card in the final window

**Derya, merchant 4** — Derya inspects a direct-resource card in the final window

![Derya inspects a direct-resource card in the final window](./screenshots/046-derya-final-derya-inspects-direct-lira-desktop.png)

**Verifications:**

- [x] The card promises exactly 5 Lira
- [x] Private inspection changes no canonical history

## 259. Derya plays the legal final direct-resource Bonus

**Derya, merchant 4** — Derya plays the legal final direct-resource Bonus

![Derya plays the legal final direct-resource Bonus](./screenshots/047-derya-final-derya-plays-direct-lira-desktop.png)

**Verifications:**

- [x] Derya gains exactly 5 Lira before ranking
- [x] The spent private card leaves Derya’s hand

## 260. Derya finishes the final Bonus window

**Derya, merchant 4** — Derya finishes the final Bonus window

![Derya finishes the final Bonus window](./screenshots/048-derya-final-derya-finishes-desktop.png)

**Verifications:**

- [x] Emre receives the next final window
- [x] One final-window event is accepted without diagnostics

## 261. Emre finishes the final Bonus window

**Emre, merchant 5** — Emre finishes the final Bonus window

![Emre finishes the final Bonus window](./screenshots/046-emre-final-emre-finishes-desktop.png)

**Verifications:**

- [x] The final ranking is now immutable
- [x] One final-window event is accepted without diagnostics

## 262. Emre reloads the final ranking

**Emre, merchant 5** — Emre reloads the final ranking

![Emre reloads the final ranking](./screenshots/047-emre-guest-reloads-final-ranking-desktop.png)

**Verifications:**

- [x] The winner ceremony returns from immutable history
- [x] Replay restores the exact final event count

## 263. Ada opens a seeded rematch

**Ada, merchant 1** — Ada opens a seeded rematch

![Ada opens a seeded rematch](./screenshots/071-ada-host-opens-rematch-desktop.png)

**Verifications:**

- [x] A fresh bazaar starts at movement
- [x] Epoch two resets every public resource while retaining all seats
