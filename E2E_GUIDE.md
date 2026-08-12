# End-to-end test guide

Every Istanbul feature is delivered as a browser-visible tracer bullet. An E2E
scenario is executable product documentation: it drives the real client against
Firebase emulators, makes semantic assertions, captures deterministic
screenshots, and generates a checked-in walkthrough.

This guide is part of the implementation contract. A gameplay change without a
matching browser scenario is incomplete.

## Mandatory Nix entry point

Nix is the supported development environment. Run dependency, development,
Firebase, Playwright, test, build, formatting, and Git tooling through the
locked shell:

```sh
nix develop --command bun install --frozen-lockfile
nix develop --command bun run test:e2e
```

Do not depend on host-installed Bun, Node.js, Firebase CLI, Chromium,
Playwright, TypeScript, or Git tooling.

## What an E2E scenario proves

A scenario begins with a user action in the actual application and finishes
with a visible result. Depending on its scope, it crosses:

```text
browser interaction
  -> Svelte component
  -> event creation
  -> Firestore emulator
  -> event subscription and deterministic reducer
  -> player or shared-table selector
  -> rendered result
```

Do not bypass this path with direct reducer calls, page-injected state,
handwritten Firestore result events, mocked repositories, test-only UI controls,
or a URL that installs projected game state. Helpers may remove repetitive
browser actions, but they must use the same controls and public application
behavior as a player.

Pure unit and model tests remain necessary for combinatorial rules. They do not
replace the tracer proving that a real player can reach and understand the
behavior.

## Scenario map

The initial suite follows the MVP's vertical slices:

1. `001-app-shell-and-firebase` proves the static shell, anonymous emulator
   sign-in, connection status, and build marker.
2. `002-create-join-configure-room` proves the room code, invite URL, ordered
   seats, layout selection, readiness, and reload.
3. `003-seeded-setup-and-private-cards` proves exact setup, public board
   convergence, private Bonus cards, and component conservation.
4. `004-movement-assistants-and-merchant-payments` proves reachability,
   assistant pick-up/drop, player payments, the Fountain exception, and a
   two-player neutral merchant.
5. `005-wainwright-warehouses-and-fountain` proves capacity upgrades, warehouse
   limits, returned assistants, and the Wainwright ruby.
6. `006-post-office-caravansary-and-markets` proves the reward track, private
   draws, discard visibility, demand matching, sale, and tile rotation.
7. `007-black-market-tea-house-and-dice` proves seeded dice, declared choices,
   jewelry rewards, wagers, and red Mosque modification.
8. `008-police-family-governor-and-smuggler` proves the family action, mandatory
   catches, rewards, optional encounters, and token relocation.
9. `009-mosque-tiles-and-special-abilities` proves tile costs, unique ownership,
   all four abilities, the fifth assistant, and the paired-tile ruby.
10. `010-sultan-gemstone-and-bonus-cards` proves escalating ruby costs, legal
    timing, private hands, discard, reshuffle, and repeated actions.
11. `011-complete-multiplayer-game` proves a production-size final round,
    ranking, shared winners where applicable, and rematch.
12. `012-reconnect-replay-and-conflicts` proves the cache prefix, cursor
    catch-up, scratch replay, stale events, concurrency, and version errors.
13. `013-shared-table-and-private-phones` proves QR seats, public tabletop,
    private phone hands, action ownership, and recovery.
14. `014-responsive-accessible-complete-game` proves a complete game at the
    full viewport matrix with keyboard, touch, announcements, and reduced
    motion.

Scenario numbers are stable once merged. Add the next number for a new coherent
story; do not renumber existing scenarios to make room.

At least one scenario must use five isolated player contexts. At least one must
prove the special two-player setup and neutral-merchant behavior. At least one
must complete a production-size game entirely through ordinary controls.

## Scenario layout

Use a three-digit sequence and short kebab-case capability name:

```text
tests/e2e/
  001-app-shell-and-firebase/
    001-app-shell-and-firebase.spec.ts
    README.md
    screenshots/
      000-firebase-ready-desktop.png
      000-firebase-ready-phone.png
  helpers/
    test-step-helper.ts
```

