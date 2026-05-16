# Asset Import, CharacterSelect Portraits, CreditsScene Ending Branch

Date: 2026-05-17
Related commits: this session (follows 095e85a, f9e35c8, 0375d61)

## Context

Following the WorldBuildingScene compression and documentation handoff, new assets were generated externally and dropped into `public/assets/`. This session wires all of them into the game correctly, updates CharacterSelect to use real portrait images, wires the good/bad ending into CreditsScene, and cleans up the manifest.

## Decision

### 1. Asset file organization
Move all WorldBuildingScene assets from the flat `public/assets/` root into `public/assets/scenes/wb/` as per the spec. The manifest paths already pointed to the subdirectory, so moving the files (not changing manifest paths) was the correct resolution.

### 2. Female portrait auto-crop
The generated female CharacterSelect portrait was landscape (1536×1024) despite the spec requiring portrait orientation. Rather than discard it, the center 768×1024 strip was extracted (a 3:4 crop centered on X). The original is preserved as `charsel_portrait_female.original.png`. If the content is off-center, a re-generation or manual crop is needed.

### 3. FOMO Widow rename
The generated widow sprite was named `gm_enemy_fomo_widow.png` (GameScene naming prefix). Renamed/moved to `scenes/wb/fomo_widow.png` to match the manifest key `wb_fomo_widow`. Phaser scales it via `setDisplaySize(160, 280)` so original dimensions (1024×1536) are irrelevant at runtime.

### 4. manifest.js cleanup
- Removed legacy `wb_bg_storm` and `wb_bg_widow` (no longer referenced in compressed scene)
- Set all present wb_ image assets to `status: 'loaded'`
- Added `charsel_portrait_male` and `charsel_portrait_female` as manifest entries (type: image, key: null — these are React/CSS assets, not loaded by Phaser)
- Added `gm_bg_training_arena` and `gm_enemy_autoplay_lady` as `status: 'loaded'` future GameScene assets

### 5. CharacterSelect portraits
Replaced the `⚔` emoji placeholder with real `<img>` tags. Added `imgFailed` state per gender — if the image fails to load (404 or decode error), the sword placeholder is shown as fallback. Portrait path stored per card object.

### 6. CreditsScene ending branch
Split the static `CREDITS` array into:
- `CREDITS_BASE` — shared across all playthroughs
- `ENDING_GOOD` — "DU HAST WIDERSTANDEN — und die Lektion verstanden." (amber color)
- `ENDING_BAD`  — "DU BIST GEFALLEN — und wurdest, was du bekämpfst." + live Gacha-Score readout (red)

In `create()`, `GameState.isGachaDemon()` is evaluated at scene-start time (when the player actually reaches credits). Bad ending threshold: `gachaScore >= 5`.

### 7. animConfig unchanged
New hero sprite sheet dimensions (1024×1536, 8×12 grid, 128×128 frame) match spec exactly. No animation config changes needed.

## Rationale

- Keeping manifest as single source of truth makes future asset swaps a one-line status change
- `onError` fallback ensures CharacterSelect never breaks if an asset is missing or incorrectly named
- Splitting credits into base + ending makes the branching logic explicit and testable
- Auto-cropping the landscape female portrait salvages the asset rather than blocking the session on a re-generation
- Preserving the original as `.original.png` allows easy comparison and re-export if needed

## Challenges

- Female portrait was landscape (1536×1024) — auto-cropped center 768×1024; visual result unknown until tested
- `gm_enemy_fomo_widow.png` naming used a GameScene prefix despite being a WorldBuilding asset — renamed during organization

## Implementation notes

Files changed:
- `public/assets/charsel_portrait_female.png` — replaced with center-cropped portrait version
- `public/assets/charsel_portrait_female.original.png` — backup of original landscape image
- `public/assets/scenes/wb/` — created; all wb_ PNGs moved here
- `src/game/assets/manifest.js` — full rewrite: legacy keys removed, all loaded assets marked
- `src/components/CharacterSelect.jsx` — imgFailed state + real img tags with onError fallback
- `src/game/scenes/CreditsScene.js` — CREDITS split to base+endings; GameState import; dynamic ending

## Follow-up items

1. Test female portrait crop visually on gd-prod — re-generate if character is off-center
2. Generate and place audio assets: `wb_fire_sfx`, `wb_rain_sfx`, `wb_widow_music`
3. Wire `gm_bg_training_arena` + `gm_enemy_autoplay_lady` into GameScene
4. Verify gd-prod visual pacing with all WorldBuilding assets active
5. Wire gd-test and gd-build containers into deployment workflow
6. Buy/attach domain `crysiscreations.de`
