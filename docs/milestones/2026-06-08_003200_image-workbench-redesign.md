# Image Workbench Redesign

## Context
The prior workbench mixed base editing, cutout selection, masking, and grid mode behind tab buttons that did not match the desired workflow. The user wanted a fixed main workflow with drag/drop base loading, interactive cutout panning and rectangle selection, a dedicated stamp action, a separate edit-map editor, and grid mode isolated into its own tab.

## Decision
Rebuild the workbench around a four-panel main layout and move the grid workflow into a separate tab.

## Rationale
- The main flow needs to feel linear: base image -> cutout definition -> stamp -> cutout editor -> edit map.
- Grid mode is an alternate work style, not a general toggle in the main view.
- Checkpoints need to preserve the exact work state, so the UI must be able to export and restore the full package.

## Challenges
- The editor needed stroke-level undo/redo and whole-stroke erasure, not pixel-level erasing.
- The cutout viewport needed pan, zoom, right-drag rectangle drawing, and a minimap without external UI libraries.
- Checkpoint export/import needed to include images and metadata without adding persistence noise for unapproved generations.

## Implementation Notes
- Replaced the workbench with a new four-panel main layout.
- Added drag/drop base image loading and a zoomable/pannable cutout viewport with a minimap toggle.
- Added a FontAwesome stamp button that stamps the selected rectangle into the cutout preview.
- Added a modal cutout editor with color-by-stroke painting, right-click continuation, smart stroke erasure, undo/redo, and save/close flow.
- Added edit-target generation from unique editor colors.
- Added generation gallery, approval actions, checkpoint zip export, and checkpoint import/restore.
- Added a separate grid tab with its own cutout selection flow.

## Follow-Up
- Do a browser pass on the new workbench layout and the editor interaction model.
- Decide whether the output approval flow should visually replace the edit-map slot with the approved image after a checkpoint.