Each directory owns one coherent story. Do not combine unrelated features to
avoid adding scenarios, and do not split one feature into backend-only and
UI-only tests.

The scenario `README.md` is generated from metadata, step descriptions,
verification labels, and screenshots in the spec. Commit the generated guide
and every reviewed baseline with the implementation. Never hand-edit generated
walkthroughs.

## Required spec structure

Every spec must:

1. use Playwright's `test` and `expect`;
2. construct `TestStepHelper` for each documented player or tabletop view;
3. set a human-readable title and purpose;
4. interact through accessible roles, labels, and stable test IDs;
5. verify semantic behavior before taking each screenshot;
6. wait for a settled application status rather than a guessed delay;
7. close every additional browser context it creates;
8. cover every required viewport for responsive scenarios; and
9. generate the scenario walkthrough.

The first scenario should follow this shape:

```ts
import { expect, test } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';

test('application shell reaches Firebase and renders deterministically', async ({
  page
}, testInfo) => {
  const steps = new TestStepHelper(page, testInfo);
  steps.setMetadata(
    'Application shell and Firebase readiness',
    'The static client loads and signs in against the local Firebase emulators.'
  );

  await page.goto('/');
  await steps.step('firebase-ready', {
    description: 'The bazaar is ready for merchants',
    verifications: [
      {
        spec: 'The page exposes the stable product title',
        check: async () =>
          expect(page).toHaveTitle('Istanbul — Race through the bazaar')
      },
      {
        spec: 'The client reports a synchronized emulator connection',
        check: async () =>
          expect(page.getByRole('status')).toContainText('Synced')
      }
    ]
  });

  steps.generateDocs();
});
```

The example defines the convention; the checked-in spec becomes authoritative
once the application shell exists.

## Semantic assertions before pixels

Screenshots are review evidence, not the only assertion. Before each capture,
assert the state that gives the image meaning:

- page title, primary heading, connection status, and build marker;
- enabled and disabled controls;
- active player, turn phase, and pending decision owner;
- merchant destination and assistant pick-up or drop consequence;
- public goods, capacity, Lira, rubies, Mosque tiles, Place occupants, demand,
  Post Office state, and discard;
- exact local Bonus cards and their absence from opponent or shared-table views;
- seeded dice values and choices that modify them;
- event-driven convergence in at least one observer view; and
- absence of document overflow, clipped controls, and accidental overlap.

Prefer `getByRole`, `getByLabel`, and exact accessible names. Use `data-testid`
only for stable non-user-facing state such as a build marker or event count. Do
not assert CSS implementation details when a user-observable assertion is
available.

An image cannot prove hidden information by itself. Explicitly assert that an
opponent's card identity, card text, accessible name, and any revealing data
attribute are absent from the observer DOM.

## Rules coverage boundary

Browser scenarios prove representative, player-reachable paths. Pure Vitest
fixtures exhaustively prove the combinatorial matrix, including:

- exact manifests and stable component IDs;
- all player-count setup changes and valid layouts;
- every movement, capacity, payment, and assistant-conservation edge case;
- every Place action, Demand tile, Mosque tile, and Bonus-card instance;
- every dice total and red Mosque modification;
- every final-round boundary and tie-break level;
- selector masking and component conservation; and
- malformed, duplicate, stale, conflicting, and incompatible events.

Do not grow an E2E scenario into hundreds of repetitive UI permutations where a
pure table-driven test is clearer. Conversely, do not move the only proof of an
important player journey down into the reducer.

## Deterministic screenshots

Playwright runs pinned Chromium with:

- fixed phone portrait, phone landscape, tablet, desktop, and wide tabletop
  viewports where required;
- device scale factor 1;
- `en-CA` locale and `America/Toronto` timezone;
- service workers blocked;
- animations disabled for screenshot comparison;
- hidden carets;
- deterministic build metadata;
- stable repository-managed fonts; and
- zero allowed differing pixels.

Before capture, the helper moves the pointer away, waits for explicit settled
state, rejects viewport overflow, and checks interactive controls for accidental
overlap.

