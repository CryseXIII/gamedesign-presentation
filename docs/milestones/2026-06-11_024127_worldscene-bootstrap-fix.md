## Context
After character select, the first game scene did not reliably appear on CT205. The browser route cleanup was already in place, so the failure looked like a Phaser bootstrap issue rather than stale `?scene=` state.

## Decision
Register all Phaser scenes directly in `GameEngine` config instead of waiting for `game.events.once('ready')` to add them later.

## Rationale
`PreloadScene` needs the target scene already registered before it calls `this.scene.start('WorldBuildingScene')`. Moving scene registration into the Phaser config removes any ready-event timing risk and makes the boot order deterministic.

## Challenges
- The route cleanup path was a red herring at first.
- The VPS build was already on the latest commit, so the issue had to be reproduced and traced in code.

## Implementation Notes
- Updated `src/game/GameEngine.js` to list `PreloadScene`, `WorldBuildingScene`, and the remaining scenes in `config.scene`.
- Removed the delayed `game.events.once('ready')` registration block.
- Verified the app still builds successfully with `npm run build`.

## Follow-Up
- Push the fix so CT205 can pull it via git-watcher.
- Re-test the character-select-to-world flow on the VPS after deployment.
