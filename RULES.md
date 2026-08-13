# Istanbul rules summary

This is an implementation-oriented summary of Rüdiger Dorn's 2014 **Istanbul**
base game, not a replacement for the published rulebook. It records turn order,
player-count changes, visibility, deterministic choices, and edge cases needed
by the browser implementation. The Mocha & Baksheesh and Letters & Seals
expansions are not included.

## Goal

Each player controls a merchant, assistants, and a family member in a modular
4×4 bazaar. Merchants collect and sell goods, improve their wheelbarrows, gain
special abilities, and exchange resources for rubies.

The first player to reach the target triggers the end of the game:

| Players | Ruby target |
| ---: | ---: |
| 2 | 6 |
| 3–5 | 5 |

Finish the current round so every player has taken the same number of turns.
The player with the most rubies then wins, subject to the tie-breaks below.

## Base-game components

| Component | Count |
| --- | ---: |
| Place tiles, numbered 1–16 | 16 |
| Wheelbarrows | 5 |
| Wheelbarrow extensions | 15 |
| Bonus cards | 26 |
| Mosque tiles | 16 |
| Demand tiles: 5 light and 5 dark | 10 |
| Mail indicators | 4 |
| Rubies | 32 |
| Six-sided dice | 2 |
| Starting-player marker | 1 |
| Governor | 1 |
| Smuggler | 1 |
| Lira coins: 30×1, 15×5, 12×10 | 57 |
| Player overviews | 5 |

Each of the five player colors has one merchant, five assistants, one family
member, and four goods indicators. Coin denominations have no rules meaning,
so the digital state can store each player's Lira as one public integer.

The implementation must give every finite, stateful component a stable instance
ID. Versioned manifests must preserve the exact 26-card deck, ten Demand tiles,
sixteen Mosque tiles, ruby tracks, Post Office track, and printed layout data.
Fungible Lira and goods may be aggregate counters, but replay must conserve
every card, tile, assistant, extension, and ruby.

## Wheelbarrows and public resources

Each wheelbarrow tracks four goods:

- fabric (red);
- spice (green);
- fruit (yellow); and
- jewelry (blue).

A player begins with capacity for two of each good. Each wheelbarrow extension
raises all four capacities by one, to a maximum of five after three extensions.
A gain cannot move a good beyond current capacity; any excess is lost. Goods
are information, not individual physical tokens, so a numeric counter per type
is sufficient in the state model.

Lira, goods, wheelbarrow capacity, rubies, owned Mosque tiles, merchant and
assistant positions, and family-member position are public. Bonus cards in a
player's hand and the Bonus deck order are private.

## Bazaar layouts

The board is a 4×4 grid of the sixteen Place tiles. Orthogonal adjacency is
determined by grid position, not by Place number.

The recommended first-game **Short paths** layout is:

```text
15  5  2 14
 4 12  7  3
 8  6 11  9
13 10  1 16
```

The published **Long paths** layout is:

```text
16  2  8 11
15  7  6  4
 3  5 12  1
10  9 14 13
```

The numbered layout places 1–16 in order. A random layout shuffles all sixteen
places, with these publisher recommendations enforced by the trustworthy
client:

- Fountain 7 is one of the four central grid spaces; and
- Black Market 8 and Tea House 9 have an orthogonal path distance of at least
  three.

The selected layout and manifest version are committed at game start. A random
layout is derived from the setup seed rather than persisted as unverified
materialized state.

## Setup

1. Build the selected 4×4 layout.
2. Randomly choose the starting player. Give that player 2 Lira and the
   starting-player marker. Moving clockwise, give each next player one more
   Lira than the previous player. Thus starting funds are 2–6 Lira depending on
   seat and player count.
3. Shuffle the Bonus deck and deal one private Bonus card to every player.
4. At each Mosque, sort each color of Mosque tile by required goods, with the
   cheapest tile on top. Put one ruby per player on each Mosque, except that a
   five-player game uses four rubies per Mosque. Remove tiles showing five
   goods in a three-player game; remove tiles showing three and five goods in a
   two-player game.
