# Trained Istanbul player (v1)

New trained seats use [the complete-action v2 network](RL_PLAYER_V2.md). This document records the frozen first iteration for existing games and benchmarks.

Choose **Trained bot** in the lobby's **Bot strategy** control, then add a bot. This works in personal-screen and shared-table games. The money bot remains available and is still the default. Keep the host/tabletop tab open, as with the existing bot; inference runs in that browser, with no server or Python dependency.

## What learns

This is a small hierarchical reinforcement-learning player, not a scripted replacement labelled as RL. A linear policy with **42 trained weights** chooses merchant destinations and family-member destinations. Its features describe public costs, expected resource changes, ruby opportunities, assistant availability, and distances to useful locations. Features do not read the game seed, face-down card identities/order, future demand tiles, or opponents' hands.

A fixed tactical controller executes a selected Place's ordinary action, handles mandatory payments, recalls assistants, resolves dice with the original bot's conservative choice, and uses supported cards from its own hand. It can use warehouses, markets, Post Office, Tea House, Black Market, Police Station, Caravansary, Wainwright, Sultan, mosques, and Gemstone Dealer. Location-specific choices are **not** all learned: wagers stay at seven, market sales use the maximal matching subset, and the controller does not strategically use the Governor/Smuggler, Flexible Demand, long-move, or stay-put cards. These are directions for a later policy version.

Training uses softmax REINFORCE with batch-standardized, clipped discounted returns and Adam updates. No expert demonstrations or money-bot action labels are supplied. The return combines the eventual win/loss with progress in rubies relative to opponents and smaller resource/power gains. This shaping helps exploration; it is not a proof of optimality. The untrained ablation and warm-start comparison retain exactly the same fixed tactical controller, so they measure improvement from learning rather than the extra tactical code alone.

The deployed policy picks its highest-scoring destination 95% of the time and a legal destination 5% of the time. The exploration floor prevents persistent greedy movement cycles found during development. Its PRNG is derived solely from the current public observation and turn, making the choice reproducible during event replay. An assistant-safety mask avoids moving into an immediate assistant dead end under this engine's movement rules.

## Training run

Seed: `istanbul-rl-v1`.

1. **8,192 two-player games against the existing money bot.** Alternate the learner's seat and cycle through all four layouts.
2. Select the warm-start checkpoint using validation games whose seeds are separate from training.
3. **16,384 further games of self-play.** Four of every five opponents are frozen learner checkpoints sampled from a rolling pool of up to twelve versions; the fifth is the money bot to reduce forgetting. Only the learning seat receives gradient updates, then seats alternate.
4. Validate every 512 games. Select the checkpoint with the best combined score (60% money-bot validation, 40% warm-start validation), rejecting checkpoints with learner failures. The released weights come from **self-play episode 15,360**. Final evaluation seeds do not influence this selection.

Batch size: 32 games. Discount: 0.985 per strategic decision. Adam learning rate: 0.025; moments 0.9/0.999; weight decay multiplier 0.99999. Games exceeding 320 turns or 2,400 events are recorded as incomplete, never counted as wins. An invalid game action throws and stops the run.

The zero-weight pilot and initial greedy deployment revealed movement-cycle failures. Those development evaluations were used to fix deployment behavior; the release tables below use a new, untouched seed namespace after freezing the model.

## Release evaluation

All four layouts are equally represented; each seed is played with the learner in every seat. Wins are scored as 1, losses as 0, and tied wins fractionally. Confidence intervals resample seed groups rather than treating mirrored seats as independent games. Reports include per-layout and per-seat breakdowns, failures, and turn counts.

| Matchup | Games | Win share |
| --- | ---: | ---: |
| Final policy vs money bot | 800 | **87.5%** |
| Untrained uniform strategic policy, same tactics | 800 | 0.1% |
| Money-trained checkpoint vs money bot | 800 | 67.6% |
| Final policy vs money-trained checkpoint | 800 | **77.8%** |
| Final policy vs two money bots | 240 | 77.9% |
| Final policy vs three money bots | 320 | 62.2% |
| Final policy vs four money bots | 400 | 65.3% |
| Five final policies (completion/replay stress test) | 200 | 20.0% by symmetry |

The primary money-bot score's paired 95% bootstrap interval is **85.0–89.9%**. The final-vs-warm-start interval is **74.8–80.6%**. Every final-policy evaluation game completed. Five-identical-policy win share is not evidence of strength; that test checks completion in a crowded self-play game.

See [`training/rl-v1`](../training/rl-v1) for exact JSON reports, the uniform-random strategic ablation, the warm-start weights, the full training validation history, and source/model hashes. Results establish a credible opponent relative to this repository's money bot, not optimal play or performance against experienced humans. Multiplayer performance was evaluated but training itself used two-player games.

## Reproduce

From the repository root, with Bun installed:

```sh
bun run train:bot --episodes 8192 --self-play 16384 --seed istanbul-rl-v1 --out /tmp/istanbul-rl-training
bun run evaluate:bot --model /tmp/istanbul-rl-training/final.json --games 800
bun run evaluate:bot --model /tmp/istanbul-rl-training/final.json --opponent /tmp/istanbul-rl-training/warm-start.json --games 800
bun run evaluate:bot --players 5 --games 400 --seed istanbul-rl-v1:release-multi-2026-11-03
bun run evaluate:bot --model training/rl-v1/untrained.json --sample --games 800
```

Training writes numbered checkpoints, `warm-start.json`, `final.json`, and `history.json` to the output directory. It does not overwrite the shipped model. The seed, feature order, and hyperparameters are fixed, and the simulator calls the same game reducer as the browser. To evaluate a future revision without tuning on this release's test set, choose a fresh `--seed`.

## Replay and compatibility

Old bots retain policy version 1 and the unchanged money strategy. A trained seat records `botPolicy: "rl-v1"`; its actions use version 2 and the existing state precondition to prevent duplicate host-tab actions. All clients recompute and validate the versioned decision. A validated bot may play its own private cards, while tabletop hosts still cannot play a human's private cards.

**Do not replace `model-v1.json` or change its policy semantics after release.** New weights or changed tactics/features require a new policy/model version and dispatcher branch, preserving the old code for replay. Unit tests cover policy identity, hidden-information invariance, legacy behavior, and complete deterministic replay on every layout. Browser tests cover selecting the trained bot and resuming its turn after reload.
