# Intro Camera Framing

## Context
The Scene 1 intro was still reading too tall in-browser: the opening stretch felt airy at the bottom, and the wide layout needed a tighter cinematic framing without breaking the horizontal walk.

## Decision
Keep the existing world layout, but tighten the camera framing with a small zoom-in, pixel rounding, and a follow deadzone. Also make the rain emitter follow camera Y so the storm overlay stays correct if the viewport shifts later.

## Rationale
- This is the smallest change that improves the feel without re-laying out every scene object.
- Zoom-in is enough to pull the player and floor visually closer to the bottom edge.
- A deadzone preserves the wide-scrolling feel while reducing vertical wobble.

## Challenges
- The scene is built around mixed world-space and camera-fixed layers, so any framing tweak has to avoid breaking the overlay and storm effects.
- Rain was only tracking camera X before this change.

## Implementation Notes
- Set `WorldBuildingScene` camera zoom to `1.08` and enabled round-pixel rendering.
- Added a follow deadzone sized from the viewport so the camera keeps the horizontal walk smooth.
- Updated the rain emitter to use both `cam.scrollX` and `cam.scrollY`.
- Verified the client build still passes with `vite build`.

## Follow-up
- Check the intro in a browser and decide whether the zoom should stay at `1.08` or be nudged again.
- Revisit the remaining brown/pink screenshot cleanup only if the new framing still leaves dead space.