5. Put three wheelbarrow extensions and one ruby per player at Wainwright 1.
6. Populate the Sultan's Palace 13 and Gemstone Dealer 16 ruby tracks from the
   printed starting space for the player count. At Sultan's Palace, the first
   ruby costs five goods in a two- or three-player game and four goods in a
   four- or five-player game. Empty spaces expose the current increasing cost.
7. Put all four Mail indicators in the upper Post Office row.
8. Shuffle the five dark Demand tiles into a face-up stack at Large Market 10
   and the five light tiles into a face-up stack at Small Market 11. The top
   tile is the current demand.
9. Roll two dice separately for the Governor and Smuggler. Put each on the
   Place whose large number equals the roll total.
10. Each player starts with four assistants stacked beneath their merchant at
    Fountain 7. Their fifth assistant begins in the general supply. Their family
    member begins at Police Station 12. All goods begin at zero and capacity
    begins at two.
11. In a two-player game only, put one unused-color neutral merchant at Small
    Mosque 14, Great Mosque 15, and Gemstone Dealer 16.

The setup seed deterministically controls starting-player selection, layout
shuffle when used, both encounter-token rolls, both Demand stacks, and the
Bonus deck. Dice consumed later use the same versioned random stream in an
explicit, replayable order.

## Turn structure

Beginning with the starting player, turns proceed clockwise. A normal turn has
four ordered phases. An instruction that says the turn ends immediately skips
all remaining phases.

### 1. Movement and assistant service

Move the merchant and every assistant currently beneath it one or two
orthogonally adjacent spaces. Do not move diagonally and do not end where the
merchant began. A two-space move may turn a corner.

At the destination, resolve exactly one assistant case:

- If one of that player's assistants is already there, place the moving stack
  on it and pick it up.
- Otherwise, remove the bottom assistant from the moving stack and leave it at
  the destination.
- If neither is possible—or the player declines—the turn ends immediately.

Fountain 7 is the exception: its action does not require leaving or collecting
an assistant. A “stay here” Bonus card replaces movement with a zero-distance
move. At the current Place, pick up the player's assistant if one is already
there; otherwise leave the bottom assistant from the merchant stack. The card
cannot be used at Fountain or when neither assistant operation is possible.

The yellow Mosque ability may be used once per turn: pay 2 Lira to return one
of the player's assistants from any other Place to the merchant stack.

### 2. Other merchants

If another player's merchant is at the destination, pay that player 2 Lira.
Pay every merchant there. If the active player cannot or declines to make all
required payments, the turn ends immediately.

At Fountain 7, no merchant payments are required.

In a two-player game, each neutral merchant counts as another merchant. Pay its
2 Lira to the general supply, then roll two dice and move that neutral merchant
to the Place matching the result. A neutral merchant can be encountered and
moved again later in the same game.

### 3. Place action

The active player may carry out the destination's action. Declining or being
unable to perform it does not prevent phase 4.

### 4. Other encounters

Resolve the following available encounters in any order:

- **Other family members:** catching them is mandatory. Return every other
  player's family member at the destination to Police Station 12. For each one,
  choose either 3 Lira or one Bonus card. There is no reward for a family member
  already at the Police Station.
- **Governor:** optionally draw one Bonus card, then either pay 2 Lira or
  discard one Bonus card from hand. The newly drawn card may be the discarded
  card.
- **Smuggler:** optionally gain one good of any type, then either pay 2 Lira or
  pay one good. The newly gained good may be the paid good.

After using the Governor or Smuggler, roll two dice and move that token to the
Place matching the result. Roll separately for each used token. Merely sharing
a Place does not move an unused encounter token.

## The sixteen Places

### 1 — Wainwright

Pay 7 Lira for one wheelbarrow extension. On taking a player's third extension,
that player immediately and only once takes a ruby from this Place.

### 2–4 — Fabric, Spice, and Fruit Warehouses

Set the corresponding good to the player's current capacity. With the green
Mosque ability, the player may then pay 2 Lira for one additional good of any
type, still limited by capacity.

