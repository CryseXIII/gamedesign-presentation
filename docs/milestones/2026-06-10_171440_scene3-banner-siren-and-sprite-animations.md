# Scene 3 Banner Siren + Sprite Animations + Asset Import

**Date:** 2026-06-10 17:14 UTC

## Context

Scene 2 was visually cluttered. Seven new ChatGPT images were provided for waifu NPCs and player sprite animations. Scene 3 was fully designed (Banner Siren floor-collapse + spike fall shaft) and scenes 4–6 were planned.

## Decisions

### Asset import pipeline
- Used Python/Pillow for all processing (no ImageMagick available)
- **Waifu portraits** (Whale Queen, Banner Siren, Fomo Widow new version, Taskmaster): resized to 256px height, preserving aspect ratio (~171×256), saved as RGBA PNG
- **Sprite animations** (jump, land, interact): split from wide strips, per-frame white/green background removal, auto-trim alpha, centered on 64×64 transparent square, reassembled into horizontal spritesheets
- Sprite frame counts detected from strip aspect ratios: jump=2 (1774×887), land=3 (2172×724), interact=3 (2172×724)
- Fomo widow replaced in-place at `/assets/scenes/wb/fomo_widow.png`

### New asset paths
```
public/assets/characters/male/jump.png      — 2-frame strip
public/assets/characters/male/land.png      — 3-frame strip
public/assets/characters/male/interact.png  — 3-frame strip
public/assets/scenes/bs/banner_siren.png    — 171×256 portrait
public/assets/scenes/wq/whale_queen.png     — 171×256 portrait
public/assets/scenes/tm/taskmaster.png      — 171×256 portrait
public/assets/scenes/wb/fomo_widow.png      — 171×256 portrait (replaced)
```

### Waifu display scale
All waifus now render at ≈160px height in scenes, matching player scale (128×128 display). Changed from H×0.58 (≈445px) to 160px fixed. This was the core visual mess fix requested.

### New player states
- `land` (3 frames, plays once on touchdown from jump/double_jump)
- `interact` (3 frames, plays once on K press before diamond/burst)
- Both states added to `PLAYER_STATE_DEFS` in `animConfig.js`
- PlayerController: added LAND and INTERACT to S enum, `triggerInteract()` public method, landing detection in update loop, movement blocked during INTERACT
- K key handlers in WorldBuildingScene and PlayerGuidanceScene now call `player.triggerInteract()` before their respective effects

### Scene flow change
- PlayerGuidanceScene `_startDeathRattle` now transitions to `BannerSirenScene` instead of `GalleryScene`

### BannerSirenScene (Scene 3) — new file
Key design:
- Flat starting platform, Banner Siren dialog (5 lines)
- `cameras.main.shake(900, 0.014)` warning, then floor tiles tween/fall
- Player enters free fall (gravity 600, terminal velocity 280 px/s)
- Camera follows player down a 5000px deep shaft
- Spike waves every 2.2s, up to 3 simultaneous, spawn below camera view, move upward at 190 px/s
- Spike hitboxes reduced by 8×10px from visual (no pixel-perfect)
- Spike hit → camera flash red → player teleport to top of camera view, velocity reset
- Fall time max ~20s enforced by `SHAFT_DEPTH=5000` + terminal velocity cap
- Bottom detection at `SHAFT_DEPTH + H/2 - 120` OR after 22s timer
- Bottom: Banner Siren reappears (4-line gloat dialog), then transitions to WhaleQueenScene
- Shutdown restores `physics.world.gravity.y = 800`

### WhaleQueenScene (Scene 4) — stub
- Shows whale_queen portrait at player scale
- Auto-advances to GalleryScene after 3.5s
- Placeholder for full encounter

### Scenes 5/6 (Taskmaster, FomoWidow)
- Not created yet (taskmaster/fomo assets are imported, scenes TBD)

## Rationale

- Pillow chosen over ImageMagick (not installed)
- 256px source height for waifus: 2× the 128px render target → good quality without huge files (76–102 KB each)
- Shaft width = full canvas width (no scroll) to keep the dodge mechanic readable
- Non-pixel-perfect hitboxes mandated by user design spec
- Gravity override (600) lower than global (800) to allow more reaction time

## Challenges

- Pillow background removal is heuristic (corner pixel + white + green check); may not be perfect for all sprite sheets
- The `_widowSprite` in WorldBuildingScene is referenced but never assigned (pre-existing situation, widow encounter is reserved for scene 6)
- Female gender sprite sheets for land/interact are placeholders; only male has actual PNGs

## Follow-up

- Implement full WhaleQueen encounter (scene 4)
- Build TaskmasterScene (scene 5) and FomoWidowScene (scene 6) replacing the current stubs
- FomoWidow scene should use existing encounter overlay system (gachaScore)
- Verify spike dodge feel in browser — may need to tune SPIKE_SPEED / SPIKE_INTERVAL / wave count
- Female sprite animations (land, interact, jump) not yet provided
- Taskmaster asset is imported but not yet wired into a scene
