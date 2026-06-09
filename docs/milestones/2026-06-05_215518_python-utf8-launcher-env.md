# Python UTF-8 Launcher Env

**Date:** 2026-06-05

## Context

ComfyUI on Windows was still inheriting the default console encoding path when launched from the A1111 stack. The logger fix removed the hard crash, but setting UTF-8 at process start is a cleaner second layer.

## Decision

1. Set `PYTHONUTF8=1` in `webui-user.bat`.
2. Also set `PYTHONIOENCODING=utf-8` so child Python processes inherit a UTF-8 console mode as early as possible.

## Rationale

- The ComfyUI extension runs under the same launcher tree as A1111.
- Early UTF-8 mode reduces the chance that any subprocess or progress output falls back to `cp1252`.
- The logger patch is still needed, but the launcher env makes the whole stack more robust.

## Challenges

- This is a Windows launcher concern rather than an application bug, so it had to be set at the start of the process tree.

## Implementation Notes

- Added the env vars to `D:\Tools\StableDiffusion\webui\webui-user.bat`.
- No code path change inside ComfyUI itself was needed for this part.

## Follow-up

1. Restart the A1111/ComfyUI stack so the new environment is inherited.
2. Re-run the same workflow and confirm progress output no longer trips on Windows encoding.
