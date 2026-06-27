# Workbench Upload Analysis Copy Flow

## Context
The workbench had too many overlapping UI pieces: prompt snapshots, workflow notes, duplicate main-image views, repeated stamp buttons, and unclear inventory/status text. The main image upload also did not directly drive the prompt fields the way the workflow now needs.

## Decision
Make the main image upload the primary entry point, run it through the existing vision analyzer, and use that result to seed the Stable Diffusion, ChatGPT, and Gemini prompt fields. Remove the redundant snapshot/note clutter and add direct copy actions.

## Rationale
- Users should upload one main image and immediately get usable prompt drafts.
- Copying should happen per prompt and for the full job bundle with one click.
- The prompt cards should be descriptive and editable, not padded with unclear meta sections.
- The editor and output area should stay focused on the core image-edit flow.

## Challenges
- The workbench had to keep the existing backend flow intact while changing the UI structure.
- The editor color flow was already close, but erase/delete behavior needed cleanup so edit areas could actually stay in sync.
- Browser clipboard support is easiest for text bundles, not raw multi-image clipboard payloads.

## Implementation Notes
- Main image upload now runs `/vision/analyze` and fills the source/context/SD prompt fields from the returned analysis.
- Added copy buttons to the Stable Diffusion, ChatGPT, and Gemini prompt cards.
- Added a copy-bundle action that copies prompts plus image data URLs and crop metadata as JSON.
- Removed the prompt snapshot section and the workflow note block.
- Removed the duplicate main-image select panel.
- Moved the job log to the right column and let the gallery use the full output width.
- Added per-target delete buttons so edit areas can be removed cleanly after erasing.
- Fixed the editor color advance rule so only left-click paint strokes advance the palette.
- Tightened the dark input/select styling and added wrap behavior for long status text.
- Verified the app with `npm run build`.

## Follow-Up
- If you want a dedicated AI prompt template for a specific downstream tool, define it as a non-jailbreak image-editing brief and wire it into the same prompt bundle.
