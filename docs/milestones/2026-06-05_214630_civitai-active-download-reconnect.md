# CivitAI Active Download Reconnect

**Date:** 2026-06-05

## Context

The CivitAI Browser+ download backend kept running after a browser refresh, but the refreshed page could not reattach to the active job's progress state.

## Decision

1. Store a serializable active-download snapshot in Python while the aria2 job runs.
2. Expose that snapshot through a hidden Gradio trigger on page load.
3. Let the browser rebuild the active row and progress bar from the snapshot and keep polling until the job finishes.

## Rationale

- The backend job should survive refresh without special handling.
- The UI only needs a reconnect path, not a full rewrite of the queue engine.
- Polling the backend snapshot is simpler than trying to persist live Gradio state across a page reload.

## Challenges

- The queue DOM is split between Gradio output and browser-side manipulation.
- Refreshing the page destroys the live progress stream, so the reconnect path had to rebuild both the visible row and the progress display.
- The browser needs an initial backend poll after load, even if the saved DOM snapshot is stale.

## Implementation Notes

- Added `download_snapshot` to `civitai_global.py`.
- `download_file()` and the fallback downloader now keep the current progress snapshot updated.
- Added `download_snapshot_state()` so the refreshed page can fetch the current job state.
- Wired hidden reconnect inputs in `civitai_gui.py`.
- Added `restoreActiveDownloadFromSnapshot()` and snapshot polling in `civitai-html.js`.
- The queue snapshot still uses `sessionStorage`; the active job now has a separate reconnect snapshot.

## Follow-up

1. Verify the reconnect flow in a real browser refresh during an active download.
2. If the active item ever fails to reconstruct without a saved queue DOM snapshot, add a fallback row renderer from the Python snapshot.
