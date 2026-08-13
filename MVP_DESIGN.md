# MVP design

> Implementation status: complete. Scenarios 001–014 exercise every slice
> below, culminating in shared-table and accessible responsive play.

## Outcome

Deliver a faithful, complete, realtime implementation of the 2014 Istanbul base
game for two to five players. A host creates a private room, players join from
a short code or QR link, select a reviewed bazaar layout, play through ordinary
browser controls, and finish with the official round completion and tie-breaks.
Every client can reload and reconstruct the same game from immutable history.

The MVP includes ordinary phone/tablet/desktop play and a dedicated `/tabletop/`
route. The tabletop creates and owns an empty room, displays QR invitations,
owns layout, start, and all public gameplay, and never consumes a merchant seat.
Scanned phones hold player identities, readiness, private Bonus cards, and only
the card-dependent Caravansary or Governor choices that cannot be public. It
excludes both expansions and the optional neutral-assistant variant.

## Fixed technical decisions

- SvelteKit with Svelte 5, strict TypeScript, Bun, Vite, and
  `@sveltejs/adapter-static`.
- Static output hosted on GitHub Pages at `/istanbul`, with retained `/prN`
  previews.
- Firebase anonymous Authentication and Cloud Firestore browser SDK.
- One canonical append-only stream at
  `games/{gameId}/events/{eventId}`; lobby, game, and result are projections.
- Event envelopes contain stable ID, type, payload, actor UID, client sequence,
  server timestamp, schema version, reducer version, rules edition, and
  manifest versions.
- Event IDs use `{actorUid}-{zero-padded-clientSeq}` for idempotent retries.
- Canonical ordering uses server timestamp and event ID as a deterministic
  tie-break.
- A seeded, versioned PRNG derives setup, shuffles, and dice. Events record
  player choices, not client-selected random outcomes.
- Pure reducers validate actor, phase, cost, capacity, component conservation,
  and end-game state. Invalid events are ignored atomically and surfaced as
  deterministic diagnostics.
- Full-state selectors support validation; player and shared-table selectors
  mask private Bonus cards.

## Trust and security boundary

The first implementation uses the same trusted-client model as Jaipur and
RoboRally. Auth and Firestore Rules guarantee authenticated access, own-UID
attribution, append-only creates, and denial of unrelated paths. They cannot
validate an Istanbul move or conceal events from another authenticated room
member.

The reducer consistently rejects illegal histories, but this is not
server-authoritative anti-cheat. All hidden cards and seeded future randomness
may be technically inspectable. A stronger hidden-information boundary would
require trusted server code and is a separate architecture decision.

## State model

The derived game projection should contain:

```text
room
  id, hostUid, status, protocol versions
  ordered seats[2..5], readiness, mode
configuration
  rules edition, layout kind, layout seed, setup seed
  place/card/tile/random manifests
board
  4x4 place IDs
  Governor, Smuggler, neutral merchants
  Post Office indicators, Demand stacks
  Mosque stacks, extension/ruby supplies, ruby tracks
players
  merchant place, carried assistants, placed assistants
  family place, goods, capacity, Lira, rubies
  Mosque tiles, private Bonus hand
cards
  draw order, discard order
turn
  seat, number, phase, pending finite choice
end
  trigger seat, remaining seats, rankings, winners
diagnostics
  rejected event IDs and stable reasons
```

Persist stable identifiers and player intent only. Do not persist a mutable
board snapshot, computed legal moves, totals, rankings, or derived random
results.

## Initial event vocabulary

Keep the first schema small and expand it only with a vertical slice:

| Event | Purpose |
| --- | --- |
| `game/created` | Establish room, host, edition, protocol, and host seat |
| `player/joined` | Claim an open ordered seat and display name |
| `player/ready` | Mark readiness for the current configuration |
| `game/configured` | Select mode and layout; invalidate prior readiness |
| `game/started` | Commit setup seed and start the deterministic projection |
| `turn/moved` | Commit destination and assistant pick-up/drop intent |
| `turn/merchant-paid` | Resolve a finite payment choice when required |
| `place/action-taken` | Commit a place-specific action and its player choices |
| `encounter/resolved` | Commit catch rewards and optional encounter choices |
| `bonus/played` | Identify an owned card and a legal timing/target choice |
| `turn/ended` | Close a turn after every mandatory choice is resolved |
| `game/rematched` | Start a fresh epoch while retaining the room roster |

