# ComfyUI Log and Process Tree Check

**Date:** 2026-06-05

## Context

The laptop launcher routes were live, the safe-directory fix was applied, but `8189` still did not open. The next step was to inspect the Windows-side logs and process tree before trying anything else.

## Decision

1. Treat the local listener and log output as the decisive signal.
2. Avoid more restarts until the actual stall point was identified.

## Rationale

- `GET /status` still reported ComfyUI as not ready.
- `GET /openapi.json` showed the ComfyUI routes were deployed, so the failure was inside A1111/ComfyUI startup.
- `Get-NetTCPConnection` showed only `7860` listening, not `8189`.

## Challenges

- The log is append-only and mixes older startup attempts with the current one.
- The ComfyUI subprocess does reach `Starting server`, but no port listener ever appears.

## Implementation Notes

- Checked the A1111/ComfyUI `sd.log` around the stall window.
- Confirmed the current process tree: `cmd.exe` -> `python` PID `13608` -> `python` PID `62268` -> `python` PID `30392`.
- Confirmed only PID `30392` listens on `7860`.
- Found `ValueError` in `D:\Tools\StableDiffusion\webui\extensions\sd-webui-comfyui\scripts\comfyui.py`.
- Found a later xformers `NotImplementedError` during a txt2img path.

## Follow-up

1. Inspect the `sd-webui-comfyui/scripts/comfyui.py` `enabled_workflow_type_ids` path.
2. Check whether the xformers attention failure is preventing a clean ComfyUI startup.
3. Re-test `GET /wait/comfyui` only after the underlying startup error is addressed.
