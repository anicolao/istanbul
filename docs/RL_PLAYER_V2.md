# Complete-action neural player (v2)

Choose **Trained** when adding a bot in either lobby. New seats use `rl-v2`; existing `rl-v1` seats continue using the frozen first policy. The host browser runs inference and publishes versioned decisions, as before.

## Decisions

The network scores **every legal forward gameplay choice**, including choices previously made by the tactical controller. No tactical action is forced ahead of the policy, and no legal destination is removed by a strategic safety filter.

| Decision | Options |
| --- | --- |
| Movement | Every legal destination, including a destination with an unaffordable toll |
| Merchant payment | Required payment, alongside cards usable before paying |
| Warehouses, Post Office, Wainwright, Gemstone Dealer | Take the action or skip it; usable cards remain options |
| Fountain | Every subset/multiset of assistants, including partial and empty recalls |
| Markets | Every payable subset of printed slots; Flexible Demand offers every payable multiset of 1–5 goods |
| Sultan | Every affordable wild-resource allocation |
| Mosques | Either available, affordable power; skip; green extra goods or decline; all four red dice adjustments; yellow recall from each occupied location |
| Tea House / Black Market | Every wager 3–12 / each ordinary good |
| Police Station | Every legal family destination, followed by the same full location choices |
| Caravansary | All available deck/discard source pairs, then every card in the resulting hand as a discard |
| Governor | Accept/decline, pay money or any card, then relocate |
| Smuggler | Accept/decline, each resource and each legal money/resource payment, then relocate |
| Family captures | Each family member and either available reward |
| Bonus cards | Every owned card, legal timing, resource/reward/assistant choice, and repeat payment |
| Turn end | End whenever permitted, including skipping a destination action |

Permutations of an identical payment or recall are one decision. Old compound Caravansary transactions are represented as draw then discard: the bot observes its drawn cards before choosing a discard. Ending while declining an ability/NPC has an equivalent sequence of individual choices. Room administration, undo voting, and rematches are outside the gameplay policy.

## Information and network

The explicit observation encoder includes:

- Board arrangement; all merchants, assistants, family members and neutral/NPC positions.
- Each player's public goods, money, rubies, capacity, extensions, assistants, exact owned mosque tiles, hand size, and turn counts, in relative seating order.
- Post Office switches; current market demand; remaining market-stack sizes; mosque stacks; ruby tracks and supplies.
- Draw-pile size and the full visible discard order, represented by printed card effect; the acting player's own hand by effect and count.
- Current phase, pending choices/payments/rewards/dice, powers used, active card effects, endgame state, last movement/action/roll, and public turn-log counts/latest relocation.

Cosmetic names/colors and explanatory prose are not inputs. Identical printed card copies are equivalent. The observation represents the current position and turn summaries, not a recurrent memory of every prior turn; it does not reconstruct previously exposed opponent cards from the entire event history.

The boundary excludes the game seed, future random outcomes, face-down draw identities/order, future market demand, and opponents' private card identities. Tests vary those hidden fields while asserting identical observations and action features.

A compact action-scoring neural network combines a shared public-state projection with an action projection, 24 tanh hidden units, and a linear action term: **1,314 observation inputs, 191 action inputs, and 36,359 learned parameters**. The action encoding includes choice parameters, expected immediate resource changes, the original movement features, and two public mobility-risk inputs (stranding after a move, and long-move activation with no safe continuation). These inputs include known card/power rescue options and Fountain recall; they do not mask actions or read future draws. Expected dice payoffs integrate all 36 rolls; no sampled future result enters inference. Only the trained weights choose among legal actions.

Training samples the learned softmax distribution. Deployment chooses its highest-scoring action with a stable action-order tie break. A sampled deployment was evaluated during development but occasionally stranded its assistants. Greedy deployment improved the matchup against v1, but wider testing still exposed rare long-move dead ends. A mobility curriculum and further RL fine-tuning address that weakness. There is no uniform-random move override or strategic action filter. An exact state always produces the same decision for event validation/replay. Frozen training checkpoints retain sampled deployment for reproducing the original training league.

