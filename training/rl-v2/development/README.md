# Development evaluations, not final release scores

These reports document discarded deployment/checkpoint choices and their failures.
The early reports' seed names include `release` because they exposed failures during
release qualification; those seeds subsequently became development data. They are
not used for the final performance claims.

Sampled deployment and some greedy base checkpoints could strand the last assistant
after playing Long Move. The final model adds explicit public mobility features,
fits them on constructed positions, and receives further reinforcement learning.
Final release reports live one directory above and use a fresh `release-mobility`
seed namespace after freezing those weights and selection behavior.
