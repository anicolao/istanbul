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
- Review the current turn before passing, undo its entire reversible suffix,
  or open the game log and roll back directly to any reachable action. Every
  rollback is an attributed append-only event, with hard boundaries whenever a
  card draw or die roll reveals new information.
- Ordinary network play on phone, tablet, and desktop.
- A dedicated `/tabletop/` route that creates and owns the room, presents eight
  physical join positions around the display, renders every public game control
  on the shared display, and leaves only private Bonus-card information and
  decisions on each player's phone. One occupied position is chosen as Player 1
  and play proceeds clockwise through the remaining occupied positions.
- A dedicated `/gallery/` review route that renders the same logical Svelte
  components used during play—with representative state, stable references,
  renderer props, and full-size views for precise UI feedback.
- Keyboard, pointer, touch, reduced-motion, and screen-reader-friendly play.

The bazaar board follows the physical tabletop hierarchy: every Place name is
anchored at the top, enlarged merchants and assistants occupy the visual
center, and only Places with changing public state carry a large graphical
display at the bottom. The Caravansary draw and discard piles are directly
inspectable, revealing the exact current top-card art and rules text without
changing game history.

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
to five browsers. Opening `/tabletop/` creates a fresh table-owned room without
claiming a merchant seat. Every open position shows a real QR leading only to a
private phone controller; merchants scan, join, and mark themselves ready. The
dedicated tabletop owns layout, start, movement, Place actions, encounters,
Mosque powers, payments, turn completion, and rematches. It starts with everyone
present and replaces every claimed and unclaimed lobby position with the
privacy-safe public bazaar. Phones become compact private Bonus-card controllers;
Caravansary card selection and Governor card payment stay there because they
depend on hand identities. Reloading its retained URL reopens the same room. The
MVP is complete: its final slice adds roving keyboard navigation and focus
transfer, live turn announcements, 44 px touch actions,
safe-area insets, reduced-motion behaviour, labelled non-colour cues, and
responsive play at every target viewport in [MVP_DESIGN.md](MVP_DESIGN.md).
Players can now walk backward through their latest authored actions—including
movement, Bonus-card plays, payments, trades, and turn completion—and replay a
different choice. Each rollback is itself retained in immutable history. The
control visibly locks at Caravansary and other card draws, dice rolls, and
random token relocations because revealed information cannot be unseen.

Each numbered directory under [`tests/e2e`](tests/e2e) is a generated,
screenshot-by-screenshot play-by-play. Its README names the acting user, shows
the exact UI after every action, and lists the DOM and serialized projection
facts checked before that image was accepted. For example, scenario 013 starts
at the direct tabletop URL, follows Ada and Bora scanning its QR codes on
private phones, plays Ada's private Bonus card on her phone, then performs the
movement, Warehouse action, and clockwise handoff on the tabletop before reload,
without omitting an interaction.
Scenario 019 follows a complete undo story: Ada plays, undoes, and replays a
Bonus card; reverses a Small Market sale and movement; restores her private hand
and assistant; and finally sees undo lock immediately after a Tea House roll.
Scenario 020 expands that story into turn review and direct history navigation:
Ada undoes three actions with one event, replays them, rewinds straight to an
earlier movement, and proves that grey information barriers prevent the game
log from crossing a retained dice result.
Scenario 021 opens the standalone production gallery, enlarges a live
`LocationTile`, and then reviews every page of locations, `PlayerTray` states,
merchants, assistants, family members, `BonusCard` faces, `MarketDemand` states,
and public components. It checks all 85 rendered states and the complete
73-asset backing manifest by stable ID, verifies the expected renderer and
representative props, proves every nested image loaded, and captures the
responsive result after every input.

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
family members and physical trays, neutral characters, goods, Mosque and demand tiles,
Lira, dice, wheelbarrows, tracks, supplies, and rubies. See
[ART_ASSETS.md](ART_ASSETS.md) for the complete inventory and source-atlas
workflow. Open `/gallery/` in any deployment to inspect the live component
catalogue by category, enlarge an item, and cite its stable review reference and
props when providing feedback. The gallery never substitutes a raw location or
mat image for the composed UI: it uses the same `LocationTile`, `LocationState`,
`PlayerTray`, `BonusCard`, and `MarketDemand` components as live play. Each tray
is a functional organizer whose goods, extensions, rubies,
money, cards, and acquired square Mosque powers sit in matching visible wells.
Every Place also displays its current public state with physical arrangements:
mail windows, decks and discards, demands, Mosque costs and rewards, ruby-track
prices, and all other location-specific values update directly on the 4×4
bazaar. Exact summaries remain semantic HTML so the visuals never replace
accessible game information.

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
