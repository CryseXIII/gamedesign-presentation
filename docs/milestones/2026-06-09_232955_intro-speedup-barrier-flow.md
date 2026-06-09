# Intro Speedup Barrier Flow

## Context
The first Scene 1 stretch now needs a broader opening backdrop, a talkable speedup succubus, and a time-barrier gate that can be broken with the new diamond power.

## Decision
Rename the new wide opening image to `wb_bg_intro`, wire it into Scene 1, add a blue succubus encounter that unlocks a K-button barrier power, and model the barrier as a calculated graphic with a countdown and reappear cycle.

## Rationale
- The opening area should feel broader and more readable than the old village backdrop.
- The speedup reward needs to be visible in-browser immediately, not buried behind later content.
- A calculated barrier keeps the effect lightweight and easy to tune without waiting on new art.

## Challenges
- The new backdrop had to stay unwarped while still fitting the opening stretch.
- The barrier needs both a natural 01:00 cycle and a 5-second hidden window after manual or automatic release.
- `K` already exists as the heavy-attack key, so the new power had to be scoped to the intro barrier flow instead of replacing the whole combat system.

## Implementation Notes
- Copied `ChatGPT Image Jun 10, 2026, 12_51_04 AM.png` into `public/assets/scenes/wb/bg_intro.png`.
- Renamed the manifest entry from `wb_bg_village` to `wb_bg_intro`.
- Added a Speedup Succubus encounter variant in the React overlay.
- Stored `speedBoostUnlocked` in `GameState`.
- Built the succubus, diamond burst, and time-barrier logic directly in `WorldBuildingScene`.
- Tested a quick lossless PNG re-save pass, then restored the originals because several files grew instead of shrinking.

## Follow-Up
- Verify the intro section in the browser and tune the succubus / barrier positions if the pacing feels off.
- Decide whether the remaining non-exception PNGs should get a real lossless optimizer pass instead of a plain resave.
