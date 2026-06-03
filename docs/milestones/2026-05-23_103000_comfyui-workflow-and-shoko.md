# Milestone: ComfyUI Workflow and Shoko

**Date**: 2026-05-23 10:30 UTC

---

## Context

The user wanted the actual loadable ComfyUI workflow file, not just the API prompt payload, and also wanted Shoko included in the media stack.

---

## Decision

1. Add a loadable ComfyUI workflow export for multi-person stills.
2. Keep the API prompt payload as a separate helper file.
3. Add Shoko as a visible planned sidecar for Jellyfin in the portal and docs.

---

## Rationale

- The workflow export is the usable artifact for ComfyUI drag-and-drop and visual editing.
- Separating the raw API prompt from the workflow export avoids confusion.
- Shoko fits the stack as an anime metadata layer, not as a replacement for Jellyfin.

---

## Challenges

- ComfyUI workflow export structure is stricter than a plain API prompt.
- Shoko is not deployed yet, so it had to be represented as planned rather than linked.

---

## Implementation Notes

- Added `docs/comfyui-multi-person-workflow.json`.
- Updated `docs/comfyui-production-playbook.md` to point at the loadable export.
- Added a Shoko placeholder item in the portal media section.

---

## Follow-up Items

1. If the workflow import needs adjustment, tune the node export shape after a ComfyUI drag-drop test.
2. Decide where Shoko will run and what URL it should get once provisioned.
