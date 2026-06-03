# Milestone: Remote Control and Diagram

**Date**: 2026-05-23 10:25 UTC

---

## Context

The user wanted remote control to work from outside the laptop, not just locally, and asked what functions are available. They also wanted a concrete ComfyUI JSON for multi-person images and a presentation-worthy architecture graphic.

---

## Decision

1. Point the Oobabooga portal link to a meaningful API endpoint instead of the GET-incompatible root.
2. Document the remote control surface in one place.
3. Add a ready-to-use ComfyUI prompt JSON for multi-person stills.
4. Add a presentation-style SVG architecture map.

---

## Rationale

- `http://100.109.133.95:5000/` is an API root and not a user-facing chat page.
- Remote control is already available through the portal, Open WebUI, the raw chat UI, and the orchestrator API.
- A reusable prompt JSON is more useful than an abstract description when the goal is to actually generate images.
- The architecture diagram should make the system understandable in one glance.

---

## Challenges

- The Oobabooga root path returns `Method Not Allowed`, so the link needed to target `/v1/models` instead.
- A ComfyUI JSON can be valid as an API prompt without being a full UI export, so the scope had to be explicit.
- The diagram had to stay readable while covering several layers of the stack.

---

## Implementation Notes

- `game-design-presentation/src/config/portalTargets.js` now points the Oobabooga link at `/v1/models`.
- `vps-architecture/orchestrator/openwebui_tool.py` now exposes the same meaningful endpoint.
- Added `docs/remote-control-map.md`.
- Added `docs/comfyui-multi-person-prompt.json`.
- Added `docs/architecture-map.svg`.

---

## Follow-up Items

1. If needed, turn the ComfyUI prompt JSON into a full editor-export workflow later.
2. Decide whether the raw chat UI should be surfaced even more strongly in the portal.
3. If the SVG is good enough, reuse it in presentation slides.
