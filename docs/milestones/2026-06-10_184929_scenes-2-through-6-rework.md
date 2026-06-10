# Scenes 2–6 Rework + Dev Spawn Selector

**Date:** 2026-06-10 18:49 UTC

## Context

Major rework requested across all scenes plus a dev-time scene spawn selector. 10 new ChatGPT images were provided and need to be imported, compressed, and wired into the appropriate scenes.

## Decisions

### Image import
- All 10 new images (1672×941 RGB) converted to JPEG at quality 80 → 67–157 KB each (was 2–2.7 MB)
- Waifu portraits already processed to 256px-tall transparent PNG in previous session
- Backgrounds stored as JPEG in scene-specific directories: `scenes/bs/`, `scenes/wq/`, `scenes/tm/`, `scenes/fw/`

### Dev scene spawn selector
- `PreloadScene.getDebugScene()` reads `?scene=<Key>` URL param or `localStorage['gameron:debugScene']`
- Valid keys: `WorldBuildingScene`, `PlayerGuidanceScene`, `BannerSirenScene`, `WhaleQueenScene`, `TaskmasterScene`, `FomoWidowScene`, `GalleryScene`, `CreditsScene`
- `GameScreen.jsx` renders a `<ScenePicker>` floating button (bottom-right) that sets localStorage and reloads with `?scene=X`
- Default launch: `?scene=PlayerGuidanceScene` for testing (set via URL)

### Scene 2 (PlayerGuidanceScene) — visual cleanup
- Removed all `_drawCurtain` calls — stone pillar/column geometry gone
- Replaced with `_drawDoorArch`: minimal dark gothic arch per platform, thin frame, `[E]` + roman numeral labels
- Platform physics unchanged (same PLAT_DEFS positions, invisible slabs)
- Door triggers repositioned to platform level (was floor level)
- Decoy yellow paint: now a proper paint-spill shape (ellipse + drip rects) placed on platform surface
- Round ≥2 arrows: now one arrow per wrong platform (not random single), pointing inward toward door
- Victory screen (`pgs_rdw_victory.jpg`) shown after 3rd correct door with waifu dialog layered on top → BannerSirenScene
- `_buildFinalGate` still exists but is no longer called (flow goes directly to victory screen)
- `_startDeathRattle` removed; dialog folded into `_showVictoryScreen`

### Scene 3 (BannerSirenScene) — backgrounds + loop
- 3 background regions: `bs_bg_top.jpg` (top room), `bs_bg_mid.jpg` (tiled TileSprite), `bs_bg_bot.jpg` (bottom room)
- Dark cover-rectangle hides the shaft hole until floor collapses
- Banner Siren positioned in top room at right side, fades out before floor drops
- `_midBg.tilePositionY` incremented in update during fall for parallax illusion
- Spike/hit/bottom flow unchanged from previous session

### Scene 4 (WhaleQueenScene) — full implementation
- `wq_bg.jpg` background, whale queen portrait at player scale
- Intro dialog (5 lines) → Phaser payment choice panel (click or E)
- Pay → `wq_defeat.jpg` full-screen 5 s → `GameState.recordChoice('gacha')` → queen dismissed → exit unlocked
- Refuse → `wq_victory.jpg` full-screen 5 s → queen dismissed → exit unlocked
- Physics exit gate blocks player until choice resolved
- Transition: → `TaskmasterScene`

### Scene 5 (TaskmasterScene) — full implementation
- `tm_bg.jpg` background, taskmaster portrait at player scale
- Three tasks tracked:
  - **Jump 3×** — keydown-SPACE/UP increments counter
  - **Run 3× full-width** — detects when player crosses within 12% of each edge, counts alternations
  - **Clipboard** — E near stand dispatches `game:showClipboard` → React `ClipboardOverlay`
- `ClipboardOverlay.jsx`: 3 tasks, task 3 locked until first two claimed, dispatches `game:clipboardResult { completedAll: true }`
- All done → `tm_victory.jpg` 5 s → death rattle dialog → transition → `FomoWidowScene`

### Scene 6 (FomoWidowScene) — full implementation
- `fw_bg.jpg` tiled horizontally over a world 6× the canvas width
- Camera follows player with horizontal scroll
- 5 video stations evenly spaced, each with pedestal visual, `[E]` to open, `[F]` fullscreen, `[C]` close
- Video station URLs defined as `VIDEO_STATIONS` constants at top of file
- Fomo Widow intro dialog (7 lines) → widow fades → player explores
- End zone at far right → widow reappears → final dialog → single-choice "Weils Spaß macht"
- Farewell dialog → fade → `CreditsScene`

### New React component
- `ClipboardOverlay.jsx`: clipboard-style task list with Claim buttons; last task locked until first two claimed; auto-closes on all claimed with `game:clipboardResult { completedAll: true }`

### New scenes registered
- `TaskmasterScene`, `FomoWidowScene` added to `GameEngine.js`

## Challenges

- Phaser TileSprite for corridor needs `fw_bg` loaded as `image` type (not spritesheet) — works via existing `otherAssets` loader
- WhaleQueenScene payment choice built in pure Phaser (not React) to avoid round-trip event complexity
- Clipboard E-key conflict with dialog: resolved by checking `_nearClipboard` flag and not being in dialog

## Follow-up

- Tune spike spawn rate and fall terminal velocity after browser test
- Scene 2: verify door-trigger height matches actual jump height on platforms — may need yOffBot adjustment
- FomoWidowScene: swap VIDEO_STATIONS URLs for actual game design content
- Credits scene: still uses old implementation; needs source scroll and "Thank you" end screen
- Female sprite variants for land/interact still missing
- Scene 2 `_buildFinalGate` (dead code) can be removed in future cleanup
