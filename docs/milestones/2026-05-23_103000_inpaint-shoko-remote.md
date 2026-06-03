# Milestone: Inpaint, Shoko, and Remote Chat

**Date**: 2026-05-23 10:30 UTC

---

## Context

The user wanted the implementation rather than more planning: a usable inpaint workflow, Shoko readiness, and remote access to Oobabooga so the direct chat path is reachable outside the laptop.

---

## Decision

1. Add a loadable ComfyUI inpaint workflow export.
2. Wire Shoko into the portal and tool layer via environment-configured URLs.
3. Split Oobabooga into an explicit chat UI entry and an explicit API entry.

---

## Rationale

- Inpaint cleanup is a concrete production step and deserves its own workflow file.
- Shoko is useful as a Jellyfin sidecar, but should remain opt-in until a live URL exists.
- Users need both the chat UI and the API endpoint visible when they want less wrapping and fewer assistant constraints.

---

## Challenges

- Shoko still has no deployed service URL, so the implementation is readiness plumbing rather than a live link.
- ComfyUI inpaint needs a mask-aware graph, not just a plain txt2img prompt.
- The portal had to keep remote access obvious without hiding the API endpoint behind an ambiguous label.

---

## Implementation Notes

- Added `docs/comfyui-inpaint-workflow.json`.
- Added `VITE_SHOKO_URL` support in `src/config/portalTargets.js`.
- Split Oobabooga into `Oobabooga Chat` and `Oobabooga API` in the portal.
- Added the same Shoko entry to `vps-architecture/orchestrator/openwebui_tool.py` via `SHOKO_URL`.

---

## Follow-up Items

1. If Shoko gets deployed, set `VITE_SHOKO_URL` and `SHOKO_URL` to the real service URL.
2. Test the new ComfyUI workflow export in the browser and tweak node fields if ComfyUI wants different widget names.
