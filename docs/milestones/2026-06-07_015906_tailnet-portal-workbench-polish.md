# 2026-06-07 — Tailnet Portal Links + Workbench Polish

## Context

The tailnet-only tools needed to stay usable from inside the VPN without leaking into the public portal, and the Image Workbench still felt like the Gameron theme and could not scroll cleanly on longer layouts.

## Decision

Keep A1111, ComfyUI, and Vision Portal gated to tailnet/private hosts only, add a visible Vision entry in the portal, and restyle the Workbench into a cooler utility view with normal scrolling.

## Rationale

- Public visitors should not get a path to the image tools.
- Tailnet users should have direct one-click access to Vision, A1111, and ComfyUI from the portal.
- The Workbench should read like an operator UI, not the main game skin.

## Challenges

- The same React bundle serves both public and tailnet portal hosts, so host-based gating has to happen in the frontend.
- The Workbench layout contains many nested panels with their own scroll regions, so the outer shell also has to allow page scrolling.

## Implementation Notes

- `src/config/portalTargets.js` now treats vision, A1111, and ComfyUI as tailnet-only links and adds a dedicated Vision Portal entry inside the portal services.
- `src/styles/workbench.css` now uses a slate/blue theme, removes the Gameron gold palette from the Workbench, and enables full-page scrolling with `min-height: 100dvh` and `overflow: auto`.
- `vite build` completed successfully after the changes.
- The live production container on CT205 was rebuilt and restarted after the source update.

## Follow-Up Items

1. If the next git-watcher cycle runs before these edits are committed, push the same source changes to GitHub so prod keeps them.
2. Re-open the portal from a Tailscale client and confirm the new Vision entry is present.
3. Re-open the Workbench and check that the page scrolls cleanly on a long display.