Never update a baseline merely because CI differs. Determine whether the cause
is an intentional UI change, platform rasterization, an unsettled state, or a
regression. Review every changed image.

Regenerate local baselines intentionally with:

```sh
nix develop --command bun run test:e2e:update-snapshots
```

Linux and local baselines use separate filenames because Chromium text
rasterization can differ by platform even with bundled fonts. Generate Linux
baselines through an explicit CI workflow and upload them as an artifact. Commit
them only after visual inspection; CI must never rewrite baselines silently.

## Viewport and accessibility matrix

Ordinary scenarios run in phone portrait and desktop Chromium projects unless a
scenario has a narrower, documented reason. Scenario 014 repeats the complete
game at all supported presentation sizes:

- `phone`, 393×852: touch-sized controls, private hand, safe areas, and no
  horizontal overflow.
- `mobile-landscape`, 852×393: compact board navigation and reachable decisions
  without overlap.
- `tablet`, 820×1180: full public board plus private controls.
- `desktop`, 1280×1000: board, player summaries, log, and decisions without
  document scrolling.
- `tabletop-wide`, 3840×2160: shared public state, QR seating, readable opposite
  edges, and no private cards.

Every gameplay control must be a native keyboard-operable element or implement
the appropriate composite-widget keyboard pattern. Scenarios verify visible
focus, focus transfer after modal decisions, pressed/selected states, textual
alternatives to color and iconography, polite turn announcements, and reduced
motion for every new animation family.

Screenshot checks do not replace accessible-name or keyboard assertions.

## Firebase emulator contract

E2E always uses isolated local Auth and Firestore emulators with a dedicated
test project ID. Production Firebase must never be contacted by a test.

The application exposes a visible connection status:

- `connecting` while initialization is incomplete;
- `synced` after anonymous Auth and Firestore readiness;
- `offline` when a recoverable connection is unavailable; and
- `error` for a terminal setup failure.

Helpers wait on this explicit status. A timeout is only a failure bound, never a
synchronization mechanism.

Clear emulator data between scenarios that require isolation. Otherwise use
unique room codes, game IDs, seeds, and deterministic identities so independent
scenarios can coexist. Emulator-only identity and room-code parameters may
stabilize visible values, but must be disabled in production and must not bypass
anonymous Auth, room controls, Firestore writes, subscriptions, or replay.

Firestore Security Rules run as a separate Node Vitest suite. E2E proves the
ordinary allowed path; Rules tests exhaustively prove authentication,
attribution, immutable creates, envelope constraints, cross-room denial,
update/delete denial, and default denial of unrelated paths.

## Multiplayer scenarios

Use one isolated browser context per player. Never share local storage, session
storage, IndexedDB, cookies, or Auth state between players.

A multiplayer step is incomplete until it verifies:

- the actor can perform the action through ordinary controls;
- at least one observer receives the resulting projection;
- every checked client agrees on public state and event count;
- private Bonus-card information appears only in its owner's ordinary view;
- reload reconstructs the same state when relevant; and
- accepted concurrent events converge while stale events remain diagnosed.

Keep actor, observer, and tabletop helpers explicit. A helper that opens a room
may click through repeated setup controls; it may not write setup events or
state directly.

The trusted-client architecture means a modified client could inspect readable
private event data. E2E verifies trustworthy UI masking, not cryptographic
secrecy.

## Shared-table scenarios

Shared-table tests use one public tabletop page plus one isolated phone context
per occupied seat. They verify:

- every open tabletop position exposes a real QR for the same open-room invite;
- a scanned invitation claims the next clockwise position only when its player
  submits a name, without reserving attendance in advance;
- joining replaces one QR, and starting replaces every remaining invitation
  with the public game surface;
- the table displays public state and no Bonus-card identities;
- phones display only their owner's private cards and choices;
- an action initiated on a phone is attributed to that seat and converges on
  every screen;
- controls and labels remain understandable from the configured table edge;
- reloading the table does not claim a player identity; and
- reconnecting a phone restores its seat and private selector without exposing
  another hand.

Do not mock QR contents or private controllers. Tests may read the QR target
from the accessible companion link rather than decode pixels.

## Time and randomness

