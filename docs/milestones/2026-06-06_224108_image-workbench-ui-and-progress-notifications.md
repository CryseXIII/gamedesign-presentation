# Image Workbench UI And Progress Notifications

**Date:** 2026-06-06

## Context

The project needed more than a prompt note: it needed an actual place to inspect the excerpt, see the generated prompt, choose a model, define crop and mask targets, and approve or merge image results without interrupting long-running jobs.

## Decision

Add a dedicated `#/workbench` page inside the React app and wire it into the portal so the user can interact with the full image pipeline from one place.

## Rationale

- A single page is easier to understand than bouncing between several ad hoc tools.
- Model switching belongs in the same UI as crop/mask editing and approvals.
- Long-running image jobs need repeated progress updates without blocking the main process.

## Challenges

- The canvas interactions had to keep image coordinates stable while still allowing zoom and drag selection.
- The workflow had to remain usable even when the orchestrator inventory fetch fails.
- Progress mirroring should not stall the actual generation flow.

## Implementation Notes

- Added `#/workbench` with excerpt review, prompt draft, agent brief, base image upload, crop rectangle selection, cutout preview, edit map painting, grid mode, model selector, LoRA selection, checkpoint history, and approval/merge buttons.
- The workbench fetches live checkpoint and LoRA inventories from the orchestrator, but falls back to the known local model set if the inventory request fails.
- Added a notification webhook field and repeated progress log updates so a Telegram workflow can mirror status without interrupting the main job.

## Follow-up

1. Wire the webhook to the actual Telegram workflow once the n8n side is ready.
2. If the canvas editor needs finer control, add lasso and region-erase tools next.
