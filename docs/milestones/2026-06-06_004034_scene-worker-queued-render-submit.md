# Scene Worker Queued Render Submit

**Date:** 2026-06-06

## Context

The SillyTavern scene renderer button was hitting a browser-side network error because the worker's `POST /scene/extract` step can take over a minute even on trivial input. That is too slow for a blocking browser request.

## Decision

1. Add a queued `POST /render/from-excerpt/submit` endpoint on the scene worker.
2. Switch the SillyTavern extension to submit a job id first, then poll status.
3. Add a fetch timeout guard so a broken request fails cleanly.

## Rationale

- The button should return quickly and let the worker do the slow work in the background.
- A single queued job is more robust than three sequential browser fetches.
- A timeout guard avoids leaving the UI in a dead waiting state.

## Challenges

- `POST /scene/extract` is slow by design because it asks Oobabooga to structure the scene.
- The old flow was fine in principle, but not safe for a browser event handler.

## Implementation Notes

- Added `RenderExcerptSubmitRequest` to `scene_worker.py`.
- Added `POST /render/from-excerpt/submit` that creates a job, extracts, plans, and then renders in the background.
- Updated the SillyTavern extension to use the new submit endpoint and poll `/render/status/{job_id}`.
- Added a 30-second fetch timeout wrapper in the extension.
- Verified both edited files still parse.

## Follow-up

1. Let the scene-worker and SillyTavern deployment refresh so the live browser picks up the queued path.
2. Re-test the scene render button and confirm it now reports a job id instead of a fetch error.
