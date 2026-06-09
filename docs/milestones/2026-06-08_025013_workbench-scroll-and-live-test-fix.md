# Workbench Scroll and Live Test Fix

## Context
The redesigned Image Workbench still had two live problems after rollout: the page was not reliably scrollable because the app root stayed fixed, and the edit-map export lost the stamped cutout background. A browser test also showed the generate request was still pointed at a LAN IP and that the app briefly mounted the portal route before the workbench, causing a mixed-content status request.

## Decision
Fix the workbench root as a real scroll container, render the cutout stamp into the saved edit-map image, switch the workbench default orchestrator URL to the public HTTPS route, and make `App` initialize from the current hash route instead of briefly mounting the portal.

## Rationale
- Scrollability is a hard requirement for this UI.
- The edit map must keep the stamped cutout visible behind the painted strokes.
- Browser access from the public portal must not hit LAN IPs or mixed-content paths.
- Direct hash navigation should render the correct screen immediately, without a portal flicker.

## Challenges
- The inpaint request itself was slow enough that the test script initially missed the response event.
- The browser test had to be made resilient to selector collisions in the new layout.
- The UI needed a visible model selector so the test could mimic a real user loading a checkpoint.

## Implementation Notes
- Set the workbench root to `height: 100dvh` with internal scrolling enabled.
- Saved the edit map by drawing the stamped cutout first and painting the strokes on top.
- Added a visible model control block with checkpoint selector, lock toggle, rescan, and sync actions.
- Changed the workbench default orchestrator URL to `https://sd-orchestrator.gamedesign.152.53.117.246.sslip.io`.
- Changed `App` to initialize from `readRoute()` immediately so `/workbench` no longer mounts the portal first.
- Ran a full browser flow with a JPEG from `Downloads`, model selection, cutout stamp, editor painting, banana prompt editing, generation, checkpoint cleanup, and response logging.

## Follow-Up
- Keep an eye on response latency for `POST /inpaint`.
- Consider a dedicated inspection panel for checkpoint manifests if manual review becomes common.
