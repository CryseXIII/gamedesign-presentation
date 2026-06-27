#!/usr/bin/env bash
set -euo pipefail
# Auto-commit and push docs/ changes to GitHub.
# Used by git-watcher on VPS containers to sync across devices.
# Prevents empty commits when nothing changed.

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

# Pull remote changes first to avoid push conflicts
git pull --rebase --autostash 2>/dev/null || true

# Check for changes in docs/ or AGENTS.md (including untracked files)
if git status --porcelain -- docs/ AGENTS.md | grep -q .; then
  :
else
  exit 0  # nothing to commit
fi

TIMESTAMP=$(date -u +%Y-%m-%d_%H%M%S)
git add -A docs/ AGENTS.md 2>/dev/null || true
git commit -m "docs: auto-sync ${TIMESTAMP}" 2>/dev/null || true
git push 2>/dev/null || true
