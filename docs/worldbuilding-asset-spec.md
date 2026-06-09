# WorldBuilding Asset Spec

Last updated: 2026-05-16 23:26:52 +02:00

This file is the canonical generation spec for Scene 1 assets after the compressed layout update.

## Global Art Direction

- Pixel art, hard edges, no blur, no antialiasing
- Dark gothic fantasy mood
- Palette base: black, ash gray, worn brown leather
- Accent colors only: amber/orange (fire), violet/purple (gacha corruption), blue-silver (storm)
- Transparent background for character/sprite assets

## A) Main Character Sprite Sheet (new)

- Target file: `public/assets/dark_fantasy_hero_sprite_sheet.png`
- Canvas: 1024 x 1536 px
- Grid: 8 columns x 12 rows
- Cell: 128 x 128 px
- Facing direction: right
- Background: transparent
- Character: worn armored warrior, gritty silhouette, no cartoon look

Frame layout required by current animation config:

- Row 1 col 1-5: `idle`
- Row 2 col 1-8: `run`
- Row 3 col 3-4: `jumpRise`, col 6: `fall`, col 7-8: `land`
- Row 4 col 3-6: `doubleJump`
- Row 5 col 1-3: `light1`, col 4-6: `light2`
- Row 6 col 1-3: `light3`, col 4-6: `heavy`
- Row 8 col 1-2: `airLight`, col 5-6: `downSlash`
- Row 9 col 1-4: `hitHeavy`
- Row 10 col 2-6: `ladderClimb`
- Row 11 col 1: `interact`, col 3: `death`, col 4: `respawn`, col 5-8: `fomoChains`

## A2) Main Character Run Strip (replacement)

- Target file: `public/assets/gm_main_male_run.png`
- Canvas: 1774 x 887 px
- Layout: 2-frame horizontal strip
- Frame: 887 x 887 px each
- Background: chroma-key green, converted to transparency at preload
- Output: trimmed to 64 x 64 frames at preload, then displayed scaled in-game
- Purpose: replace only the `run` animation first; keep the other legacy hero-sheet animations until they are split out later

## B) CharacterSelect Portraits

- `public/assets/charsel_portrait_male.png`
- `public/assets/charsel_portrait_female.png`
- Size: 400 x 600 px
- Transparent background
- Same armor language as hero sheet
- Male/female must feel equally battle-worn and severe

## C) World backgrounds (compressed scene)

1) `public/assets/scenes/wb/bg_intro.png`
- Key: `wb_bg_intro`
- Size: 2172 x 724 px
- Wide intro backdrop for the first three-screen stretch

2) `public/assets/scenes/wb/bg_steppe.png`
- Key: `wb_bg_steppe`
- Size: 1920 x 900 px
- Open dead steppe toward storm horizon
- This background now covers both steppe and widow side of Scene 1

## D) Backstory portraits (gender specific)

- Files:
  - `public/assets/scenes/wb/portrait_male_1.png`
  - `public/assets/scenes/wb/portrait_male_2.png`
  - `public/assets/scenes/wb/portrait_male_3.png`
  - `public/assets/scenes/wb/portrait_female_1.png`
  - `public/assets/scenes/wb/portrait_female_2.png`
  - `public/assets/scenes/wb/portrait_female_3.png`
- Size: 512 x 768 px
- Style: copper-sepia engraved relief look

Story beats per gender:
- #1 before collapse (calm tension)
- #2 village loss (grief)
- #3 oath (cold resolve)

## E) FOMO Widow sprite

- File: `public/assets/scenes/wb/fomo_widow.png`
- Key: `wb_fomo_widow`
- Size: 160 x 280 px
- Transparent background
- Tall predatory silhouette, violet-black robes, corrupted merchant/succubus vibe
- Include subtle floating greed motifs (gem/coin glyphs), but keep readability clean in gameplay

## F) Audio

- `public/assets/scenes/wb/fire_sfx.mp3` (looping crackle/embers)
- `public/assets/scenes/wb/rain_sfx.mp3` (looping rain + distant thunder)
- `public/assets/scenes/wb/widow_music.mp3` (encounter tension cue)

## Integration checklist

1. Put files in exact paths above
2. Set matching entries in `src/game/assets/manifest.js` to `status: 'loaded'`
3. Build: `npm run build`
4. Push to `main` for auto-deploy on gd-prod
