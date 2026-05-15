/**
 * PlayerGuidanceScene — Room 2
 *
 * Teaching concept: Dark Souls guides through environmental cues, not text.
 *
 * Layout
 * ──────
 *  • A wide room with a raised platform on the right side.
 *  • Two possible exits at the right wall (visual gap, no physics wall):
 *      Upper exit  (platform level)  — torch glowing above it  → GalleryScene
 *      Lower exit  (floor level)     — pile of bones nearby     → GameScene
 *  • No text instructions. The torch is the only hint.
 *
 * Exit logic  (update):
 *   player.x > roomWidth − 120
 *     AND player.y < exitThreshold  → upper → GalleryScene
 *     AND body.blocked.down         → lower → GameScene (loop back)
 */

import Phaser from 'phaser'
import PlayerController, { FLOOR_H, SPAWN_Y_OFFSET } from '../PlayerController.js'

export default class PlayerGuidanceScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayerGuidanceScene' })
    this.player        = null
    this.transitioning = false
  }

  init() {
    this.transitioning = false
  }

  create() {
    const W     = this.scale.width
    const H     = this.scale.height
    const roomW = W * 3

    // ── Background ──────────────────────────────────────────────────────────
    this.add.rectangle(roomW / 2, H / 2, roomW, H, 0x050508)

    for (let px = 500; px < roomW - 400; px += 600) {
      this.add
        .rectangle(px, (H - FLOOR_H) / 2, 22, H - FLOOR_H, 0x0d0d12)
        .setAlpha(0.85)
    }

    // ── Floor ────────────────────────────────────────────────────────────────
    const floor = this.add.rectangle(
      roomW / 2, H - FLOOR_H / 2, roomW, FLOOR_H, 0x12100a
    )
    this.physics.add.existing(floor, true)
    this.add.rectangle(roomW / 2, H - FLOOR_H, roomW, 3, 0x38260e)

    // ── Raised platform (right side, flush with right wall) ──────────────────
    //    Player standing on it: body bottom = platY − platH/2
    //    → sprite.y = platY − platH/2 − 54  ≈  H − FLOOR_H − 252
    const platW = roomW * 0.18
    const platH = 18
    const platX = roomW - platW / 2
    const platY = H - FLOOR_H - 189

    const platform = this.add.rectangle(platX, platY, platW, platH, 0x1c1810)
    this.physics.add.existing(platform, true)
    this.add.rectangle(platX, platY - platH / 2, platW, 3, 0x4a3520)

    // Step leading up to the platform
    const stepW = platW * 0.45
    const stepH = 18
    const stepX = roomW - platW - stepW / 2 + 6
    const stepY = H - FLOOR_H - 104

    const step = this.add.rectangle(stepX, stepY, stepW, stepH, 0x181610)
    this.physics.add.existing(step, true)
    this.add.rectangle(stepX, stepY - stepH / 2, stepW, 3, 0x3a2a14)

    // ── Decorative right wall — two gaps for exits ───────────────────────────
    const wallX     = roomW - 12
    const wallThick = 24

    // Upper exit gap: centred on where player stands on the platform
    const upperGapCY = H - FLOOR_H - 252
    const upperGapH  = 120
    const upperTop   = upperGapCY - upperGapH / 2
    const upperBot   = upperGapCY + upperGapH / 2

    // Lower exit gap: floor-level player centre
    const lowerGapCY = H - FLOOR_H - SPAWN_Y_OFFSET
    const lowerGapH  = 120
    const lowerTop   = lowerGapCY - lowerGapH / 2
    const lowerBot   = lowerGapCY + lowerGapH / 2

    // Ceiling → above upper gap
    if (upperTop > 0) {
      this.add.rectangle(wallX, upperTop / 2, wallThick, upperTop, 0x1a1210)
    }
    // Between gaps
    const midH = lowerTop - upperBot
    if (midH > 0) {
      this.add.rectangle(wallX, upperBot + midH / 2, wallThick, midH, 0x1a1210)
    }
    // Below lower gap → floor top
    const botH = H - FLOOR_H - lowerBot
    if (botH > 0) {
      this.add.rectangle(wallX, lowerBot + botH / 2, wallThick, botH, 0x1a1210)
    }

    // ── Torch at upper exit (the environmental hint) ─────────────────────────
    const torchX = roomW - 55
    const torchY = upperGapCY - 66

    this.add.rectangle(torchX, torchY + 22,  7, 28, 0x3a2810)           // handle
    this.add.rectangle(torchX, torchY,       12, 20, 0xff9900).setAlpha(0.92) // outer flame
    this.add.rectangle(torchX, torchY - 8,    8, 14, 0xffcc44).setAlpha(0.88) // inner
    this.add.rectangle(torchX, torchY - 14,   4,  8, 0xffffff).setAlpha(0.55) // core
    this.add.rectangle(torchX, torchY, 160, 130, 0xff8800).setAlpha(0.055)    // warm halo
    this.add.rectangle(torchX, torchY,  80,  70, 0xffaa00).setAlpha(0.10)

    // ── Bones near lower exit (subtle wrong-path cue) ────────────────────────
    const bX = roomW - 70
    const bY = H - FLOOR_H - 10
    this.add.rectangle(bX,      bY,      40,  8, 0x383028)
    this.add.rectangle(bX - 11, bY -  7,  8,  8, 0x383028)
    this.add.rectangle(bX + 11, bY -  7,  8,  8, 0x383028)

    // ── Entry arch (left) ────────────────────────────────────────────────────
    this.add.rectangle(14, (H - FLOOR_H) / 2, 28, H - FLOOR_H, 0x16120a)

    // ── Player ───────────────────────────────────────────────────────────────
    this.player = new PlayerController(this, 160, H - FLOOR_H - SPAWN_Y_OFFSET)
    this.physics.add.collider(this.player.sprite, floor)
    this.physics.add.collider(this.player.sprite, platform)
    this.physics.add.collider(this.player.sprite, step)

    // ── World & camera ────────────────────────────────────────────────────────
    this.physics.world.setBounds(0, 0, roomW, H + 600)
    this.cameras.main.setBounds(0, 0, roomW, H)
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1)
    this.cameras.main.fadeIn(600, 0, 0, 0)
  }

  _exitTo(sceneKey) {
    if (this.transitioning) return
    this.transitioning = true
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(sceneKey)
    })
    this.cameras.main.fadeOut(600, 0, 0, 0)
  }

  update() {
    if (!this.player || this.transitioning) return

    const H     = this.scale.height
    const W     = this.scale.width
    const roomW = W * 3

    this.player.update()

    // ── Exit detection ────────────────────────────────────────────────────────
    if (this.player.x > roomW - 120) {
      // Upper exit: player is elevated (on platform)
      const exitThreshold = H - FLOOR_H - 140
      if (this.player.y < exitThreshold) {
        this._exitTo('GalleryScene')
      } else if (this.player.body.blocked.down) {
        // Lower exit: player at floor level → loop back
        this._exitTo('GameScene')
      }
    }
  }

  shutdown() {
    if (this.player) this.player.destroy()
    this.player = null
  }
}