Do not force every place into a generic untyped payload. Use a discriminated
TypeScript union for action choices, and add explicit events if a later slice
shows that one event cannot express a recoverable finite-choice boundary.

## Delivery contract

Every gameplay change lands as one coherent tracer bullet containing:

1. the smallest player-visible capability;
2. component and rules-manifest data it needs;
3. event schema, validation, pure reducer, and selectors;
4. exhaustive unit fixtures for combinatorial rules and invariants;
5. default-deny Firestore Rules changes and emulator tests when data access
   changes;
6. accessible UI at affected viewports;
7. a Playwright journey through the real UI, Auth emulator, Firestore emulator,
   subscription, reducer, and rendering path;
8. semantic assertions from actor and observer views;
9. exact screenshot baselines and a generated scenario walkthrough; and
10. documentation updates for any changed rule, event, or invariant.

Do not land an unused rules layer, a UI backed only by mock state, or network
logic without a browser proof.

## Unit-test strategy

Vitest runs `src/**/*.test.ts` in `jsdom`, following both sibling projects.
Tests should favor pure data and reducers even though the environment permits
component tests.

Required fixture families include:

- exact component counts and stable unique IDs;
- all player-count setup changes and both published layouts;
- seeded shuffle/dice repeatability and random-consumption order;
- assistant conservation and every movement/pick-up/drop case;
- merchant-payment shortfalls and two-player neutral relocation;
- capacity boundaries, every Place action, and repeated actions;
- every Demand tile, Mosque tile, Bonus card instance, and effect timing;
- Governor, Smuggler, and multiple-family encounter ordering;
- turn closure, end trigger, final-round seats, and all tie-break levels;
- full-state versus masked-player selectors;
- replay equivalence, idempotent duplicates, stale/concurrent events, malformed
  payloads, and version incompatibility.

Firestore Security Rules tests run separately in Node against the emulator with
file parallelism disabled. They prove authenticated room reads, own-UID event
creation, envelope constraints, immutable documents, and default denial of
update, delete, cross-room, and unrelated writes.

## End-to-end strategy

Playwright runs against local Auth and Firestore emulators with isolated browser
contexts for each player. Use pinned Chromium, no retries, stable fonts, locale
`en-CA`, timezone `America/Toronto`, device scale factor 1, blocked service
workers, deterministic build metadata, and animations disabled for screenshots.
The complete scenario structure, determinism, emulator, accessibility, and
review contract is defined in [E2E_GUIDE.md](E2E_GUIDE.md).

Begin with one worker, as Jaipur does. Shard scenarios in CI only when measured
runtime justifies RoboRally's reusable-workflow approach.

Each documented step must make semantic assertions before
`toHaveScreenshot({ maxDiffPixels: 0 })`. Use observable application state and
Playwright auto-waiting; never fixed sleeps. Scenario helpers may repeat public
UI operations but must not inject projected state or bypass the repository.

Initial scenario map:

```text
001-app-shell-and-firebase
002-create-join-configure-room
003-seeded-setup-and-private-cards
004-movement-assistants-and-merchant-payments
005-wainwright-warehouses-and-fountain
006-post-office-caravansary-and-markets
007-black-market-tea-house-and-dice
008-police-family-governor-and-smuggler
009-mosque-tiles-and-special-abilities
010-sultan-gemstone-and-bonus-cards
011-complete-multiplayer-game
012-reconnect-replay-and-conflicts
013-shared-table-and-private-phones
014-responsive-accessible-complete-game
```

At least one E2E scenario must use five browser contexts, one must prove the
two-player neutral-merchant rules, and one must complete a production-size game
through ordinary controls. Combinatorial cases remain unit tests but receive at
least one representative browser path.

## Implementation sequence

### 1. Repository and application shell

- Scaffold static SvelteKit, TypeScript, Bun, local fonts, metadata, manifest,
  and an accessible landing page.
- Add Nix, Firebase emulator configuration, Vitest, Playwright, Husky, the
  verifier, and default-deny Firestore Rules.
- Add CI for check, unit, Rules, E2E, build, artifacts, production Pages, and
  retained PR previews.
- Complete scenario 001 at phone and desktop sizes.

### 2. Rooms and immutable replay

- Add anonymous identity, five-letter room codes, invite URLs, open rooms for
  two-to-five ordered merchants, names, configuration, and readiness. Room
  creators start once every merchant who actually joined is ready; attendance
  is not selected in advance.
