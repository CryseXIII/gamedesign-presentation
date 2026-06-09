# CivitAI Queue Snapshot Persistence

**Date:** 2026-06-05

## Context

The CivitAI Browser+ download queue was backed by Python process state, but the visible queue panel could disappear on browser refresh. The remaining network calls also still needed a final timeout audit.

## Decision

1. Add a small browser-side queue snapshot cache for the visible queue panel.
2. Restore that snapshot on page load with `sessionStorage`.
3. Confirm the extension has no remaining no-timeout `requests` or `urlopen` calls.

## Rationale

- The backend queue should keep running even if the browser refreshes.
- A snapshot is enough for the UI; full backend persistence would be heavier than needed here.
- `sessionStorage` survives refreshes but avoids stale long-term cache issues.

## Challenges

- The queue panel is partly driven by Gradio and partly by browser DOM updates.
- Live progress streaming cannot be fully resumed after a hard refresh, so the best practical fix is a visible snapshot.

## Implementation Notes

- Added `sessionStorage` helpers in `civitai-html.js`.
- Persisted queue HTML after queue edits and during download progress updates.
- Restored the queue snapshot on page load and reattached sortable behavior.
- Audited the extension for remaining network calls and added the last missing timeout to `urllib.request.urlopen`.
- Verified the touched files still parse after the changes.

## Follow-up

1. If refresh recovery needs live progress replay, that would require server-side queue state.
2. Watch for any queue DOM edge case that needs a stronger restore guard.
