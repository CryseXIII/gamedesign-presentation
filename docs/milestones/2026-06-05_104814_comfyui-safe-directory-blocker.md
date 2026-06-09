# ComfyUI Safe Directory Blocker

**Date:** 2026-06-05

## Context

The laptop launcher service was restarted and the live daemon now exposes the ComfyUI routes again, but the actual A1111 startup still fails under `SYSTEM` before ComfyUI can become reachable.

## Decision

1. Treat the route deployment as successful.
2. Record the remaining startup blocker separately.

## Rationale

- `GET /openapi.json` now includes `/start/comfyui`, `/stop/comfyui`, and `/wait/comfyui`.
- `GET /status` shows A1111 running, but ComfyUI still reports not ready on port `8189`.
- `sd.log` shows `git` refusing to fetch `D:\Tools\StableDiffusion\webui` and the assets repo because they are not marked safe for `SYSTEM`.

## Challenges

- The launcher itself is healthy, but A1111 cannot finish initialization.
- The timeout on `/start/comfyui` happened because startup never progressed far enough to make ComfyUI reachable.

## Implementation Notes

- Verified the live launcher routes after the service restart.
- Checked `sd.log` and found repeated `fatal: detected dubious ownership in repository` errors.
- The affected paths are `D:\Tools\StableDiffusion\webui` and `D:\Tools\StableDiffusion\webui\repositories\stable-diffusion-webui-assets`.

## Follow-up

1. Add the safe-directory exceptions under the `SYSTEM` context on the laptop.
2. Restart A1111 again.
3. Re-run `/wait/comfyui` until port `8189` becomes reachable.
