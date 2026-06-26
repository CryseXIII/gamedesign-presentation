#!/usr/bin/env bash
set -euo pipefail
# Compress milestones older than 14 days into monthly archive summaries.
# Usage: ./scripts/summarize-memory.sh [--dry-run]

DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MILESTONES="$REPO_DIR/docs/milestones"
ARCHIVE="$REPO_DIR/docs/archive"
MEMORY="$REPO_DIR/docs/project-memory.md"

mkdir -p "$ARCHIVE"

NOW_TS=$(date +%s)
CUTOFF=$((NOW_TS - 14 * 86400))

# Scan milestone files older than cutoff
declare -A MONTH_FILES
while IFS= read -r -d '' f; do
  base=$(basename "$f")
  ts=$(stat -c %Y "$f" 2>/dev/null || date -d "${base:0:10}" +%s 2>/dev/null || echo 0)
  [[ "$ts" -eq 0 ]] && continue
  [[ "$ts" -gt "$CUTOFF" ]] && continue
  month="${base:0:7}"  # YYYY-MM
  MONTH_FILES["$month"]+="$f"$'\n'
done < <(find "$MILESTONES" -maxdepth 1 -name '*.md' -print0)

[[ ${#MONTH_FILES[@]} -eq 0 ]] && echo "Nothing to compress." && exit 0

for month in "${!MONTH_FILES[@]}"; do
  ARCHIVE_FILE="$ARCHIVE/${month}_summary.md"
  echo "=== Compressing $month → $ARCHIVE_FILE ==="

  if $DRY_RUN; then
    echo "[DRY-RUN] Would compress ${MONTH_FILES[$month]}"
    continue
  fi

  {
    echo "# Summary — $month"
    echo
    echo "_Auto-generated from milestones older than 14 days._"
    echo
    while IFS= read -r f; do
      [[ -z "$f" ]] && continue
      echo "## $(basename "$f" .md)"
      echo
      # Extract first few meaningful lines (skip title/date boilerplate)
      awk '
        /^# / { title=1; next }
        /^## / { if (!seen++) print; next }
        /^- / || /^\*\*/ || /^$/ { if (title || seen) print }
      ' "$f" | head -40
      echo
    done <<< "${MONTH_FILES[$month]}"

    echo "---"
    echo "_Compressed on $(date -u +%Y-%m-%d_%H%M%S)_"
  } > "$ARCHIVE_FILE"

  # Delete original milestone files
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    rm "$f"
    echo "  Removed: $f"
  done <<< "${MONTH_FILES[$month]}"

  # Update project-memory.md with archive reference
  if ! grep -q "docs/archive/$month" "$MEMORY" 2>/dev/null; then
    echo "" >> "$MEMORY"
    echo "## Archived Milestones" >> "$MEMORY"
    echo "" >> "$MEMORY"
    echo "- [${month} summary](docs/archive/${month}_summary.md)" >> "$MEMORY"
  fi
done

echo "Done."
