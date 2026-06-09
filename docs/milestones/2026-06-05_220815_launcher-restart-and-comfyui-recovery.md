# Launcher Restart and ComfyUI Recovery

**Date:** 2026-06-05

## Context

After the UTF-8 launcher env change, the local launcher stack needed a real restart so the new process environment could take effect for A1111 and the embedded ComfyUI extension.

## Decision

1. Restart the launcher-controlled SD stack through the launcher API.
2. Wait for ComfyUI to become reachable again through the launcher's own readiness endpoint.
3. Confirm the final status for both A1111 and ComfyUI.

## Rationale

- The service itself could not be restarted from this shell due Windows service permissions.
- The launcher API is the correct control plane for the SD stack.
- A readiness wait is better proof than just checking that the process exists.

## Challenges

- `Restart-Service` on `LaptopLauncherDaemon` failed from the current permissions context.
- The launcher API still allowed a clean `POST /restart/sd`, which was enough to restart the stack.

## Implementation Notes

- Called `POST /restart/sd` on the launcher daemon.
- Waited on `GET /wait/comfyui?timeout=600` until it reported ready.
- Final status shows `sd.api_ready=true` and `comfyui.api_ready=true`.

## Follow-up

1. Re-run the problematic ComfyUI workflow and confirm sampling no longer crashes on progress output.
2. If Windows service restarts are needed again, they must be done from an elevated context.
