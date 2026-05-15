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
 *   public/assets/                 — global / shared
 *   public/assets/scenes/wb/       — WorldBuildingScene
 *   public/assets/scenes/guidance/ — PlayerGuidanceScene
 *   public/assets/scenes/gallery/  — GalleryScene
 *   public/assets/scenes/credits/  — CreditsScene
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

  // ── WorldBuildingScene (Scene 1) ────────────────────────────────────────────
  wb_bg_village: {
    id:     'wb_bg_village',
    type:   'image',
    key:    'wb_bg_village',
    path:   '/assets/scenes/wb/bg_village.png',
    status: 'missing',
    note:   'Zone 1 — burning village background, dark fantasy, fire glow',
  },
  wb_bg_steppe: {
    id:     'wb_bg_steppe',
    type:   'image',
    key:    'wb_bg_steppe',
    path:   '/assets/scenes/wb/bg_steppe.png',
    status: 'missing',
    note:   'Zone 2 — barren steppe at dusk, copper engraving tones',
  },
  wb_bg_storm: {
    id:     'wb_bg_storm',
    type:   'image',
    key:    'wb_bg_storm',
    path:   '/assets/scenes/wb/bg_storm.png',
    status: 'missing',
    note:   'Zone 3 — stormy plain with lightning sky',
  },
  wb_bg_widow: {
    id:     'wb_bg_widow',
    type:   'image',
    key:    'wb_bg_widow',
    path:   '/assets/scenes/wb/bg_widow.png',
    status: 'missing',
    note:   'Zone 4 — ruined shrine, eerie lavender glow from Gacha Widow',
  },
  wb_portrait_male_1: {
    id:     'wb_portrait_male_1',
    type:   'image',
    key:    'wb_portrait_male_1',
    path:   '/assets/scenes/wb/portrait_male_1.png',
    status: 'missing',
    note:   'Zone 2 — male warrior backstory portrait #1, copper engraving style',
  },
  wb_portrait_male_2: {
    id:     'wb_portrait_male_2',
    type:   'image',
    key:    'wb_portrait_male_2',
    path:   '/assets/scenes/wb/portrait_male_2.png',
    status: 'missing',
    note:   'Zone 2 — male warrior backstory portrait #2',
  },
  wb_portrait_male_3: {
    id:     'wb_portrait_male_3',
    type:   'image',
    key:    'wb_portrait_male_3',
    path:   '/assets/scenes/wb/portrait_male_3.png',
    status: 'missing',
    note:   'Zone 2 — male warrior backstory portrait #3',
  },
  wb_portrait_female_1: {
    id:     'wb_portrait_female_1',
    type:   'image',
    key:    'wb_portrait_female_1',
    path:   '/assets/scenes/wb/portrait_female_1.png',
    status: 'missing',
    note:   'Zone 2 — female warrior backstory portrait #1, copper engraving style',
  },
  wb_portrait_female_2: {
    id:     'wb_portrait_female_2',
    type:   'image',
    key:    'wb_portrait_female_2',
    path:   '/assets/scenes/wb/portrait_female_2.png',
    status: 'missing',
    note:   'Zone 2 — female warrior backstory portrait #2',
  },
  wb_portrait_female_3: {
    id:     'wb_portrait_female_3',
    type:   'image',
    key:    'wb_portrait_female_3',
    path:   '/assets/scenes/wb/portrait_female_3.png',
    status: 'missing',
    note:   'Zone 2 — female warrior backstory portrait #3',
  },
  wb_fomo_widow: {
    id:     'wb_fomo_widow',
    type:   'image',
    key:    'wb_fomo_widow',
    path:   '/assets/scenes/wb/fomo_widow.png',
    status: 'missing',
    note:   'Zone 4 — FOMO Widow sprite; demonic anime succubus, lavender glow, gacha coins',
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
    note:   'Zone 3 — rain + thunder ambient loop',
  },
  wb_widow_music: {
    id:     'wb_widow_music',
    type:   'audio',
    key:    'wb_widow_music',
    path:   '/assets/scenes/wb/widow_music.mp3',
    status: 'missing',
    note:   'Zone 4 — tense boss encounter music',
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
