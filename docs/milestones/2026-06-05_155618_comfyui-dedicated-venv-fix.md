# ComfyUI Dedicated Venv Fix

**Date:** 2026-06-05

## Context

`sd-webui-comfyui` stopped bringing up port `8189` even though A1111 and the portal still worked. The startup log showed repeated import failures in ComfyUI code paths that expected newer `torch`, `transformers`, and related APIs than the shared A1111 venv provided.

## Decision

1. Stop treating this as a circular dependency problem.
2. Isolate ComfyUI into its own `ComfyUI\venv` instead of borrowing A1111's runtime.
3. Install CUDA wheels there and keep A1111 on its working torch stack.

## Rationale

- The shared A1111 venv was pinned to `torch 2.0.1+cu118` and `transformers 4.30.2`.
- The bundled ComfyUI tree expected newer APIs such as `torch.nn.RMSNorm`, `torch.serialization.add_safe_globals`, `torch.float8_*`, and `Qwen2Tokenizer`.
- A dedicated venv keeps the two stacks independent and avoids breaking the already-working A1111 path.

## Challenges

- The first venv install resolved to a CPU-only torch build, which kept CUDA disabled.
- ComfyUI also hit a namespace collision on `utils.install_util` during startup.

## Implementation Notes

- Created `D:\Tools\StableDiffusion\webui\extensions\sd-webui-comfyui\ComfyUI\venv`.
- Reinstalled `torch 2.5.1+cu121`, `torchvision 0.20.1+cu121`, and `torchaudio 2.5.1+cu121` from the PyTorch CUDA 12.1 index.
- Installed the ComfyUI requirements into that venv.
- Added a preload step in `lib_comfyui/comfyui/pre_main.py` to force the local `utils` package into `sys.modules` before `main.py` runs.
- Verified the launcher now reports `ready: true` for `GET /wait/comfyui` and port `8189` is reachable again.

## Follow-up

1. Verify a real ComfyUI workflow/load in the browser, not just port reachability.
2. Watch the first image generation path for any remaining optional extension issues.
3. Decide whether to keep the earlier compatibility shims or trim them once the new venv is stable.
