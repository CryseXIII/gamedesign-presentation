# ComfyUI Manager Enabled

**Date:** 2026-06-05

## Context

A ComfyUI workflow reported missing custom nodes. The stack already had the Windows encoding fix, but Manager itself was not installed in the dedicated ComfyUI venv and the ComfyUI args did not enable it.

## Decision

1. Install `comfyui-manager` into the ComfyUI venv.
2. Add `--enable-manager` to the saved ComfyUI additional args.
3. Restart the launcher-controlled SD stack so ComfyUI boots with Manager enabled.

## Rationale

- The workflow error is about missing node packs, not about the checkpoint or torch stack.
- ComfyUI-Manager is the correct tool for discovering and installing missing custom nodes.
- The existing launcher already forwards the ComfyUI additional args setting, so that was the right place to store the flag.

## Challenges

- Manager was not installed yet, so the first step was the package installation in the dedicated ComfyUI venv.
- The stack needed a launcher-driven restart to pick up the new ComfyUI args and the new process environment.

## Implementation Notes

- Installed `comfyui-manager` into `D:\Tools\StableDiffusion\webui\extensions\sd-webui-comfyui\ComfyUI\venv`.
- Updated `D:\Tools\StableDiffusion\webui\config.json` to include `--enable-manager` in `comfyui_additional_args`.
- Restarted the launcher-controlled SD stack and verified ComfyUI came back reachable.
- The startup log shows `ComfyUI-Manager` loading successfully.

## Follow-up

1. Reload the workflow and install the specific missing node pack(s) if the workflow still names them.
2. If a later workflow still complains, capture the missing node names so the exact custom node repositories can be installed.