## Training and evaluation

Training begins with imitation of v1's decisions to initialize a useful policy over the expanded action set. Reinforcement learning then trains against money, followed by a league of saved v2 checkpoints, money, and frozen v1. Imitation is an initialization, not a fixed rule or action filter.

The run used 1,024 imitation games, 4,096 money games, and 8,192 league/self-play games. The league contains 20% money, 20% v1 and 60% rolling v2 checkpoints (v1 fills an initially empty pool). Adam uses learning rates 0.008 for imitation and 0.003 for RL, batches of eight games, a running per-phase return baseline, clipped advantages, and gradient norm clipping. Returns discount at 0.995 per choice and combine the terminal result with public resource/ruby progress.

Starting from base checkpoint `self-5632`, a curriculum of 15,626 constructed public positions fits the two new mobility inputs to safe v1 movement examples (checked with the ordinary movement range after the long-move effect expires). All original learned weights are preserved during that fit. Then 2,048 more league/self-play games update every weight normally.

The fine-tuned checkpoints are compared on 1,200 games against each opponent, using greedy inference and weights rounded to seven decimal places. Selection requires every game to finish and maximizes the sum of money/v1 win shares. Validation seeds select checkpoints; fresh release seeds measure the final policy. Incomplete games never count as wins.

```sh
bun run train:bot:v2 --warm 1024 --money 4096 --self 8192 --out /tmp/istanbul-rl-v2-base
bun scripts/rl/mobility-v2.ts --model /tmp/istanbul-rl-v2-base/self-5632.json --out /tmp/istanbul-rl-v2-mobility.json
bun run train:bot:v2 --resume /tmp/istanbul-rl-v2-mobility.json --warm 0 --money 0 --self 2048 --seed istanbul-rl-v2:mobility-finetune --out /tmp/istanbul-rl-v2
bun scripts/rl/select-v2.ts --dir /tmp/istanbul-rl-v2 --selection greedy --games 1200 --seed istanbul-rl-v2:mobility-selection
bun run evaluate:bot:v2 --model /tmp/istanbul-rl-v2/selected.json --opponent money --games 800
bun run evaluate:bot:v2 --model /tmp/istanbul-rl-v2/selected.json --opponent v1 --games 800
```

The shared simulator applies the same reducer as live games. Unit tests enumerate every location/ability/encounter fixture and apply every offered action to the reducer, verify the neural gradient numerically, and enforce the information boundary. A separate frozen v1 game protects old policy replay.

## Frozen release evaluation

The selected weights are from fine-tuning checkpoint **self-1024**. On fresh seeds used only after freezing the model:

| Matchup | Games | Win share |
| --- | ---: | ---: |
| v2 vs money | 800 | **94.0%** |
| v2 vs frozen v1 | 800 | **68.4%** |
| v2 vs two money bots | 240 | 87.9% |
| v2 vs three money bots | 320 | 81.6% |
| v2 vs four money bots | 400 | 81.3% |
| Five v2 bots (completion stress test) | 200 | 20.0% by symmetry |

All **2,760** release games completed. The paired 95% bootstrap intervals are **92.4–95.6%** against money and **65.1–71.6%** against v1. Each seed is evaluated in every seat and layouts are balanced. The five-identical-bot result tests completion, not strength. Training used two-player games; multiplayer performance was evaluated separately.

See [`training/rl-v2`](../training/rl-v2) for frozen reports, checkpoint selection, training histories, source/model hashes and development results (including the discarded policies' failures). The fresh release namespace is `istanbul-rl-v2:release-mobility-2026-11-03`; earlier namespaces that exposed failures are explicitly classified as development data. Results establish strength against these bots, not expert human-level play.

## Versioning

`rl-v2` uses bot event version 3; `rl-v1` remains version 2 and money remains version 1. Once released, v2's weights, encoder, legal-action ordering and inference semantics must remain frozen. A subsequent model requires a new version and dispatcher branch.
