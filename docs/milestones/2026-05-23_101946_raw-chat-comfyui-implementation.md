# Milestone: Raw Chat and ComfyUI Playbook

**Date**: 2026-05-23 10:19 UTC

---

## Context

The user wanted a concrete ComfyUI node-graph approach for complex multi-person images, a practical path for a 3-second video test, and a clearer explanation of raw chat.

---

## Decision

1. Add a visible Raw Chat entry in the portal and Open WebUI tool menu.
2. Document a concrete ComfyUI production playbook for multi-person stills.
3. Define the first 3-second video test as a simple frame-budget workflow.

---

## Rationale

- Raw chat is best served by a direct local UI instead of more prompt wrapping.
- A single ComfyUI core graph with staged passes is the cleanest way to handle complex compositions.
- A small frame-based video test is the right starting point while the video extensions stay unstable.

---

## Challenges

- TemporalKit and depth-map are still not cleanly compatible with the current stack.
- There is no single "magic" graph for many-character scenes; the work has to be staged.
- Raw chat still depends on the user's choice of direct UI versus Open WebUI.

---

## Implementation Notes

- Added `src/config/portalTargets.js` raw-chat card.
- Added the same raw-chat link to `vps-architecture/orchestrator/openwebui_tool.py`.
- Added `docs/comfyui-production-playbook.md` with node-graph and 3-second video notes.

---

## Follow-up Items

1. If needed, turn the playbook into a reusable ComfyUI export later.
2. Decide whether the 3-second clip should use a patched TemporalKit pass or stay manual for now.
3. If the raw chat route feels right, make it the default "no-bitching" entry point in the portal copy.
