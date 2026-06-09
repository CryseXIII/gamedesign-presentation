# Run Strip Chroma-Key Swap

## Context
The old `dark_fantasy_hero_sprite_sheet.png` is still the main hero source, but a new `gm_main_male_run.png` sheet is now present in `public/assets/`. The goal was to swap only the run animation first, keep the other legacy hero animations intact, and make the green background transparent in-game.

## Decision
Wire the run animation to the new two-frame strip, preprocess its chroma-key green background into transparency during preload, and keep the legacy hero sheet for idle, jump, attack, and utility states for now.

## Rationale
- This lets the new asset appear in the browser immediately without waiting for every other animation to be regenerated.
- A separate run strip is easier to phase in step by step than a full-sheet replacement.
- The sprite must render with transparent green removal or the new sheet will show its key color in-game.

## Challenges
- The new strip uses a much larger source canvas than the legacy 128×128 frames, so the sprite display size had to be kept stable.
- The game needs the processed texture ready before animation registration starts.

## Implementation Notes
- Added `gm_main_male_run.png` to the asset manifest as the new run-strip replacement.
- Loaded the raw image in `PreloadScene`, converted the top-left chroma color to alpha on a canvas, then built a spritesheet texture from the transparent canvas.
- Swapped only the `run` animation in `animConfig.js` to use the new texture key.
- Forced the player sprite display to 128×128 so the new sheet does not change the visible size of the hero.
- Updated the worldbuilding asset spec to document the run-strip replacement.

## Follow-Up
- Preview the new run animation in the browser and confirm the transparency looks clean.
- Replace the remaining legacy hero animations one by one when their new sheet assets are ready.
