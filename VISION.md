# Vision

## North star

Make Istanbul feel as immediate online as it does around a table: join from a
link, understand the bazaar at a glance, trace a route with confidence, and
finish a complete game without bookkeeping or synchronization getting between
the players and the race for rubies.

The product should preserve the game's central puzzle. Every assistant left
behind is both access to a place and a future routing obligation. Automation
should remove counting and rules ambiguity without solving that puzzle for the
player.

## Experience principles

### The bazaar is a map, not a dashboard

The 4×4 layout, movement reach, merchants, assistants, family members, and
encounter tokens are the primary interface. Players should reason spatially and
see why an action is reachable. Supporting panels for goods, Lira, Mosque
tiles, and rubies remain compact and never obscure the route.

### Legal choices explain themselves

Selecting a merchant shows reachable places and the assistant consequence at
each destination. Costs, capacity, player payments, and likely turn-ending
conditions are visible before confirmation. Disabled actions state the rule
that blocks them. The UI assists understanding but never recommends an
“optimal” move.

### One game, two table shapes

- In ordinary network play, each player uses a phone, tablet, or desktop and
  sees the complete public bazaar plus their private Bonus-card hand.
- In shared-table play, a large browser displays the public bazaar while phones
  provide private hands and focused controls. QR codes make taking a seat fast.

These modes project the same game state and append the same events. Shared-table
mode is not a separate rules implementation.

### Physical information boundaries remain legible

The board state, goods, Lira, rubies, Mosque tiles, and played cards are public.
Bonus-card hands and draw order remain hidden in the trustworthy presentation.
The interface must make ownership clear without relying on color alone.

### Replay is part of the product

Given the same edition manifest, setup seed, and accepted events, every client
must derive the same bazaar and winner. That promise enables reconnect, conflict
diagnostics, spectating, walkthroughs, and future replay controls without a
second state model.

### Fast to join, calm to play

A host creates a room, shares a five-letter code or QR link, chooses a reviewed
layout, and starts when two to five named players are ready. During play,
animation clarifies movement and exchange of resources but never delays rules
resolution or blocks reduced-motion users.

## Intended audience

The first audience is a group that already wants to play together, either
remotely or around one shared display. No account or installation is required.
The continuously tested presentation matrix covers pinned Chromium at phone
portrait, phone landscape, tablet, desktop, and wide shared-display sizes; the
application itself should remain standards-based and portable.

## Product values

- **Faithfulness:** base-game outcomes follow the published 2014 rules.
- **Determinism:** randomness is seeded, versioned, and replayable.
- **Clarity:** public state and action consequences are understandable without
  studying an event log.
- **Accessibility:** every action is operable by keyboard, pointer, or touch and
  announced meaningfully to assistive technology.
- **Recoverability:** reloads and ordinary network interruptions do not require
  manual reconstruction.
- **Reviewability:** each feature is delivered as a small vertical slice with a
  real browser journey and visual evidence.
- **Respect for the source:** rules are implemented, while publisher artwork and
  trade dress are not copied into the product.

## Measures of success

- A new player can join a room from a code or QR link in under 30 seconds.
- A first-time player can identify reachable destinations and the assistant
  consequence without external coaching.
- Two to five players can complete a game with every client converging on the
  same event count, public state, and result.
- Reloading any client reconstructs the same state from immutable history.
- No private Bonus card appears in an opponent or shared-table view.
- All core flows fit without page scrolling or overlapping controls at the
  tested phone, tablet, desktop, and shared-display sizes.
- Every base-game place, Bonus-card effect, Mosque ability, player-count setup,
  end condition, and tie-break has deterministic unit coverage.

## Not the goal

The MVP is not a general board-game engine, a native mobile application, an
official licensed edition, or a competitive platform. It does not initially
include expansions, AI opponents, ranked matchmaking, chat, moderation, or a
server-authoritative anti-cheat system. Those concerns must not distort the
small-room, faithful-base-game experience.
