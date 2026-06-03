# Vision Grid Pipeline

## Current behavior

The vision stack already does the requested high-context pass structure in `vps-architecture/orchestrator/orchestrator.py`.

It uses:
- one global full-image pass for overall composition
- overlapping detail crops from the original image
- synthesis that merges the global view and crop facts into one final analysis

## Why this matters

- The global view keeps the whole composition in context.
- The grid/detail crops preserve small face, hand, accessory, and background details.
- The synthesis step keeps the final prompt coherent instead of letting one crop dominate.

## Relevant code path

- `_build_detail_boxes()` chooses the crop layout.
- `_prepare_vision_passes()` runs the global pass and the detail passes.
- `_combined_analysis_prompt()` and `_synthesis_prompt()` merge the results.
- `POST /vision/analyze` now returns `vision_layout.detail_mode`, `vision_layout.detail_boxes`, and a global overview hint so clients can render or inspect the crop map.

## Practical interpretation

- The global view acts like the overview/minimap.
- The detail crops act like the grid cells.
- If you want a literal visual minimap overlay next, that would be a separate UI addition, not a blocker for the analysis pipeline itself.
