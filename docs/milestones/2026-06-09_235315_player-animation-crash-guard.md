# Player Animation Crash Guard

## Context
The live VPS build was hanging on the full loading bar. The browser console showed missing `player_male_*` textures and a `sprite.play` crash during `PlayerController` startup.

## Decision
Wrap the player animation startup in a safe fallback so a missing or stale animation does not stop the whole scene from booting.

## Rationale
- A bad animation key should not block the entire game.
- The loader already does enough work during preload; the player should degrade to a static frame if animation playback fails.
- This keeps CT205 usable even while the player sheet rollout is still incomplete.

## Challenges
- The runtime failure appeared only after preload completed, so the loading bar looked healthy even though the scene crashed on boot.
- The browser console showed both missing texture warnings and a `currentFrame` error, so the fix needed to be defensive rather than narrowly tied to one missing asset.

## Implementation Notes
- Added a `_playAnimationSafely()` helper in `PlayerController`.
- Constructor now falls back to `setFrame(0)` instead of unconditionally calling `play()`.
- `_setState()` now uses the safe helper and falls back to idle instead of throwing.
- Verified the code still builds with `npm run build`.

## Follow-Up
- Re-test CT205 after the next git-watcher cycle.
- If the console still shows missing `player_male_*` textures, inspect the placeholder texture builder next.
