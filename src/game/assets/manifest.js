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
    path:   '/assets/logo.jpg',
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
    path:   '/assets/charsel_portrait_male.jpg',
    status: 'loaded',
    note:   'CharacterSelect card — male warrior portrait, 621×900 JPEG',
  },
  charsel_portrait_female: {
    id:     'charsel_portrait_female',
    type:   'image',
    key:    null,
    path:   '/assets/charsel_portrait_female.jpg',
    status: 'loaded',
    note:   'CharacterSelect card — female warrior portrait, 675×900 JPEG',
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
    note:   'Zone 1 — speedup waifu / succubus encounter art, 512×512 transparent cutout, grounded on the intro floor',
  },
  wb_bg_steppe: {
    id:     'wb_bg_steppe',
    type:   'image',
    key:    'wb_bg_steppe',
    path:   '/assets/scenes/wb/bg_steppe.png',
    status: 'missing',
    note:   'Unused after the single-backdrop intro layout; kept only as a future fallback',
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
    note:   'Widow zone — FOMO Widow sprite, 170x256 portrait cutout, player-scale render ~160px tall',
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
    status: 'loaded',
    note:   'Male hero jump state, 64x64 frames, 2-frame horizontal strip',
  },
  player_male_land: {
    id:     'player_male_land',
    type:   'spritesheet',
    key:    'player_male_land',
    path:   '/assets/characters/male/land.png',
    frameConfig: PLAYER_SHEET_FRAME_CONFIG,
    frameCount:  3,
    status: 'loaded',
    note:   'Male hero landing state, 64x64 frames, 3-frame horizontal strip, plays once on touchdown',
  },
  player_male_interact: {
    id:     'player_male_interact',
    type:   'spritesheet',
    key:    'player_male_interact',
    path:   '/assets/characters/male/interact.png',
    frameConfig: PLAYER_SHEET_FRAME_CONFIG,
    frameCount:  3,
    status: 'loaded',
    note:   'Male hero interact/ability state, 64x64 frames, 3-frame strip, plays once on K press',
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

  // ── PlayerGuidanceScene assets (Scene 2) ───────────────────────────────────
  pgs_bg_castle: {
    id:     'pgs_bg_castle',
    type:   'image',
    key:    'pgs_bg_castle',
    path:   '/assets/scenes/pgs/bg_castle.png',
    status: 'loaded',
    note:   'Scene 2 castle background, 2048×768 pixel-art, central ornate picture frame for video embed',
  },
  pgs_red_dot_waifu: {
    id:     'pgs_red_dot_waifu',
    type:   'image',
    key:    'pgs_red_dot_waifu',
    path:   '/assets/scenes/pgs/red_dot_waifu.png',
    status: 'loaded',
    note:   'Scene 2 — Red Dot Gacha Waifu, 640×640 transparent (green-keyed), player-scale render ~160px tall',
  },
  pgs_rdw_victory: {
    id:     'pgs_rdw_victory',
    type:   'image',
    key:    'pgs_rdw_victory',
    path:   '/assets/scenes/pgs/rdw_victory.jpg',
    status: 'loaded',
    note:   'Scene 2 — Red Dot Waifu victory screen, shown after 3rd correct door, 1023×576 JPEG',
  },

  // ── BannerSirenScene assets (Scene 3) ──────────────────────────────────────
  bs_banner_siren: {
    id:     'bs_banner_siren',
    type:   'image',
    key:    'bs_banner_siren',
    path:   '/assets/scenes/bs/banner_siren.png',
    status: 'loaded',
    note:   'Scene 3 — Banner Siren NPC portrait, 171x256, player-scale render ~160px tall',
  },
  bs_bg_top: {
    id:     'bs_bg_top',
    type:   'image',
    key:    'bs_bg_top',
    path:   '/assets/scenes/bs/bg_top.jpg',
    status: 'loaded',
    note:   'Scene 3 — top room background (hole in floor), 1023×576',
  },
  bs_bg_mid: {
    id:     'bs_bg_mid',
    type:   'image',
    key:    'bs_bg_mid',
    path:   '/assets/scenes/bs/bg_mid.jpg',
    status: 'loaded',
    note:   'Scene 3 — shaft middle section, tiled vertically during fall, 1023×576',
  },
  bs_bg_bot: {
    id:     'bs_bg_bot',
    type:   'image',
    key:    'bs_bg_bot',
    path:   '/assets/scenes/bs/bg_bot.jpg',
    status: 'loaded',
    note:   'Scene 3 — landing area at bottom of shaft, 1023×576',
  },

  // ── WhaleQueenScene assets (Scene 4) ──────────────────────────────────────
  wq_whale_queen: {
    id:     'wq_whale_queen',
    type:   'image',
    key:    'wq_whale_queen',
    path:   '/assets/scenes/wq/whale_queen.png',
    status: 'loaded',
    note:   'Scene 4 — Whale Queen NPC portrait, 171x256, player-scale render ~160px tall',
  },
  wq_bg: {
    id:     'wq_bg',
    type:   'image',
    key:    'wq_bg',
    path:   '/assets/scenes/wq/bg.jpg',
    status: 'loaded',
    note:   'Scene 4 — Whale Queen throne room background, 1023×576',
  },
  wq_victory: {
    id:     'wq_victory',
    type:   'image',
    key:    'wq_victory',
    path:   '/assets/scenes/wq/victory.jpg',
    status: 'loaded',
    note:   'Scene 4 — Whale Queen victory screen (refused payment), 1023×576',
  },
  wq_defeat: {
    id:     'wq_defeat',
    type:   'image',
    key:    'wq_defeat',
    path:   '/assets/scenes/wq/defeat.jpg',
    status: 'loaded',
    note:   'Scene 4 — Whale Queen defeat screen (paid 5000 diamonds), 1023×576',
  },

  // ── TaskmasterScene assets (Scene 5) ──────────────────────────────────────
  tm_taskmaster: {
    id:     'tm_taskmaster',
    type:   'image',
    key:    'tm_taskmaster',
    path:   '/assets/scenes/tm/taskmaster.png',
    status: 'loaded',
    note:   'Scene 5 — Taskmaster NPC portrait, 171x256, player-scale render ~160px tall',
  },
  tm_bg: {
    id:     'tm_bg',
    type:   'image',
    key:    'tm_bg',
    path:   '/assets/scenes/tm/bg.jpg',
    status: 'loaded',
    note:   'Scene 5 — Taskmaster background, 1023×576',
  },
  tm_victory: {
    id:     'tm_victory',
    type:   'image',
    key:    'tm_victory',
    path:   '/assets/scenes/tm/victory.jpg',
    status: 'loaded',
    note:   'Scene 5 — Taskmaster victory screen, 1023×576',
  },

  // ── FomoWidowScene assets (Scene 6) ────────────────────────────────────────
  fw_bg: {
    id:     'fw_bg',
    type:   'image',
    key:    'fw_bg',
    path:   '/assets/scenes/fw/bg.jpg',
    status: 'loaded',
    note:   'Scene 6 — Fomo Widow corridor background, 1365×768',
  },

  // ── CreditsScene ────────────────────────────────────────────────────────────
  credits_endscreen: {
    id:     'credits_endscreen',
    type:   'image',
    key:    'credits_endscreen',
    path:   '/assets/scenes/credits/endscreen.jpg',
    status: 'loaded',
    note:   'Credits end screen shown after scroll completes, 1023×576',
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
