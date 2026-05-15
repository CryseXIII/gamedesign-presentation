# Phase 4 — WorldBuildingScene, CharacterSelect, GameState, FOMO Widow Encounter

**Date:** 2026-05-16  
**Commit:** `546c61f`

---

## Context

Phase 3 had delivered a working PlayerController with full animation state machine, 4 placeholder
scenes, and the hero spritesheet loaded. Three rendering/feel issues were open:

- Transparency artifacts (halo) on the hero sprite
- "Füße auf dem Kopf" — physics body foot placement incorrect
- Movement too slow (MOVE_SPEED 220)
- All scenes lacked worldbuilding / atmosphere

The narrative direction was already decided: Gameron — a dark fantasy world corrupted by Gacha Gal
demons. Scene 1 needed to establish the world and introduce the first dark-pattern lesson.

---

## Decisions & Rationale

### 1. `pixelArt: true` in Phaser config
Added `render: { pixelArt: true, antialias: false }` to GameEngine config.  
Reason: enables WebGL NEAREST-neighbor texture filtering, which removes the bilinear interpolation
halo/glow artifacts visible around the hero sprite edges on dark backgrounds.

### 2. MOVE_SPEED 220 → 380
The default felt sluggish in a wide scrolling world. 380 is still controllable but feels snappy.
JUMP_VEL unchanged at -570.

### 3. setOffset(45, 40) + SPAWN_Y_OFFSET 60
Changed body offset from (45, 34) to (45, 40) — shifts body 6px down relative to sprite, moving
the physics feet lower in the visual frame. Recalculated SPAWN_Y_OFFSET to 60:
  - body bottom relative to sprite.y = offset.y + bodyH − frameH/2 = 40 + 84 − 64 = 60
  - spawn sprite.y = H − FLOOR_H − 60

### 4. Capture-phase contextmenu listener in index.html
Added `document.addEventListener('contextmenu', ..., true)` before the app bundle loads.
Reason: Phaser's own contextmenu listener runs in bubble phase. A capture-phase listener fires
first and can call `e.stopImmediatePropagation()`, so Phaser never sees the right-click and the
browser context menu is suppressed only on the canvas element.

### 5. GameState singleton (`src/game/GameState.js`)
Simple plain-object singleton — not a class, to avoid import-order issues across scenes.
Tracks `gender` ('male'|'female') and `gachaScore` (incremented by `recordChoice('gacha')`).
`isGachaDemon()` returns true at score >= 5, which gates the bad ending.
`reset()` called by GameScreen on every new playthrough.

### 6. CharacterSelect replaces StartScreen as first screen
Two large DS3-style portrait cards side by side. Hover: amber glow. Click/Enter: locks choice,
dispatches `onStart(gender)` after 700ms (SFX plays during delay).
Keyboard: A/← and D/→ switch focus; Enter confirms.
Gamepad: axis/dpad switches focus; button[0] confirms.
Portrait area is a placeholder rectangle (no art yet) — will be replaced once assets are generated.

### 7. Asset manifest (`src/game/assets/manifest.js`)
Single file listing every game asset with `status: 'loaded' | 'missing'`.
PreloadScene reads this and only loads assets marked 'loaded'. Missing assets get
placeholder rects + "missing_id:<key>" text in scenes.
This decouples code from art delivery: dropping a PNG and flipping one status flag is all
that's needed to activate a new asset.

### 8. WorldBuildingScene as Scene 1 (replaces GameScene)
Width = W × 14. Four zones:
- Zone 1 (0→W×2): Burning village — ruined building silhouettes, fire + smoke particle emitters,
  invisible fire wall on the left edge blocks backtracking.
- Zone 2 (W×2→W×8): Steppe — three portrait stations with proximity-based alpha fade
  (male or female portrait set, driven by GameState.gender). Portraits missing for now → placeholders.
- Zone 3 (W×8→W×11): Storm — rain particle emitter activates when player enters zone;
  lightning flash on camera every 4-8 seconds.
- Zone 4 (W×11→W×14): FOMO Widow encounter — eerie purple glow, HP bar display,
  proximity trigger fires window event `game:encounterChoice` → React overlay.

### 9. Encounter system (FOMO Widow)
Phaser fires `game:encounterChoice { id, hp }` → GameScreen listener → `<EncounterOverlay>`.
Player chooses KÄMPFEN or DIAMANTEN ZAHLEN.
- Fight → records 'fight', widow fades out, game continues.
- Pay → shows `<GachaStoreOverlay>` first (parody diamond shop), then records 'gacha',
  dispatches `game:encounterDecision { decision: 'pay' }` back to WorldBuildingScene.
During active encounter `_player.halt()` is called; player.update() skipped.

### 10. GachaStoreOverlay — deliberate dark pattern parody
Fake countdown timer (15 min), "Best Value" badge on most expensive bundle, FOMO copy
("Only 3 players in your region have this!"), fake prices. Purpose: the player experiences
the actual emotional pressure of dark patterns in a safe fictional context. This IS the lesson.

---

## Implementation Notes

- Phaser particle API: `this.add.particles(x, y, undefined, config)` — no texture key for
  colored/blended particles; tint applied via config.
- Fire wall uses an invisible physics-static rectangle at x=10; player collider added against it
  in `update()` (called each frame — Phaser deduplicates colliders so no perf hit).
- Portrait fade: `Math.max(0, 1 - Math.abs(playerX - centerX) / fadeRadius) * 0.82` — max 82%
  opacity so character is still visible through portrait.
- WorldBuildingScene cleans up the `game:encounterDecision` listener in `shutdown()`.

---

## Challenges

- Phaser particle emitter without a texture key: using `undefined` as key with `tint` config
  works but produces rectangular particles. Good enough for fire/smoke placeholders until art.
- PlayerController fire-wall collider: calling `this.physics.add.collider` every frame is
  idempotent in Phaser 3 (existing body pair ignored). Safe.

---

## Follow-up Items

1. Generate portrait assets (male × 3, female × 3) for Zone 2 — copper engraving style
2. Generate scene backgrounds (village, steppe, storm, shrine) for all 4 zones
3. Generate FOMO Widow sprite (demonic anime succubus, lavender glow)
4. Generate fire / rain / thunder audio SFX for zones 1 & 3
5. Once any asset is ready: place in `public/assets/scenes/wb/`, update manifest status to
   'loaded', and it will auto-load via PreloadScene on next build
6. CharacterSelect portrait cards: replace emoji placeholder with real portrait images once
   generated (place in `public/assets/`, add to manifest, load in PreloadScene)
7. Implement actual fight combat in FOMO Widow encounter (player can hit widow with J; 4 hits
   = 25 dmg each = 100 HP defeated) — currently instant defeat
8. Verify SPAWN_Y_OFFSET=60 looks correct with the actual sprite sheet on screen
9. Consider adding zone ambient music (scene 1 fire crackle, scene 3 rain/thunder)
