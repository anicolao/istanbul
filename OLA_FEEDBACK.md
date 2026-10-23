# Ola and Alex playtest fixes

Source: October 22, 2026 session notes in the local `ola_alex_istanbul.md` file (not included in this PR). Timestamps below refer to that session. This is a proposed, prioritized backlog, not a claim that each issue has been reproduced in the latest build. The source is an automatically generated meeting summary; uncertain rules claims are called out for verification.

The design goal remains fast, direct interaction with game components: make consequences visible, keep reversible choices undoable, and require deliberate input before revealing new information. Avoid adding confirmation dialogs to every action.

## Current status

**17 of 19 items implemented locally.** ✅ marks completed implementation, including the approved lab design now integrated into regular play. Screenshot baselines have been updated; verification is recorded in the review PR checks. Production rollout remains pending.

**Two feedback items remain open:**

1. Make merchant tolls and their recipients clearer before and after moving.
2. Investigate the reported blocked return to the Fountain; the cause is still unverified.

These remain candidates for deferral, not yet dismissed. The Fountain report needs reproduction if it recurs. Rematches now allow any remaining player to choose the next map and start with connected players and bots. Players may explicitly leave only after the game ends; an unfinished game cannot replace a missing player.

## 1. Accidental actions and recovery

- [x] ✅ **Keep accidental encounter discards reversible.** The chosen fix replaces the proposed extra inspection/confirmation step: paying or discarding for the Governor leaves him in place and exposes an explicit board roll action. Until that roll, Undo restores the discarded card or coins. The Governor's initial card draw remains an information boundary. Implemented locally; review in the `governor-pay` lab scenario. *(00:35:23–00:38:33)*

- [x] ✅ **Separate reversible encounter payment from irreversible relocation rolls.** Governor payment and Smuggler trades now stop at an undoable payment state. A separate “Roll to move” board action rolls the dice and animates the NPC to its destination. End turn cannot skip a required relocation. Historical combined payment/roll events retain their original replay behavior. Implemented locally and checked in Chromium/WebKit; production rollout and CI remain pending. *(00:33:36–00:38:33)*

- [x] ✅ **Support consensual undo across revealed-information boundaries.** Undo and game-log rollback can now request a rewind across draws, rolls, and later players’ actions. Every human must agree; bots need no vote, and a shared tabletop can collect each seated player's response. The request lists the affected actions. Rejection/cancellation leaves the game intact; any intervening accepted game action cancels stale votes. Agreement restores the original state. Face-down draws reshuffle using the game seed, turn, player, action, and draw index: replaying the same action repeats its cards, while another turn or player gets a different shuffle (which can coincidentally draw the same card). Dice remain unchanged; face-up choices remain explicit. Historical draw events preserve their original replay behavior. Ordinary reversible undo stays immediate; rewinds cannot cross a new game/rematch or reviewed-setup boundary. Implemented locally with replay and desktop/mobile browser checks; production rollout and CI remain pending. *(00:16:07–00:17:11)*

- [ ] **Make automatic merchant payments unmistakable.** Ola missed that moving onto a location paid Alex. Show the cost and recipient before movement is committed, and make the transfer and resulting balances legible afterward. Retain quick undo where permitted instead of inserting a confirmation for every payment. **Done when:** a player can tell that a destination costs money, who receives it, and what was paid without consulting the log. *(01:37:11; 01:43:12)*

## 2. Readability and board space

Approved in the animation lab and integrated into regular play, with updated screenshot baselines.

- [x] ✅ **Explain unfamiliar iconography.** Add concise explanations for neutral merchants, locations, powers, and other non-obvious symbols. Use explicit graphical help mode for click, touch, and keyboard explanations; no hover help. **Done when:** players can discover an icon's meaning without committing its action. *(00:00:03)*

- [x] ✅ **Enlarge small numerical labels.** Audit location/card numbers and printed costs, quantities, and payouts at normal board scale, not only when zoomed. **Done when:** necessary values are readable at the supported phone, tablet, and desktop sizes without opening an inspector just to read a number. *(00:00:03)*

- [x] ✅ **Give the wild resource a distinct generated icon.** Its small circle was illegible, making it look like cloth. Redesign it so it reads as a choice of resource even at board scale; apply the asset consistently wherever wild costs appear. **Done when:** wild and fabric cannot reasonably be confused. *(00:05:47)*

- [x] ✅ **Improve pawn/background contrast.** The Governor was hard to see against the Black Market's dark green artwork. Audit all pawn colors against all locations and their wells; adjust well backgrounds only. Preserve the size distinction between merchants and smaller assistants/family members. **Done when:** piece identity and ownership remain obvious on the unzoomed board. *(00:05:47–00:09:28)*

- [x] ✅ **Make player-mat totals and their units readable.** Currency artwork behind the number was effectively invisible; scores and resource counts were also difficult to interpret. Improve contrast, size, and separation between symbols and numbers. **Done when:** players can distinguish Lira, goods, and rubies and read their totals at the mat's actual display size. *(00:09:28)*

- [x] ✅ **Prototype collapsible player mats for web play.** The bottom-edge dock frees board space and opens from compact summary tabs by click, tap, or keyboard. Hover reveal was removed because it moved the target before a click could land. Keep the revealed mats large enough to read. **Done when:** the board gains useful space without making player information difficult to find or inspect. This is a design experiment, not a requirement to hide tabletop mats by default. *(00:07:49–00:08:40)*

