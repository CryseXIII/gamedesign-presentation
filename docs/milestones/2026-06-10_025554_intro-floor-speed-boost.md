# Intro Floor Speed Boost

## Context
The intro still had two practical problems: the player could visually/physically slip past the floor on the live site, and the speedup reward did not yet change traversal speed enough to make the next screen feel reachable.

## Decision
Add an invisible safety floor under the visible intro floor, spawn the player slightly higher, and make the unlocked speed boost increase horizontal movement speed. Also shrink the speedup waifu asset again to reduce first-load weight.

## Rationale
- The intro needs to be playable before it can be tuned.
- A safety collider is the smallest reliable fix for floor tunneling.
- The speedup reward should have a visible gameplay payoff, not just a dialog state.
- Smaller art means less waiting before the scene becomes interactive.

## Challenges
- The scene already mixes visible floor, world bounds, camera zoom, and several interactive overlays.
- The speed boost had been stored in `GameState` but was not yet affecting locomotion.

## Implementation Notes
- Added an invisible safety floor below the intro floor in `WorldBuildingScene` and wired the player collider to it.
- Spawned the player a bit higher so the body settles onto the ground instead of starting flush with it.
- Made `GameState.speedBoostUnlocked` multiply horizontal move speed in `PlayerController`.
- Resized `wb_speedup_succubus.png` from `640x640` to `512x512`.

## Follow-up
- Verify in-browser that the player can reach the speedup waifu and continue to the next screen with WASD.
- Watch the intro load time again after the smaller asset and decide whether the remaining portrait/background PNGs also need compression.