### 5 — Post Office

Gain every resource shown in the four currently uncovered spaces. Then move
the leftmost Mail indicator still in the upper row to the lower row. If all
four are already in the lower row, return all four to the upper row instead.

The Post Office reward track is a versioned manifest copied from the tile; the
state stores only the four indicator positions and derives the visible reward.
A Bonus card that repeats the action resolves the reward and indicator movement
twice, in order.

### 6 — Caravansary

Take two Bonus cards, then discard one card from hand. For this action only,
each taken card may come from either the face-down draw pile or the top of the
face-up discard pile. Choose both sources while draw-pile cards remain face
down; reveal the complete selection together, then choose the card to discard.
The final hand therefore grows by one card.

### 7 — Fountain

Return any number of the player's assistants from anywhere on the board to the
merchant stack. The action needs no assistant, and other merchants here charge
nothing. If the family member performs the Fountain action, the assistants
still return to the merchant.

### 8 — Black Market

Gain one fabric, spice, or fruit good. Also roll two dice for jewelry:

| Roll | Jewelry gained |
| ---: | ---: |
| 2–6 | 0 |
| 7–8 | 1 |
| 9–10 | 2 |
| 11–12 | 3 |

The player may choose the non-jewelry good before or after rolling. With the red
Mosque ability, after seeing the roll the player may either turn one die to 4
or reroll both dice once.

### 9 — Tea House

Announce an integer from 3 through 12, then roll two dice. If the total is at
least the announced number, gain that many Lira; otherwise gain 2 Lira. The red
Mosque ability offers the same post-roll choice to turn one die to 4 or reroll
both once.

### 10–11 — Large and Small Markets

Sell from one through five goods matching icons on the current Demand tile. A
depicted good icon can be used at most once, so the player chooses a subset of
the tile's five positions and pays those goods. Revenue depends on the Market
and the number sold:

| Goods sold | Small Market | Large Market |
| ---: | ---: | ---: |
| 1 | 2 Lira | 3 Lira |
| 2 | 5 Lira | 7 Lira |
| 3 | 9 Lira | 12 Lira |
| 4 | 14 Lira | 18 Lira |
| 5 | 20 Lira | 25 Lira |

After the sale, move the current Demand tile to the bottom of its stack. The
Small Market Bonus card still requires the chosen sale size, but lets each sold
good be any type instead of matching the corresponding demand icon.

### 12 — Police Station

If the active player's family member is at the Police Station, move it to any
other Place and carry out that Place's action. The family member has no
encounters: it does not pay merchants, catch family members, or use the
Governor or Smuggler. It remains at the destination until caught or moved by a
Bonus card.

If the family member is not at the Police Station, this Place has no action for
that player.

### 13 — Sultan's Palace

Pay every good shown on the currently uncovered cost spaces, then take the next
ruby from the track. Removing that ruby exposes a larger cost for the next
purchase. A wild-good symbol may be paid with any good. If the exact current
cost cannot be paid, the action is unavailable.

The player-count start positions and ordered costs are immutable Place-manifest
data. The starting cost contains five goods with two or three players and four
goods with four or five players. A repeat-action Bonus card pays the newly
increased cost for the second ruby.

### 14–15 — Small and Great Mosques

To take the top tile of a stack, the wheelbarrow must contain at least the goods
shown; then pay one of the depicted good. A player may own no more than one tile
of each ability.

When a player owns both different ability tiles from the same Mosque, they
immediately and only once take one ruby from that Mosque.

The four abilities are:

- **red:** at Black Market or Tea House, after a roll, turn one die to 4 or
  reroll both dice once;
- **blue:** immediately add the fifth assistant from the supply beneath the
  merchant;
- **green:** after a Warehouse action, pay 2 Lira for one additional good of
  any type;
- **yellow:** once per turn, pay 2 Lira to return one assistant from elsewhere
  to the merchant stack.

### 16 — Gemstone Dealer