Never use `waitForTimeout` or another arbitrary sleep. Wait for a semantic
condition, explicit application status, expected event projection, or controlled
animation completion.

All randomness uses a committed seed and versioned PRNG. Tests use fixed setup
seeds and assert the visible consequences of deterministic dice, card, Demand,
layout, Governor, and Smuggler sequences. A failure must be reproducible from
the same event stream and seed.

Do not persist client-selected dice results merely to make a test convenient.
The reducer consumes the canonical random stream in the same order in tests and
production.

Do not retry a flaky scenario into passing. Remove nondeterminism at its source.

## Animation and reduced motion

Animation is presentation derived from canonical state. Tests may pause or
finish a finite animation before documentation capture, but may not skip the
state transition that caused it.

At least one scenario inspects each meaningful animation while it is active so
movement direction, resource transfer, or card reveal remains understandable.
Scenario 014 verifies the corresponding reduced-motion presentation.

Reloading during animation must immediately render the same resolved canonical
projection. Animation duration must never decide legality, event order, dice,
or turn progression.

## Reconnect, replay, and conflict testing

Reconnect scenarios exercise the browser transport itself, not a mocked store.
Before disconnecting, wait for the visible event count to confirm the server
prefix. While offline, assert that the confirmed cached projection remains
usable and that actions requiring a write are explained or disabled. After
reconnecting:

1. assert cursor catch-up receives only the missing suffix;
2. compare semantic state and event count with a connected peer;
3. reload once to prove cache hydration; and
4. replay from scratch to prove equivalence with cache plus cursor.

Inject duplicate, stale, conflicting, malformed, and incompatible events only
through the emulator's privileged fixture surface in the dedicated conflict
scenario. The ordinary client must still receive, order, validate, reject, and
diagnose them. Fixture writes may create adversarial input events; they may not
write a desired projection or resolution event.

## Local workflow

Install the exact dependency graph:

```sh
nix develop --command bun install --frozen-lockfile
```

Run one scenario while developing:

```sh
nix develop --command bun run test:e2e -- \
  tests/e2e/001-app-shell-and-firebase
```

Run and review intentional screenshot changes:

```sh
nix develop --command bun run test:e2e:update-snapshots -- \
  tests/e2e/001-app-shell-and-firebase
```

Run the complete commit contract:

```sh
nix develop --command bun run verify:change
```

The verifier includes static checks, unit tests, Firestore Rules tests, the full
E2E suite, the production build, and whitespace validation. Pre-commit and
pre-push hooks invoke the repository-managed verifier once they are installed
by the application-shell slice.

## CI evidence

CI must:

1. check out the exact head SHA;
2. enter the locked Nix environment;
3. install frozen dependencies and pinned Chromium;
4. run static, unit, Firestore Rules, E2E, and production-build checks;
5. retain the Playwright HTML report even on failure;
6. support an explicit Linux screenshot-baseline workflow;
7. publish same-repository PR previews under `/istanbul/pr<PR number>`;
8. publish `main` under `/istanbul`; and
9. preserve existing preview directories.

If measured suite duration becomes excessive, shard whole scenarios across
reusable workflows while retaining deterministic ordering within each scenario.
Never split one scenario's dependent steps across shards.

Forked code must not receive deployment credentials. Never use
`pull_request_target` to build untrusted changes.

## Review checklist

Before committing a scenario:

- [ ] The spec uses only real player-facing paths.
- [ ] Every step has semantic assertions before its screenshot.
- [ ] Actor and observer views are checked where multiplayer is involved.
- [ ] Private Bonus cards are absent from opponent and tabletop DOMs.
- [ ] No arbitrary sleep, implicit wall clock, or unseeded randomness remains.
- [ ] Required viewport layouts fit without clipping or overlap.
- [ ] Keyboard, focus, names, announcements, and reduced motion are covered.
- [ ] Screenshot comparison allows zero differing pixels.
- [ ] Every changed baseline was visually reviewed.
- [ ] The generated scenario `README.md` matches the spec.
- [ ] Firestore emulator data is isolated from other scenarios.
- [ ] Additional browser contexts are closed.
- [ ] The complete verifier passes through Nix.
