/**
 * GameScene — Room 1
 *
 * Wide hall.  Player enters from the left and walks right to the exit.
 * Teaching concept: freedom of movement, no hand-holding.
 *
 * Exit: player.x ≥ roomWidth − 200  →  fade → PlayerGuidanceScene
 */

import Phaser from 'phaser'
import PlayerController, { FLOOR_H, SPAWN_Y_OFFSET } from '../PlayerController.js'

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
    this.roomWidth     = 0
    this.player        = null
    this.transitioning = false
  }

  init() {
    this.transitioning = false
  }

  create() {
    const W = this.scale.width
    const H = this.scale.height
    this.roomWidth = W * 4

    // ── Background ──────────────────────────────────────────────────────────
    this.add.rectangle(this.roomWidth / 2, H / 2, this.roomWidth, H, 0x08080f)

    // Stone pillar atmosphere
    for (let px = 600; px < this.roomWidth - 400; px += 700) {
      this.add
        .rectangle(px, (H - FLOOR_H) / 2, 26, H - FLOOR_H, 0x111118)
        .setAlpha(0.9)
    }

    // ── Floor ────────────────────────────────────────────────────────────────
    const floor = this.add.rectangle(
      this.roomWidth / 2,
      H - FLOOR_H / 2,
      this.roomWidth,
      FLOOR_H,
      0x16100a
    )
    this.physics.add.existing(floor, true)

    this.add.rectangle(
      this.roomWidth / 2, H - FLOOR_H, this.roomWidth, 3, 0x38260e
    )

    // ── Player ───────────────────────────────────────────────────────────────
    this.player = new PlayerController(this, 180, H - FLOOR_H - SPAWN_Y_OFFSET)
    this.physics.add.collider(this.player.sprite, floor)

    // ── World & camera ────────────────────────────────────────────────────────
    this.physics.world.setBounds(0, 0, this.roomWidth, H + 600)
    this.cameras.main.setBounds(0, 0, this.roomWidth, H)
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1)
    this.cameras.main.fadeIn(600, 0, 0, 0)

    // ── "Next area" marker ────────────────────────────────────────────────────
    this.add.text(
      this.roomWidth - 260,
      H - FLOOR_H - 20,
      '▷  NEXT AREA',
      { fontFamily: '"Cinzel", Georgia, serif', fontSize: '22px', color: '#c9a84c' }
    ).setOrigin(0.5, 1).setAlpha(0.55)
  }

  update() {
    if (!this.player || this.transitioning) return

    try {
      this.player.update()
    } catch (error) {
      console.error('[GAMERON] GameScene update crashed', error)
      window.dispatchEvent(new CustomEvent('game:debugError', { detail: { scope: 'GameScene', error: String(error) } }))
      return
    }

    // ── Room exit → PlayerGuidanceScene ──────────────────────────────────────
    if (this.player.x >= this.roomWidth - 200) {
      this.transitioning = true
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('PlayerGuidanceScene')
      })
      this.cameras.main.fadeOut(600, 0, 0, 0)
    }
  }

  shutdown() {
    if (this.player) this.player.destroy()
    this.player = null
  }
}
