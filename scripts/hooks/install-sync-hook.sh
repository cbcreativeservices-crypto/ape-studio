#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# install-sync-hook.sh — one-time install of the A <-> ccode sync post-commit hook.
# Run once from the ape-studio repo root. Idempotent; safe to re-run.
#
# It points git at the version-controlled hooks dir (scripts/hooks) instead of the
# per-clone .git/hooks, so the hook travels with the repo and every clone/machine
# gets it automatically after one `git config`.
# ---------------------------------------------------------------------------
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

mkdir -p scripts/hooks

# The post-commit script must already be at scripts/hooks/post-commit (committed with the repo).
if [ ! -f scripts/hooks/post-commit ]; then
  echo "ERROR: scripts/hooks/post-commit is missing. Add it first, then re-run." >&2
  exit 1
fi
chmod +x scripts/hooks/post-commit

git config core.hooksPath scripts/hooks

echo "OK: core.hooksPath -> scripts/hooks ; post-commit is executable."
echo "Every commit from now on appends a stub entry to docs/CROSS_SESSION_HANDOFF.md."
