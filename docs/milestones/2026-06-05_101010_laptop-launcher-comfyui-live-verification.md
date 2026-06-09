# Laptop Launcher ComfyUI Live Verification

**Date:** 2026-06-05

## Context

The launcher source was updated to support ComfyUI on port `8189`, but the live daemon on `100.109.133.95:8765` still had to be checked.

## Decision

1. Verify the live API directly.
2. Treat the live route table as the source of truth, not the repo copy.

## Rationale

- `/status` was already reachable, so the daemon itself was up.
- The goal was to confirm whether `/start/comfyui` and `/wait/comfyui` were actually deployed.

## Challenges

- The live daemon returned `404` for both ComfyUI endpoints.
- `/openapi.json` showed only the older route set: `sd`, `llm`, `kokoro`, `civitai`, and `vision` endpoints.

## Implementation Notes

- Queried `GET /status` successfully.
- Sent `POST /start/comfyui` and `GET /wait/comfyui?timeout=120`; both returned `404 Not Found`.
- Queried `GET /openapi.json` and confirmed no ComfyUI routes were registered.

## Follow-up

1. Redeploy or restart the laptop launcher service with the updated `launcher_daemon.py`.
2. Re-run `/status`, `/start/comfyui`, and `/wait/comfyui` after deployment.
3. If the daemon still stays on the old route set, inspect how the Windows service is launched.
