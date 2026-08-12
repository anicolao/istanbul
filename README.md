# Istanbul

This repository will contain a realtime, browser-based implementation of
**Istanbul**, Rüdiger Dorn's 2014 bazaar game for two to five players. Players
move a merchant and assistants through a modular 4×4 bazaar, build capacity,
trade goods, and race to collect rubies.

The project follows the technical and delivery model established by the sibling
`jaipur` and `roborally` projects: a static SvelteKit client, anonymous Firebase
rooms, an append-only Firestore event stream, deterministic replay, and
browser-level tracer bullets verified with Playwright.

- [RULES.md](RULES.md) is the implementation-oriented base-game rules summary.
- [VISION.md](VISION.md) defines the intended player experience and product
  boundaries.
- [MVP_DESIGN.md](MVP_DESIGN.md) defines the initial architecture, testing
  contract, and vertical-slice sequence.
- [E2E_GUIDE.md](E2E_GUIDE.md) defines the mandatory browser tracer,
  screenshot, emulator, accessibility, and review contract.
- [ART_ASSETS.md](ART_ASSETS.md) inventories the original location, card,
  component, piece, and player-mat artwork and explains its reproducible build.

## Product scope

- Complete base-game play for two to five players.
- Short-path, long-path, numbered, and valid random 4×4 bazaar layouts.
- Merchant-and-assistant movement, player payments, all 16 place actions,
  family members, the Governor, and the Smuggler.
- Wheelbarrows, goods, Lira, demand tiles, Mosque tiles, Bonus cards, dice, and
  every base-game route to a ruby.
- Correct two-player neutral merchants and six-ruby target.
- Reconnect and replay from a complete immutable event history.
- Ordinary network play on phone, tablet, and desktop.
- A shared-table mode with the public bazaar on a large display and private
  Bonus cards on player phones.
- Keyboard, pointer, touch, reduced-motion, and screen-reader-friendly play.

The Mocha & Baksheesh and Letters & Seals expansions, optional neutral-assistant
variant, bots, matchmaking, accounts, rankings, and anti-cheat game authority
are outside the MVP.

## Technical foundation

The planned foundation mirrors Jaipur and RoboRally:

- SvelteKit, Svelte 5, TypeScript, Bun, Vite, and
  `@sveltejs/adapter-static`.
- Firebase anonymous Authentication and Cloud Firestore.
- One append-only event stream at `games/{gameId}/events/{eventId}`.
- Versioned manifests for places, cards, tiles, layouts, and seeded randomness.
- Pure deterministic reducers that reconstruct the full game from events.
- Vitest for rules, manifests, event validation, and reducer tests.
- Firebase Emulator Suite tests for default-deny, attributed, immutable writes.
- Playwright against Auth and Firestore emulators for real multi-browser E2E
  journeys.
- Exact screenshot comparisons and generated scenario walkthroughs.
- Static production and retained pull-request previews on GitHub Pages.

As in the sibling projects, the initial multiplayer model is intentionally a
trusted client. Authentication and Firestore Security Rules provide attribution
and immutable history, not server-side move validation or protection from a
player inspecting hidden Bonus cards or future seeded randomness. The reducer
rejects illegal events consistently, and the ordinary UI reveals only the
information a player could see at the table.

## Development status

The implementation now supports complete base-game play: immutable multiplayer
rooms, deterministic setup and replay, movement and assistant rules, every Place
action, encounters, Mosque abilities, Bonus cards, all ruby routes, final turns,
ranking, rematches, and reconnect recovery. Personal-screen games run from two
to five browsers. Shared-table games add a privacy-safe public board, real
seat-specific QR invitations, private phone controllers, and retained controller
ownership after reload. The MVP is complete: its final slice adds roving keyboard
navigation and focus transfer, live turn announcements, 44 px touch actions,
safe-area insets, reduced-motion behaviour, labelled non-colour cues, and
responsive play at every target viewport in [MVP_DESIGN.md](MVP_DESIGN.md).

Each numbered directory under [`tests/e2e`](tests/e2e) is a generated,
screenshot-by-screenshot play-by-play. Its README names the acting user, shows
the exact UI after every action, and lists the DOM and serialized projection
facts checked before that image was accepted. For example, scenario 013 follows
Ada’s phone, Bora’s phone, and the public display from room creation through a
move and reconnect without omitting an interaction.

The local verification entry point is:

```sh
nix develop --command bun run verify:change
```

That verifier runs static checks, unit tests, Firestore Rules tests,
emulator-backed Playwright scenarios, the production build, and whitespace
checks. Each gameplay slice must include its rules/reducer fixtures, accessible
UI, browser proof, and reviewed screenshots in the same change.

## Rules and artwork

The implementation targets the 2014 Istanbul base game. The rules summary was
checked against the [original English rulebook published by
AEG](https://www.alderac.com/wp-content/uploads/2014/03/Istanbul_rulebook.pdf)
and the base-game sections of Pegasus Spiele's [current English Big Box
rulebook](https://cdn.pegasus.de/public/media/c5/22/4d/1717757333/4250231715532_gb.pdf).
`RULES.md` is a technical summary, not a replacement for the published
rulebook.

Published illustrations, logos, tile layouts, card faces, and trade dress are
reference material only. The browser ships an original 73-asset visual system
for all 16 Places, every Bonus-card effect, five sets of merchants, assistants,
family members and mats, neutral characters, goods, Mosque and demand tiles,
Lira, dice, wheelbarrows, tracks, supplies, and rubies. See
[ART_ASSETS.md](ART_ASSETS.md) for the complete inventory and source-atlas
workflow. Rules text and all state remain semantic HTML so the visuals never
replace accessible game information.

## License

Copyright (C) 2026 Alex Nicolaou. Licensed under the GNU General Public License,
version 3 only. See [LICENSE](LICENSE).

## Firebase

- Project: `istanbul-20260812`
- Web app: `Istanbul Web`
- Authentication: anonymous sign-in
- Database: Cloud Firestore in `nam5`
- Production rules: authenticated reads plus attributed, versioned,
  append-only event creates; all other paths denied

Firebase browser configuration is public configuration, not a secret.
Authentication and Firestore Security Rules provide attribution and immutable
history, not server-side game-action validation or cheating prevention. Never
commit service-account credentials, private keys, Firebase CLI tokens, or
production data.
