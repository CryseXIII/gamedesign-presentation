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

const PLAYER_SHEET_FRAME_CONFIG = {
  frameWidth:  64,
  frameHeight: 64,
}

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
  wb_bg_intro: {
    id:     'wb_bg_intro',
    type:   'image',
    key:    'wb_bg_intro',
    path:   '/assets/scenes/wb/bg_intro.png',
    status: 'loaded',
    note:   'Zone 1 — wide intro backdrop, 2172×724, three-screen scroll space',
  },
  wb_speedup_succubus: {
    id:     'wb_speedup_succubus',
    type:   'image',
    key:    'wb_speedup_succubus',
    path:   '/assets/scenes/wb/wb_speedup_succubus.png',
    status: 'loaded',
    note:   'Zone 1 — speedup waifu / succubus encounter art, 640×640 transparent cutout, grounded on the intro floor',
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
  // ── Player state spritesheets (separate sheets per state, planned) ─────────
  player_male_idle: {
    id:     'player_male_idle',
    type:   'spritesheet',
    key:    'player_male_idle',
    path:   '/assets/characters/male/idle.png',
    frameConfig: PLAYER_SHEET_FRAME_CONFIG,
    frameCount:  5,
    status: 'missing',
    note:   'Male hero idle state, 64x64 frames, transparent background, placeholder rectangle when missing',
  },
  player_male_run: {
    id:     'player_male_run',
    type:   'spritesheet',
    key:    'player_male_run',
    path:   '/assets/gm_main_male_run.png',
    frameConfig: PLAYER_SHEET_FRAME_CONFIG,
    frameCount:  8,
    status: 'loaded',
    note:   'Male hero run state, 64x64 frames, actual PNG in public/assets/gm_main_male_run.png, 8-frame strip',
  },
  player_male_attack_up: {
    id:     'player_male_attack_up',
    type:   'spritesheet',
    key:    'player_male_attack_up',
    path:   '/assets/characters/male/attack_up.png',
    frameConfig: PLAYER_SHEET_FRAME_CONFIG,
    frameCount:  3,
    status: 'missing',
    note:   'Male hero attack-up state, 64x64 frames, separate sheet, placeholder rectangle when missing',
  },
  player_male_attack_down: {
    id:     'player_male_attack_down',
    type:   'spritesheet',
    key:    'player_male_attack_down',
    path:   '/assets/characters/male/attack_down.png',
    frameConfig: PLAYER_SHEET_FRAME_CONFIG,
    frameCount:  3,
    status: 'missing',
    note:   'Male hero attack-down state, 64x64 frames, separate sheet, placeholder rectangle when missing',
  },
  player_male_attack_left: {
    id:     'player_male_attack_left',
    type:   'spritesheet',
    key:    'player_male_attack_left',
    path:   '/assets/characters/male/attack_left.png',
    frameConfig: PLAYER_SHEET_FRAME_CONFIG,
    frameCount:  3,
    status: 'missing',
    note:   'Male hero attack-left state, 64x64 frames, separate sheet, placeholder rectangle when missing',
  },
  player_male_attack_right: {
    id:     'player_male_attack_right',
    type:   'spritesheet',
    key:    'player_male_attack_right',
    path:   '/assets/characters/male/attack_right.png',
    frameConfig: PLAYER_SHEET_FRAME_CONFIG,
    frameCount:  3,
    status: 'missing',
    note:   'Male hero attack-right state, 64x64 frames, separate sheet, placeholder rectangle when missing',
  },
  player_male_jump: {
    id:     'player_male_jump',
    type:   'spritesheet',
    key:    'player_male_jump',
    path:   '/assets/characters/male/jump.png',
    frameConfig: PLAYER_SHEET_FRAME_CONFIG,
    frameCount:  2,
    status: 'missing',
    note:   'Male hero jump state, 64x64 frames, separate sheet, placeholder rectangle when missing',
  },
  player_male_double_jump: {
    id:     'player_male_double_jump',
    type:   'spritesheet',
    key:    'player_male_double_jump',
    path:   '/assets/characters/male/double_jump.png',
    frameConfig: PLAYER_SHEET_FRAME_CONFIG,
    frameCount:  4,
    status: 'missing',
    note:   'Male hero double-jump state, 64x64 frames, separate sheet, placeholder rectangle when missing',
  },
  player_male_hurt: {
    id:     'player_male_hurt',
    type:   'spritesheet',
    key:    'player_male_hurt',
    path:   '/assets/characters/male/hurt.png',
    frameConfig: PLAYER_SHEET_FRAME_CONFIG,
    frameCount:  4,
    status: 'missing',
    note:   'Male hero hurt state, 64x64 frames, white flicker overlay and knockback in gameplay, no death state',
  },
  player_female_idle: {
    id:     'player_female_idle',
    type:   'spritesheet',
    key:    'player_female_idle',
    path:   '/assets/characters/female/idle.png',
    frameConfig: PLAYER_SHEET_FRAME_CONFIG,
    frameCount:  5,
    status: 'missing',
    note:   'Female hero idle state, 64x64 frames, transparent background, placeholder rectangle when missing',
  },
  player_female_run: {
    id:     'player_female_run',
    type:   'spritesheet',
    key:    'player_female_run',
    path:   '/assets/characters/female/run.png',
    frameConfig: PLAYER_SHEET_FRAME_CONFIG,
    frameCount:  2,
    status: 'missing',
    note:   'Female hero run state, 64x64 frames, transparent background, placeholder rectangle when missing',
  },
  player_female_attack_up: {
    id:     'player_female_attack_up',
    type:   'spritesheet',
    key:    'player_female_attack_up',
    path:   '/assets/characters/female/attack_up.png',
    frameConfig: PLAYER_SHEET_FRAME_CONFIG,
    frameCount:  3,
    status: 'missing',
    note:   'Female hero attack-up state, 64x64 frames, separate sheet, placeholder rectangle when missing',
  },
  player_female_attack_down: {
    id:     'player_female_attack_down',
    type:   'spritesheet',
    key:    'player_female_attack_down',
    path:   '/assets/characters/female/attack_down.png',
    frameConfig: PLAYER_SHEET_FRAME_CONFIG,
    frameCount:  3,
    status: 'missing',
    note:   'Female hero attack-down state, 64x64 frames, separate sheet, placeholder rectangle when missing',
  },
  player_female_attack_left: {
    id:     'player_female_attack_left',
    type:   'spritesheet',
    key:    'player_female_attack_left',
    path:   '/assets/characters/female/attack_left.png',
    frameConfig: PLAYER_SHEET_FRAME_CONFIG,
    frameCount:  3,
    status: 'missing',
    note:   'Female hero attack-left state, 64x64 frames, separate sheet, placeholder rectangle when missing',
  },
  player_female_attack_right: {
    id:     'player_female_attack_right',
    type:   'spritesheet',
    key:    'player_female_attack_right',
    path:   '/assets/characters/female/attack_right.png',
    frameConfig: PLAYER_SHEET_FRAME_CONFIG,
    frameCount:  3,
    status: 'missing',
    note:   'Female hero attack-right state, 64x64 frames, separate sheet, placeholder rectangle when missing',
  },
  player_female_jump: {
    id:     'player_female_jump',
    type:   'spritesheet',
    key:    'player_female_jump',
    path:   '/assets/characters/female/jump.png',
    frameConfig: PLAYER_SHEET_FRAME_CONFIG,
    frameCount:  2,
    status: 'missing',
    note:   'Female hero jump state, 64x64 frames, separate sheet, placeholder rectangle when missing',
  },
  player_female_double_jump: {
    id:     'player_female_double_jump',
    type:   'spritesheet',
    key:    'player_female_double_jump',
    path:   '/assets/characters/female/double_jump.png',
    frameConfig: PLAYER_SHEET_FRAME_CONFIG,
    frameCount:  4,
    status: 'missing',
    note:   'Female hero double-jump state, 64x64 frames, separate sheet, placeholder rectangle when missing',
  },
  player_female_hurt: {
    id:     'player_female_hurt',
    type:   'spritesheet',
    key:    'player_female_hurt',
    path:   '/assets/characters/female/hurt.png',
    frameConfig: PLAYER_SHEET_FRAME_CONFIG,
    frameCount:  4,
    status: 'missing',
    note:   'Female hero hurt state, 64x64 frames, white flicker overlay and knockback in gameplay, no death state',
  },

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
