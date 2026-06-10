# Intro Floor Clamp

## Context
The live intro still let the player sink below the floor during movement and dialog, so the route to the speedup waifu and the right-side exit remained unreliable even after the earlier safety-floor pass.

## Decision
Add a hard vertical clamp in `WorldBuildingScene`, freeze both X and Y during encounter pauses, and raise the speed boost multiplier so the WASD walk feels noticeably faster once the reward is unlocked.

## Rationale
- A physics-only fix was not enough in the live build.
- Clamping the intro floor is a direct fallback that keeps the scene playable even if Arcade Physics tunneling occurs.
- Freezing Y during overlay pauses prevents the player from drifting downward while the UI is open.

## Challenges
- The scene already mixes camera zoom, overlay events, and several world-space entities.
- The published VPS bundle had to be updated again so the fix would actually reach the browser.

## Implementation Notes
- Added a per-frame ground clamp in `WorldBuildingScene.update()`.
- Extended `PlayerController.halt()` to stop both axes, not only X.
- Increased the unlocked move speed multiplier to make the speedup reward more tangible.
- Rebuilt and republished the app.

## Follow-up
- Verify in-browser that the player now stays on the floor and can reach the succubus plus the right-side exit.
- If load time still feels heavy, compress the remaining large intro background assets next.
