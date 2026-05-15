/**
 * PreloadScene
 *
 * First scene to run.  Loads all shared game assets, shows a minimal loading
 * bar, then starts GameScene once complete.
 *
 * Assets loaded here (available to all subsequent scenes):
 *   'hero'       — dark_fantasy_hero_sprite_sheet.png  (128 × 128 frames)
 *   'endcredits' — endcredits.mp3
 */

import Phaser from 'phaser'
import { HERO_ATLAS } from '../animConfig.js'

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' })
  }

  preload() {
    const W = this.scale.width
    const H = this.scale.height

    // ── Loading bar ──────────────────────────────────────────────────────────
    const barW = Math.min(W * 0.5, 400)
    const barH = 4
    const barX = (W - barW) / 2
    const barY = H / 2

    this.add
      .text(W / 2, barY - 28, 'LOADING', {
        fontFamily: '"Cinzel", Georgia, serif',
        fontSize:   '13px',
        color:      '#5a4520',
      })
      .setOrigin(0.5)

    // Track background
    this.add
      .rectangle(W / 2, barY, barW, barH, 0x1a1612)
      .setOrigin(0.5)

    // Progress fill (grows left → right)
    const fill = this.add
      .rectangle(barX, barY, 0, barH, 0xc9a84c)
      .setOrigin(0, 0.5)

    this.load.on('progress', (v) => {
      fill.width = barW * v
    })

    // ── Assets ──────────────────────────────────────────────────────────────
    if (!this.textures.exists('hero')) {
      this.load.spritesheet('hero', HERO_ATLAS.path, {
        frameWidth:  HERO_ATLAS.frameW,
        frameHeight: HERO_ATLAS.frameH,
      })
    }

    if (!this.cache.audio.has('endcredits')) {
      this.load.audio('endcredits', '/assets/endcredits.mp3')
    }
  }

  create() {
    this.scene.start('GameScene')
  }
}