- [x] ✅ **Strengthen reachable-destination highlights.** Yellow move highlights were much harder to see than red ones. Use a sufficiently strong outline and an additional shape/contrast cue so visibility does not depend solely on player color. **Done when:** reachable locations and the active player's state are obvious across every player color and room artwork. *(00:52:30)*

## 3. Location and card controls

Completed in the animation lab and integrated into regular play, with updated screenshot baselines. Production rollout remains pending. Both markets show compact vertical payout tables beside the demand display and highlight the selected total. Black Market full tracks are greyed out with “Full · roll only,” jewelry space is shown before rolling, and the result reports actual capped gains. Family Pardon and family encounters share graphical reward choices; the other Bonus-card resource dropdowns now use common graphical resource controls.

Review scenarios: `action-10`, `action-11`, `black-market-capacity`, and `family-reward-review`. The latter opens Family Pardon’s reward choices directly. The redundant warehouse fill button has been removed; arrivals still fill automatically.

Rules check: the [published rulebook, page 6](https://cdn.1j1ju.com/medias/74/c0/33-istanbul-rulebook.pdf) permits rolling before taking the basic good. Preserve the existing capped-gain rules and keep rolls available when basic goods are full; no game economy changes.

- [x] ✅ **Show complete payout legends on both markets.** Players needed an external answer to determine the Large Market payout. Keep the legend visible before and during interaction, and clearly show the total for the selected goods. The current implementation's payout tables are below; this is a visibility fix, not a request to rebalance them. *(Decision list; 01:06:35; 01:35:56)*

  | Goods sold | Small Market: Lira | Large Market: Lira |
  | ---: | ---: | ---: |
  | 1 | 2 | 3 |
  | 2 | 5 | 7 |
  | 3 | 9 | 12 |
  | 4 | 14 | 18 |
  | 5 | 20 | 25 |

  Values checked against `src/lib/game/actions.ts`, `marketRevenue`. Goods still need to match demand, subject to the applicable Bonus card.

- [x] ✅ **Handle full goods capacity clearly at the Black Market.** The notes request graying out resource choices that cannot fit. Reproduce the exact selection and verify the rules before deciding whether to disable the choice or show a capped/no-gain result: a full goods track should not accidentally block an otherwise legal jewelry roll. **Done when:** capacity constraints and the actual gain are visible before committing, with no misleading selectable reward. The summary's phrase “card capacity” appears to mean wheelbarrow goods capacity; it should not introduce a hand limit. *(00:18:12; 00:33:36)*

- [x] ✅ **Replace Family Pardon's reward dropdown with component choices.** The two-option combo box had tiny text and felt like an obsolete interface. Show large, distinct choices using coins for 3 Lira and the actual Bonus-card back for a card draw. Make it clear that drawing reveals information. Audit other reward dropdowns for the same problem and use common controls. **Done when:** choosing either reward requires no native select menu, and its consequence is clear before commitment. *(01:03:36–01:04:26)*

## 4. Rules and flow issues to verify

- [ ] **Investigate the blocked return to the Fountain.** Ola could not retrace a route to the Fountain and was forced into a different move. Reproduce the move with its distance, assistants, and active card effects; check the official Fountain exception and whether the report concerns the merchant or a family-member action. **Done when:** all legal Fountain returns are available, and genuinely illegal moves have an understandable reason. Do not treat the summary's claim that the Fountain is “unreachable once left” as an established rule. *(01:10:04)*

- [x] ✅ **Automate endgame card resolution where no meaningful choice remains.** After the last ordinary turn, automatically play all +5 Lira cards and as many +1 good cards as fit; retain unusable goods cards and other cards for the final tiebreaker. Resource type is immaterial to final scoring, so allocation uses a stable order. Animate the benefits and show results with final-card gains and all tiebreak totals, without a per-player “Finish trading” step. Implemented locally; historical final-card events remain replayable. *(01:38:08–01:40:31)*

## 5. Rematches

- [x] ✅ **Offer map selection when playing again.** The results screen offers every map layout and retains connected participants; explicit departures are excluded immediately and closed windows age out after 90 seconds. **Done when:** a rematch can use a different map without creating a room and rejoining. *(01:45:51)*

- [x] ✅ **Let any player initiate a rematch.** Any remaining human can start; epoch checks make simultaneous requests resolve to one new game. **Done when:** every participant can start the rematch setup flow, and simultaneous requests cannot create conflicting games. *(01:45:51)*

- [x] ✅ **Audit rematch setup and randomness.** Replay tests verify a fresh seed, selected map, initial goods/cards/pawns/tracks, cleared final scores and draw counters, preserved seating edges, and two-player neutral merchants at 14/15/16. The discussion observed fixed white/neutral merchant positions and randomized Governor/Smuggler positions; verify which positions are supposed to be fixed before changing them. **Done when:** repeated rematches follow the selected map's setup rules without carrying over prior-game state or unintentionally repeating random setup. *(01:44:59)*

## Source cautions and scope

- The card-payment incident's room was **SCWXV**; the meeting notes transcribe it as `SCcwxv`. Its one-off history repair does not fix the underlying interaction.
- The notes contain suspect rules summaries, including a two-item market-sale limit and suggestions that the Small Market requires a flexible-demand card to pay 20. Do not turn these into rule changes; verify any such claim against the rules before implementation.
- Discussion of Sultan/Gemstone balance, card luck, and opening strategy does not establish a request to change the game's economy or distribution.
- Custom versus shared lobby architecture was discussed without a concrete redesign decision. The actionable lobby work here is the rematch flow.
- Chess, Cluster, AI-model evaluation, advertising, active-play time windows, and Pantheon testing are outside this Istanbul fix list.