Pay the currently exposed Lira price, then take the next ruby from the track.
Removing it exposes a higher price. The player-count start positions and price
sequence are immutable Place-manifest data. A repeat-action Bonus card pays the
newly increased price for the second ruby.

## Bonus cards

Bonus cards are private while held. A player may play any number during their
turn, subject to each card's timing. Played and voluntarily discarded cards go
face up on the Caravansary discard pile. When the draw pile is empty, shuffle
the discard pile into a new deterministic draw pile.

The base deck contains these ten effects, with multiplicities preserved in the
versioned 26-card manifest:

1. gain one good of choice, only immediately before or after a Place action;
2. gain 5 Lira;
3. after a Sultan's Palace action, perform it once more at the new cost;
4. after a Post Office action, perform it once more and advance indicators
   again;
5. after a Gemstone Dealer action, perform it once more at the new price;
6. return the player's family member to the Police Station and take the usual
   catch reward; unavailable if already there;
7. during movement, stay at the current Place and perform the normal assistant
   operation there—pick one up if present, otherwise leave one;
8. during movement, move three or four Places instead of one or two;
9. during movement, return one assistant to the merchant stack; and
10. at the Small Market, sell the required number using any mixture of goods
    rather than the pictured types.

“Perform twice” means complete the first action—including its changing cost or
track—before testing and paying for the second. A card cannot make an otherwise
unpayable second action free.

## End of the game

As soon as a player reaches the ruby target, mark the end as triggered but
finish the current round through the seat immediately before the starting
player. A later player can equal or exceed the triggering player's ruby count.

After the final turn, every player may play remaining Bonus cards that directly
provide goods or Lira. They do not take additional turns or Place actions.

Rank players by:

1. most rubies;
2. most remaining Lira;
3. most total goods in the wheelbarrow; then
4. most remaining Bonus cards.

If all comparisons are tied, the tied players share the win. Do not invent a
further deterministic tie-break.

## Optional rules outside the MVP

The published base rulebook also offers a neutral-assistant variant for two to
four experienced players. It is not part of the MVP. Neither expansion is part
of this rules target. A later implementation must commit its ruleset and
component-manifest versions at setup so base-only clients never silently replay
expansion events.

## Digital visibility and invariants

| Information | Owner | Other players / shared display |
| --- | --- | --- |
| Bonus cards in hand | Exact cards | Count only |
| Bonus draw pile | Count only | Count only |
| Top discard | Exact card | Exact card |
| Goods, capacity, Lira, rubies | Full | Full |
| Mosque tiles | Full | Full |
| Merchant, assistants, family member | Full | Full |
| Governor, Smuggler, Demand tile, Post Office | Full | Full |
| Dice and declared choices | Full | Full |

The trusted client must enforce these invariants after every accepted event:

- each player has exactly one merchant and family member;
- every assistant is in the supply, beneath its merchant, or at exactly one
  Place;
- goods remain between zero and current wheelbarrow capacity;
- each Bonus card, Demand tile, Mosque tile, extension, and ruby occupies one
  legal zone;
- all dice and shuffles consume the versioned random stream in a defined order;
- the turn seat advances clockwise exactly once per completed turn;
- once end-game is triggered, only the remaining seats in that round act; and
- invalid, stale, duplicate, or incompatible events produce diagnostics without
  partially mutating projected state.

This visibility policy is a presentation boundary, not a security boundary.
The trusted-client Firestore stream is readable by every authenticated player,
so a determined player could inspect private payloads or derive seeded future
randomness.

## Sources

- AEG/Pegasus Spiele, [2014 English Istanbul
  rulebook](https://www.alderac.com/wp-content/uploads/2014/03/Istanbul_rulebook.pdf).
- Pegasus Spiele, [Istanbul Big Box product
  page](https://pegasus.de/en/Istanbul-Big-Box/55119G) and [current English
  rulebook](https://cdn.pegasus.de/public/media/c5/22/4d/1717757333/4250231715532_gb.pdf),
  whose base-game sections clarify current wording.

The rulebook PDFs were downloaded for review but are not redistributed in this
repository.
