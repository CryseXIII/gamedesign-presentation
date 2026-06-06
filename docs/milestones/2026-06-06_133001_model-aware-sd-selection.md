# Model Aware SD Selection

**Date:** 2026-06-06

## Context

The SD generation path was still effectively treating Pony as the only baseline, but the live node now exposes multiple checkpoints and the set will grow over time.

## Decision

Make checkpoint choice explicit but optional in the SillyTavern extension and document the current model inventory.

## Rationale

- The orchestrator already supports `preferred_model_title` and can auto-select when it is omitted.
- A free-text model field is more future-proof than a hardcoded list.
- The current model set is small now, but motion/video checkpoints are expected later.

## Challenges

- The extension had a hardcoded model title baked into the SD request.
- Older docs still implied a single model baseline.

## Implementation Notes

- Added an optional `Preferred Model` field to the SillyTavern scene-image-action panel.
- If the field is blank, the extension sends no `preferred_model_title` and lets the orchestrator choose.
- Added a checkpoint inventory doc and updated the ComfyUI playbook.

## Follow-up

1. If new checkpoints are added, append them to `docs/comfyui-checkpoints.md`.
2. If a future workflow needs a pinned model, set it in the panel instead of hardcoding it.
