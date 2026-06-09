/**
 * Asset Manifest
 *
 * Single source of truth for every game asset.
 * Status values:
 *   'loaded'   — file exists in public/assets/, preloaded by PreloadScene
 *   'missing'  — file not yet generated; a placeholder is shown in-game
 *
 * Placeholder convention (Phaser scenes):
 *   When status === 'missing', draw a colored rectangle + Phaser.Text
 *   labeled  "missing_id:<id>"  at the intended position/size.
 *
 * Asset folder layout:
 *   public/assets/                 — global / shared (hero sheets, charsel portraits, audio)
 *   public/assets/scenes/wb/       — WorldBuildingScene
 *   public/assets/scenes/guidance/ — PlayerGuidanceScene
 *   public/assets/scenes/gallery/  — GalleryScene
 *   public/assets/scenes/credits/  — CreditsScene
 *
 * Removed legacy keys (compressed scene no longer uses them):
 *   wb_bg_storm  — was Zone 3 bg; storm is now a particle/overlay only
 *   wb_bg_widow  — was Zone 4 bg; steppe bg covers widow area after compression
 */

export const MANIFEST = {
  // ── Global / shared ────────────────────────────────────────────────────────
  hero_sheet: {
    id:     'hero_sheet',
    type:   'spritesheet',
    key:    'hero',
    path:   '/assets/dark_fantasy_hero_sprite_sheet.png',
    status: 'loaded',
    note:   '1024×1536, 8 cols × 12 rows, 128×128 px per frame',
  },
  gm_main_male_run: {
    id:     'gm_main_male_run',
    type:   'spritesheet',
    key:    'gm_main_male_run',
    path:   '/assets/gm_main_male_run.png',
    status: 'loaded',
    note:   'Legacy run strip replacement — 2 frames trimmed to 64x64, chroma-key green removed at preload',
  },
  logo: {
    id:     'logo',
    type:   'image',
    key:    'logo',
    path:   '/assets/logo.png',
    status: 'loaded',
  },
  menu_sfx: {
    id:     'menu_sfx',
    type:   'audio',
    key:    'menu-sfx',
    path:   '/assets/menu-sfx.mp3',
    status: 'loaded',
  },
  menu_ost: {
    id:     'menu_ost',
    type:   'audio',
    key:    'menu-ost',
    path:   '/assets/menu-ost.mp3',
    status: 'loaded',
  },
  endcredits: {
    id:     'endcredits',
    type:   'audio',
    key:    'endcredits',
    path:   '/assets/endcredits.mp3',
    status: 'loaded',
  },

  // ── CharacterSelect portraits (React / CSS — not loaded by Phaser) ─────────
  charsel_portrait_male: {
    id:     'charsel_portrait_male',
    type:   'image',
    key:    null,
    path:   '/assets/charsel_portrait_male.png',
    status: 'loaded',
    note:   'CharacterSelect card — male warrior portrait, 1042×1510, dark fantasy pixel art',
  },
  charsel_portrait_female: {
    id:     'charsel_portrait_female',
    type:   'image',
    key:    null,
    path:   '/assets/charsel_portrait_female.png',
    status: 'loaded',
    note:   'CharacterSelect card — female warrior portrait, 768×1024 (center-cropped from landscape), dark fantasy pixel art',
  },

  // ── WorldBuildingScene (Scene 1) ────────────────────────────────────────────
  wb_bg_village: {
    id:     'wb_bg_village',
    type:   'image',
    key:    'wb_bg_village',
    path:   '/assets/scenes/wb/bg_village.png',
    status: 'loaded',
    note:   'Zone 1 — burning ruined village at night, 1832×859',
  },
  wb_bg_steppe: {
    id:     'wb_bg_steppe',
    type:   'image',
    key:    'wb_bg_steppe',
    path:   '/assets/scenes/wb/bg_steppe.png',
    status: 'loaded',
    note:   'Zone 2 + widow area — open dead steppe toward storm horizon, 1832×859',
  },
  wb_portrait_male_1: {
    id:     'wb_portrait_male_1',
    type:   'image',
    key:    'wb_portrait_male_1',
    path:   '/assets/scenes/wb/portrait_male_1.png',
    status: 'loaded',
    note:   'Zone 2 — male backstory #1: before collapse (calm tension), copper-sepia engraving style',
  },
  wb_portrait_male_2: {
    id:     'wb_portrait_male_2',
    type:   'image',
    key:    'wb_portrait_male_2',
    path:   '/assets/scenes/wb/portrait_male_2.png',
    status: 'loaded',
    note:   'Zone 2 — male backstory #2: village loss (grief)',
  },
  wb_portrait_male_3: {
    id:     'wb_portrait_male_3',
    type:   'image',
    key:    'wb_portrait_male_3',
    path:   '/assets/scenes/wb/portrait_male_3.png',
    status: 'loaded',
    note:   'Zone 2 — male backstory #3: oath (cold resolve)',
  },
  wb_portrait_female_1: {
    id:     'wb_portrait_female_1',
    type:   'image',
    key:    'wb_portrait_female_1',
    path:   '/assets/scenes/wb/portrait_female_1.png',
    status: 'loaded',
    note:   'Zone 2 — female backstory #1: before collapse (calm tension), copper-sepia engraving style',
  },
  wb_portrait_female_2: {
    id:     'wb_portrait_female_2',
    type:   'image',
    key:    'wb_portrait_female_2',
    path:   '/assets/scenes/wb/portrait_female_2.png',
    status: 'loaded',
    note:   'Zone 2 — female backstory #2: village loss (grief)',
  },
  wb_portrait_female_3: {
    id:     'wb_portrait_female_3',
    type:   'image',
    key:    'wb_portrait_female_3',
    path:   '/assets/scenes/wb/portrait_female_3.png',
    status: 'loaded',
    note:   'Zone 2 — female backstory #3: oath (cold resolve)',
  },
  wb_fomo_widow: {
    id:     'wb_fomo_widow',
    type:   'image',
    key:    'wb_fomo_widow',
    path:   '/assets/scenes/wb/fomo_widow.png',
    status: 'loaded',
    note:   'Widow zone — FOMO Widow sprite, 1024×1536 (Phaser scales to 160×280 in-scene)',
  },
  wb_fire_sfx: {
    id:     'wb_fire_sfx',
    type:   'audio',
    key:    'wb_fire_sfx',
    path:   '/assets/scenes/wb/fire_sfx.mp3',
    status: 'missing',
    note:   'Zone 1 — ambient fire crackling loop',
  },
  wb_rain_sfx: {
    id:     'wb_rain_sfx',
    type:   'audio',
    key:    'wb_rain_sfx',
    path:   '/assets/scenes/wb/rain_sfx.mp3',
    status: 'missing',
    note:   'Zone 2/storm — rain + thunder ambient loop',
  },
  wb_widow_music: {
    id:     'wb_widow_music',
    type:   'audio',
    key:    'wb_widow_music',
    path:   '/assets/scenes/wb/widow_music.mp3',
    status: 'missing',
    note:   'Widow zone — tense encounter music',
  },

  // ── GameScene future assets (files present, not yet wired into scenes) ──────
  gm_bg_training_arena: {
    id:     'gm_bg_training_arena',
    type:   'image',
    key:    'gm_bg_training_arena',
    path:   '/assets/gm_bg_training_arena.png',
    status: 'loaded',
    note:   'GameScene — training arena background, 1832×859',
  },
  gm_enemy_autoplay_lady: {
    id:     'gm_enemy_autoplay_lady',
    type:   'image',
    key:    'gm_enemy_autoplay_lady',
    path:   '/assets/gm_enemy_autoplay_lady.png',
    status: 'loaded',
    note:   'GameScene — Autoplay Lady enemy sprite, 1086×1448',
  },
}

/**
 * Returns every asset entry whose status is 'missing'.
 * Useful for generating AI image-generation prompts.
 * @returns {Array<object>}
 */
export function getMissingAssets() {
  return Object.values(MANIFEST).filter(a => a.status === 'missing')
}

/**
 * Returns every asset entry whose status is 'loaded'.
 * @returns {Array<object>}
 */
export function getLoadedAssets() {
  return Object.values(MANIFEST).filter(a => a.status === 'loaded')
}
