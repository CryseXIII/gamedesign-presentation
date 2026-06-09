# ComfyUI Launcher Extension + Memory Correction

**Date:** 2026-06-04

## Context

The laptop already runs ComfyUI through the `sd-webui-comfyui` extension inside A1111, listening on port `8189`. Earlier notes in project memory still treated ComfyUI as offline and used the old `8188` assumption. The user also wanted the Jellyfin `Animated` library to show everything below that folder.

## Decision

1. Treat ComfyUI as an A1111-backed extension, not a standalone install.
2. Expose explicit ComfyUI lifecycle/wait routes in the laptop launcher.
3. Correct project memory to `8189` and mark ComfyUI as running via the extension.

## Rationale

- The launcher logs already showed ComfyUI starting from `D:\Tools\StableDiffusion\webui\extensions\sd-webui-comfyui\ComfyUI`.
- The portal and scene-worker stack already target `8189`.
- A dedicated launcher alias is still useful so the rest of the stack can start or wait for ComfyUI without knowing the extension internals.

## Challenges

- Jellyfin library scan state could not be queried reliably from this workspace.
- The user only reported that one library scan finished and one is still running, so the exact library order remains unconfirmed.

## Implementation Notes

- Added `comfyui.port: 8189` to the laptop launcher config.
- Added `/start/comfyui`, `/stop/comfyui`, and `/wait/comfyui` to `launcher_daemon.py`.
- Extended `/status` with a ComfyUI section backed by the A1111 host process.
- Updated `docs/project-memory.md` to use `8189` and to describe ComfyUI as the `sd-webui-comfyui` extension.
- Added a new launcher note to project memory for future sessions.

## Follow-up

1. Verify `/start/comfyui` on the live laptop returns `already_running` or starts A1111 and opens `8189`.
2. Confirm the Jellyfin `Animated` library eventually shows nested content under `/mnt/media/private/Bilder/Porn/Animated`.
3. If Jellyfin still looks empty after scan completion, inspect the library root and scan target instead of the mount plumbing.
