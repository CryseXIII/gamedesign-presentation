/**
 * Animation configuration for the Gameron hero.
 *
 * Legacy sheet:
 *   File:   /assets/dark_fantasy_hero_sprite_sheet.png
 *   Size:   1024 × 1536 px
 *   Grid:   8 columns × 12 rows
 *   Frame:  128 × 128 px each
 *   Facing: right (flip X for left movement)
 *
 * Run strip:
 *   File:   /assets/gm_main_male_run.png
 *   Size:   1774 × 887 px
 *   Frames: 2-frame horizontal strip
 *   Background: chroma-key green, removed at preload
 *
 * Frame index formula for the legacy sheet: (row - 1) * 8 + (col - 1) [0-based]
 */

export const HERO_ATLAS = {
  key:    'hero',
  path:   '/assets/dark_fantasy_hero_sprite_sheet.png',
  frameW: 128,
  frameH: 128,
}

export const RUN_ATLAS = {
  key:        'gm_main_male_run',
  sourceKey:  'gm_main_male_run_source',
  canvasKey:  'gm_main_male_run_canvas',
  path:       '/assets/gm_main_male_run.png',
  frameW:     64,
  frameH:     64,
  frameCount: 2,
}

/**
 * Returns an array of 0-based frame indices for a contiguous range.
 * @param {number} row  1-based row
 * @param {number} c1   1-based first column (inclusive)
 * @param {number} c2   1-based last column  (inclusive)
 */
function fr(row, c1, c2) {
  const out = []
  for (let c = c1; c <= c2; c++) {
    out.push((row - 1) * 8 + (c - 1))
  }
  return out
}

export const HERO_ANIMS = [
  // ── Movement ──────────────────────────────────────────────────────────────
  { key: 'idle',        frames: fr(1,  1, 5), frameRate:  8, repeat: -1 },
  { key: 'run',         textureKey: RUN_ATLAS.key, frames: [0, 1], frameRate: 12, repeat: -1 },

  // ── Jumping ───────────────────────────────────────────────────────────────
  { key: 'jumpRise',    frames: fr(3,  3, 4), frameRate: 10, repeat:  0 },
  { key: 'fall',        frames: fr(3,  6, 6), frameRate:  8, repeat: -1 },
  { key: 'land',        frames: fr(3,  7, 8), frameRate: 12, repeat:  0 },
  { key: 'doubleJump',  frames: fr(4,  3, 6), frameRate: 12, repeat:  0 },

  // ── Light attack combo (3-hit chain) ──────────────────────────────────────
  { key: 'light1',      frames: fr(5,  1, 3), frameRate: 12, repeat:  0 },
  { key: 'light2',      frames: fr(5,  4, 6), frameRate: 12, repeat:  0 },
  { key: 'light3',      frames: fr(6,  1, 3), frameRate: 12, repeat:  0 },

  // ── Heavy attack ──────────────────────────────────────────────────────────
  { key: 'heavy',       frames: fr(6,  4, 6), frameRate: 10, repeat:  0 },

  // ── Aerial attacks ────────────────────────────────────────────────────────
  { key: 'airLight',    frames: fr(8,  1, 2), frameRate: 12, repeat:  0 },
  { key: 'downSlash',   frames: fr(8,  5, 6), frameRate: 10, repeat:  0 },

  // ── Hit reactions ─────────────────────────────────────────────────────────
  { key: 'hitHeavy',    frames: fr(9,  1, 4), frameRate: 10, repeat:  0 },

  // ── Utility ───────────────────────────────────────────────────────────────
  { key: 'ladderClimb', frames: fr(10, 2, 6), frameRate:  8, repeat: -1 },
  { key: 'interact',    frames: fr(11, 1, 1), frameRate:  8, repeat:  0 },
  { key: 'death',       frames: fr(11, 3, 3), frameRate:  8, repeat:  0 },
  { key: 'respawn',     frames: fr(11, 4, 4), frameRate:  8, repeat:  0 },
  { key: 'fomoChains',  frames: fr(11, 5, 8), frameRate:  8, repeat: -1 },
]

/**
 * Registers all hero animations on a Phaser scene.
 *
 * Idempotent — safe to call in every PlayerController constructor.
 * Animations are stored on the Phaser.Game instance (global), so they only
 * need to be created once regardless of how many scenes are active.
 *
 * @param {Phaser.Scene} scene
 */
export function registerAnimations(scene) {
  for (const def of HERO_ANIMS) {
    if (scene.anims.exists(def.key)) continue
    scene.anims.create({
      key:       def.key,
      frames:    def.frames.map(f => ({ key: def.textureKey || HERO_ATLAS.key, frame: f })),
      frameRate: def.frameRate,
      repeat:    def.repeat,
    })
  }
}
