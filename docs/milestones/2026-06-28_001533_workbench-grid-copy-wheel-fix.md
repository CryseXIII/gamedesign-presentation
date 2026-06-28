# Workbench Grid Copy Wheel Fix

## Context
The latest workbench pass still had a few usability regressions: the main input sat outside the main grid, the action buttons looked inconsistent across panels, the editor color advance felt unreliable, the cutout selector wheel still let the page scroll, and the prompt/image copy flow needed a clearer A-D pack.

## Decision
Move the main input into the main grid as the first panel, standardize action button sizing, make the editor color advance happen after completed paint strokes, block page scroll during cutout zoom, and add direct copy actions for the A-D image pack.

## Rationale
- The main upload should be the first thing inside the main grid flow.
- Button sizing needs to be visually stable across all workbench panels.
- Color advancement should happen on committed paint strokes, not on pointerdown, to avoid accidental skips.
- The cutout selector should behave like a local zoom surface, not a page scroll trap.
- ChatGPT/Gemini need clear A-D image ordering and copyable image payloads.

## Challenges
- The workbench had to preserve the current editor, checkpoint, and prompt-bundle flow while restructuring the grid.
- Copying actual images requires a clipboard fallback path when image clipboard support is missing.
- The main-image analysis endpoint needed a safer default and a fallback route.

## Implementation Notes
- Inserted the Main Input panel as the first panel inside `wbx-main-grid` and made it span both columns.
- Removed the old sample button from the main input block.
- Added Copy A/B/C/D buttons for the main image, crop snapshot, stamped cutout, and edit map.
- Added a rendered crop snapshot for Image B so the selector copy includes the crop context at original size.
- Extended the prompt bundle and job payload with A-D image pack explanations and per-target geometry.
- Moved color advancement in the editor to the completed paint stroke instead of pointerdown.
- Switched the cutout selector wheel to capture-wheel handling so the page does not scroll away from the zoom area.
- Standardized workbench button sizing with shared min-height/min-width rules.
- Added a safer main-image analysis URL fallback and kept the local fallback logic if analysis is unavailable.
- Verified the app with `npm run build`.

## Follow-Up
- Check the live browser after the push to confirm the A-D copy buttons, zoom capture, and main-image analysis endpoint work on the deployed host.
