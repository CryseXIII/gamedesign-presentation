# Scene Pack And SD Cleanup

**Date:** 2026-06-06

## Context

The live SillyTavern path had drifted: the SD button still needed clearer documentation around the direct orchestrator route, and the RP pack logic was still described like a static seed-based flow even though it now needs to track the active scene.

## Decision

Update the extension behavior and project memory so the documented path matches the live path:

1. Treat the RP pack as scene-derived, not seed-derived.
2. Keep `SD Generate` on the public SD orchestrator.
3. Keep the scene-worker queue path and its direct fallback documented.

## Rationale

- Stale browser state can outlive deploys, so the code now migrates old URLs automatically.
- Scene images work better when the pack is rebuilt from the current excerpt, cast, and lorebook context.
- The public orchestrator is already reachable and avoids the broken n8n dependency.

## Challenges

- Old tabs can still show the previous Makoto-era behavior until refreshed.
- The scene render path must keep a fallback for HTTP 422 cases.

## Implementation Notes

- `scene_worker.py` now handles missing character fields safely when building prompt text.
- The SillyTavern extension now regenerates the RP pack from the current scene and lore context on refresh.
- `SD Generate` now targets the public orchestrator directly and favors storyboard-style output for multi-beat scenes.
- Verified the queue submit path still returns `200` with `{"status":"queued"}` after the prompt fix.

## Follow-up

1. Hard reload any open SillyTavern tabs so the updated extension code runs.
2. Decide whether to remove the unused n8n `sd-agent` workflow.
