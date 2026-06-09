# ComfyUI Still Not Reachable

**Date:** 2026-06-05

## Context

The laptop service had been restarted, the ComfyUI routes were live again, and the SYSTEM `git safe.directory` entries were added on the laptop. The remaining question was whether ComfyUI on port `8189` would finally become reachable.

## Decision

1. Verify the live daemon again after the fix.
2. Treat `8189` reachability as the success criterion, not just route registration.

## Rationale

- `/openapi.json` now includes `/start/comfyui` and `/wait/comfyui`.
- `sd.log` shows ComfyUI reaching `Starting server` and advertising `http://127.0.0.1:8189`.
- The launcher’s own `/wait/comfyui` still returned `ready: false` after 900 seconds.

## Challenges

- The startup path is active but never reaches a reachable port from the launcher’s point of view.
- The log contains many ComfyUI-Manager and `httpx` requests, but no clean success marker for the port becoming available.

## Implementation Notes

- Rechecked `GET /status` and `GET /openapi.json`.
- Called `POST /start/comfyui` and then `GET /wait/comfyui`.
- Repeated the wait after the safe-directory fix.
- Confirmed `Test-NetConnection 100.109.133.95 -Port 8189` still fails.

## Follow-up

1. Inspect whether A1111/ComfyUI is stuck in a long init phase or a silent failure after `Starting server`.
2. Check the Windows-side launcher and A1111 logs for a later startup marker or crash.
3. Do not treat the safe-directory fix as sufficient until `8189` is actually open.
