# Workbench Scroll and ST Preset Refresh

**Date:** 2026-06-07

## Context

The image workbench still could not be scrolled to its lower panels, and CT215 SillyTavern had drifted back to a `mars.chub.ai` custom preset instead of the intended local Oobabooga/Mythomax backend.

## Decision

Make the workbench viewport-constrained again, widen the workspace, and restore the live ST preset to the local roleplay backend.

## Rationale

- `overflow:auto` only works when the container has a hard height.
- The workbench needed to feel like a single wide editor surface, not a narrow card stack.
- CT215 should default to the local Mythomax route; remote backends remain an option, but not the default preset.

## Challenges

- The live ST `settings.json` used a nested preset block, not a single top-level key.
- The `custom_model` value uses a backslash-delimited model path, so the JSON escape had to stay valid.
- Rachel's chat folder already matched the newest backup, so there was nothing to refresh there beyond confirming the state.

## Implementation Notes

- Updated `src/styles/workbench.css` so the outer workbench screen is viewport-height, scrollable, and wider.
- Updated `vps-architecture/orchestrator/orchestrator.py` to stop preferring stale DreamShaper checkpoints ahead of the installed models.
- Rewrote the live CT215 ST preset from `mars.chub.ai` back to `http://100.109.133.95:5000/v1` and `mythomax-l2-13b\u005cmythomax-l2-13b.Q5_K_M.gguf`.

## Follow-up

1. Push the rebuilt frontend bundle so the workbench fix is visible in production.
2. Keep an eye on CT215 after the preset reset in case SillyTavern rewrites the block again.