- Implement append, subscribe, canonical sort, replay from scratch, envelope
  validation, diagnostics, and a versioned local replay cache.
- Complete scenario 002 with several isolated browser contexts and reload.

### 3. Exact setup and board presentation

- Transcribe and review the place, ruby-track, Post Office, Demand, Mosque, and
  26-card manifests from the target edition.
- Implement layout selection, seeded setup, player-count filtering, starting
  resources, two-player neutral merchants, and private selectors.
- Render an accessible 4×4 board, player summaries, local Bonus hand, supplies,
  reachability text equivalent, pan/zoom/fit, and current turn.
- Complete scenario 003 and conservation fixtures.

### 4. Movement and turn skeleton

- Implement one/two-space movement, pick-up/drop, Fountain exception, payment
  barriers, early turn end, and clockwise advancement.
- Add explicit pending-choice states so reloads cannot strand a turn between UI
  dialogs.
- Complete scenario 004 from actor and observer views, including a two-player
  neutral merchant.

### 5. Deterministic economy places

- Add Wainwright, the three Warehouses, Fountain, Post Office, Caravansary, and
  both Markets.
- Implement exact capacity, reward-track, deck/discard, Demand rotation, sale,
  and Lira rules.
- Complete scenarios 005 and 006; exhaustively unit-test boundaries.

### 6. Dice and encounters

- Add deterministic Black Market and Tea House rolls and choice timing.
- Add Police Station family actions, mandatory catches, Governor, Smuggler,
  independent relocation rolls, and choice ordering.
- Complete scenarios 007 and 008.

### 7. Mosque abilities, Bonus cards, and ruby routes

- Add the sixteen Mosque tiles, acquisition costs, unique ownership, four
  abilities, and paired-tile rubies.
- Add every base Bonus card instance and timing window.
- Add Sultan's Palace and Gemstone Dealer escalating tracks, repeat actions, and
  the Wainwright ruby.
- Complete scenarios 009 and 010.

### 8. Complete game and recovery

- Implement target detection, exact final-round boundary, final direct-resource
  Bonus cards, ranking, shared winners, and rematch epochs.
- Play a complete ordinary multiplayer game in scenario 011.
- Add offline cache hydration, cursor catch-up, idempotent retry, stale and
  concurrent event containment, and incompatible-version UI in scenario 012.

### 9. Shared table, responsiveness, and accessibility

- Add direct table-owned room creation, a join QR at every open tabletop
  position, private phone controllers, and reconnect ownership. Joined
  merchants replace invitations in the lobby; the tabletop alone starts play,
  removes all open positions, presents the public game, and owns every public
  gameplay control. Phones reduce to Bonus-card hands and card-dependent private
  choices once play begins.
- Finish keyboard board navigation, focus transfer, live announcements, touch
  targets, safe areas, contrast, non-color labels, and reduced motion.
- Complete scenarios 013 and 014 across phone portrait, phone landscape,
  tablet, desktop, and a wide tabletop viewport.

## Repository verification

Once slice 1 exists, `bun run verify:change` must enter the locked Nix shell
when needed and run:

```sh
git diff --cached --check
git diff --check
bun run check
bun run test:unit
bun run test:rules
bun run test:e2e
bun run build
```

CI installs the frozen Bun lockfile and pinned Playwright Chromium. Linux
screenshot baselines are generated only by an explicit workflow, uploaded for
review, and committed intentionally; CI never silently rewrites them.

## Definition of MVP complete

- Two to five players can create, join, configure, play, finish, and rematch a
  base game using only public UI controls.
- All sixteen Places, all base Mosque tiles, all 26 Bonus cards, all Demand
  tiles, every player-count rule, and every tie-break are implemented.
- The same seed and accepted event sequence produce byte-equivalent canonical
  projections across fresh replay, cache-plus-cursor recovery, and all clients.
- Private Bonus cards are absent from opponent and shared-display selectors.
- Firestore Rules are default-deny and emulator-tested; canonical events cannot
  be updated or deleted.
- The complete unit, Rules, E2E, build, screenshot, and whitespace verifier
  passes locally and in CI.
- Phone, tablet, desktop, and shared-table experiences pass semantic,
  screenshot, overflow, keyboard, touch, reduced-motion, and announcement
  checks.
- Production deploys at `/istanbul`, PR previews remain available at `/prN`,
  and no publisher art or credentials are committed.
