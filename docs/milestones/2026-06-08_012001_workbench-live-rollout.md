# Workbench Live Rollout

## Context
The redesigned Image Workbench had already passed a local build, but the user wanted the new bundle made live immediately and explicitly did not want browser interaction tests this time.

## Decision
Deploy the built `dist/` to CT205 and restart `gamedesign-prod.service` without doing UI interaction verification.

## Rationale
- The local build was already green.
- The live bundle needed to be updated now, not after another test cycle.
- The user explicitly asked to skip interaction tests for this rollout.

## Challenges
- The production container serves the checked-in `dist/` output via `vite preview`, so the new build had to be copied into the live container first.
- The restart had to be done without disturbing the rest of the stack.

## Implementation Notes
- Streamed the rebuilt local `dist/` into `/root/gamedesign-app/dist` on CT205.
- Restarted `gamedesign-prod.service`.
- Verified the service came back up and the public portal returned `200 OK`.

## Follow-Up
- Do a real browser interaction pass later when the user wants it.
- Watch for any stale assets in the browser cache after the rollout.
