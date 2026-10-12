#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${IN_NIX_SHELL:-}" && "${ISTANBUL_USE_INSTALLED_TOOLS:-}" != "1" ]]; then
  exec nix develop --command bun run verify:change
fi

git diff --cached --check
git diff --check
bun run check
bun run test:unit
bun run test:rules
bun run test:e2e
bun run build
