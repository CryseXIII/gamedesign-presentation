/**
 * GalleryScene — Room 3
 *
 * A long hall with four pedestals, each holding a "painting".
 * Walk near a pedestal and press E (or South gamepad button) to examine it.
 * The exhibit fires a window event → React overlay (GameScreen) handles display.
 * Walking to the far right → CreditsScene.
 */

import Phaser from 'phaser'
import PlayerController, { FLOOR_H, SPAWN_Y_OFFSET } from '../PlayerController.js'

// ─── Exhibit data ─────────────────────────────────────────────────────────────
const EXHIBITS = [
  {
    id:         'bonfire',
    title:      'THE BONFIRE',
    paintColor: 0x3a1800,
    content:
      'No tutorial popup. No arrow. No "Press E to warm yourself."\n\n' +
      'The fire simply burns — warm and bright in a cold, dark world.\n\n' +
      'You approach because it feels right. Fire means safety in every story humans have ever told.\n\n' +
      'Dark Souls does not teach you mechanics. It trusts you to understand.',
  },
  {
    id:         'hud',
    title:      'THE MINIMAL HUD',
    paintColor: 0x08101e,
    content:
      "Two bars. That's all.\n\n" +
      'HP on the left. Stamina below it. No minimap. No objective tracker. No area label.\n\n' +
      'Every piece of missing information is intentional.\n\n' +
      'The world is what you see. Your body is what those bars measure. Everything else — you must learn.',
  },
  {
    id:         'ubisoft',
    title:      'THE ASSISTANT',
    paintColor: 0x081808,
    content:
      '"Head to the waypoint. Press F to collect. New Objective: Follow your ally. New ability unlocked! Tutorial: Stealth."\n\n' +
      'When the game explains everything, nothing needs to be understood.\n' +
      'When nothing needs to be understood, nothing can surprise you.\n\n' +
      'When nothing can surprise you — you are not playing. You are being played.',
  },
  {
    id:         'tell',
    title:      'THE TELL',
    paintColor: 0x180018,
    content:
      'The Silver Knight raises his shield.\nThen lowers his spear.\nThen lunges.\n\n' +
      'No prompt says "DODGE NOW." No red outline. No damage indicator.\n\n' +
      'You watch. You die. You watch again.\n\n' +
      "The enemy's animation is the communication. Motion is meaning. Death is the teacher.\n\n" +
      'This is deliberate game design.',
  },
]

const INTERACT_DIST = 130   // px from pedestal centre to trigger prompt

export default class GalleryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GalleryScene' })
    this.player              = null
    this.transitioning       = false
    this.galleryOpen         = false
    this.pedestals           = []   // [{ x, prompt, exhibit }]
    this.galleryCloseHandler = null
  }

  init() {
    this.transitioning = false
    this.galleryOpen   = false
  }

  create() {
    const W     = this.scale.width
    const H     = this.scale.height
    const roomW = W * 4

    // ── Background ──────────────────────────────────────────────────────────
    this.add.rectangle(roomW / 2, H / 2, roomW, H, 0x06060c)

    for (let bx = 300; bx < roomW; bx += 500) {
      this.add.rectangle(bx, 40, 12, 80, 0x0e0e16).setAlpha(0.7)
    }
    for (let tx = 250; tx < roomW; tx += 600) {
      this._drawTorch(tx, 70)
    }

    // ── Floor ────────────────────────────────────────────────────────────────
    const floor = this.add.rectangle(
      roomW / 2, H - FLOOR_H / 2, roomW, FLOOR_H, 0x100e08
    )
    this.physics.add.existing(floor, true)
    this.add.rectangle(roomW / 2, H - FLOOR_H, roomW, 3, 0x382808)

    // ── Pedestals ────────────────────────────────────────────────────────────
    this.pedestals = []
    const spacing  = roomW / (EXHIBITS.length + 1)

    EXHIBITS.forEach((ex, i) => {
      const px     = Math.round(spacing * (i + 1))
      const pedTop = H - FLOOR_H
      const pedH   = 100
      const pedW   = 90

      this.add.rectangle(px, pedTop - pedH / 2, pedW, pedH, 0x1a1610)
      this.add.rectangle(px, pedTop - pedH - 5, pedW + 10, 12, 0x221e14)

      const paintW = 150
      const paintH = 110
      const paintY = pedTop - pedH - 5 - paintH / 2 - 14

      this.add.rectangle(px, paintY, paintW + 8, paintH + 8, 0x0a0806)  // frame
      this.add.rectangle(px, paintY, paintW, paintH, ex.paintColor)

      this.add.text(px, paintY, ex.title, {
        fontFamily: '"Cinzel", Georgia, serif',
        fontSize:   '11px',
        color:      '#c8b89a',
        align:      'center',
      }).setOrigin(0.5).setAlpha(0.65)

      const prompt = this.add.text(px, paintY - paintH / 2 - 22, '[E] EXAMINE', {
        fontFamily: '"Cinzel", Georgia, serif',
        fontSize:   '13px',
        color:      '#d4af37',
        align:      'center',
      }).setOrigin(0.5, 1).setVisible(false)

      this.pedestals.push({ x: px, prompt, exhibit: ex })
    })

    // ── Exit marker ──────────────────────────────────────────────────────────
    this.add.text(
      roomW - 200, H - FLOOR_H - 24,
      '▷  ONWARD',
      { fontFamily: '"Cinzel", Georgia, serif', fontSize: '20px', color: '#c9a84c' }
    ).setOrigin(0.5, 1).setAlpha(0.5)

    // ── Lady Autoplay — looms near the exit ──────────────────────────────────
    const autoH  = Math.round(H * 0.72)
    const autoW  = Math.round(autoH * (512 / 683))
    this._autoplay = this.add.image(roomW - 340, H - FLOOR_H, 'gm_enemy_autoplay_lady')
      .setOrigin(0.5, 1)
      .setDisplaySize(autoW, autoH)
      .setDepth(3)
      .setAlpha(0)

    this._autoplayLabel = this.add.text(roomW - 340, H - FLOOR_H - autoH - 8, 'LADY AUTOPLAY', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize:   '15px',
      color:      '#cc44ff',
      stroke:     '#1a0030',
      strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(4).setAlpha(0)

    this._autoplayTriggered = false

    this.add.rectangle(14, (H - FLOOR_H) / 2, 28, H - FLOOR_H, 0x16120a)

    // ── Player ───────────────────────────────────────────────────────────────
    this.player = new PlayerController(this, 160, H - FLOOR_H - SPAWN_Y_OFFSET)
    this.physics.add.collider(this.player.sprite, floor)

    // ── World & camera ────────────────────────────────────────────────────────
    this.physics.world.setBounds(0, 0, roomW, H + 600)
    this.cameras.main.setBounds(0, 0, roomW, H)
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1)
    this.cameras.main.fadeIn(600, 0, 0, 0)

    // ── React overlay close listener ──────────────────────────────────────────
    this.galleryCloseHandler = () => { this.galleryOpen = false }
    window.addEventListener('game:galleryItemClosed', this.galleryCloseHandler)
    this.events.once('shutdown', () => {
      window.removeEventListener('game:galleryItemClosed', this.galleryCloseHandler)
    })
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  _drawTorch(x, y) {
    this.add.rectangle(x, y + 18,  6, 24, 0x3a2810)
    this.add.rectangle(x, y,       10, 16, 0xff9000).setAlpha(0.85)
    this.add.rectangle(x, y - 6,    7, 10, 0xffcc44).setAlpha(0.80)
    this.add.rectangle(x, y,       80, 60, 0xff8800).setAlpha(0.05)
  }

  _exitTo(sceneKey) {
    if (this.transitioning) return
    this.transitioning = true
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(sceneKey)
    })
    this.cameras.main.fadeOut(600, 0, 0, 0)
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  update() {
    if (!this.player) return

    const H     = this.scale.height
    const W     = this.scale.width
    const roomW = W * 4

    // ── Player movement (locked while gallery overlay is showing) ────────────
    if (!this.galleryOpen && !this.transitioning) {
      this.player.update()
    } else if (!this.transitioning) {
      this.player.halt()
    }

    // ── Pedestal proximity ────────────────────────────────────────────────────
    let nearestPedestal = null
    let minDist         = INTERACT_DIST

    for (const p of this.pedestals) {
      const dist = Math.abs(this.player.x - p.x)
      if (dist < minDist) {
        minDist         = dist
        nearestPedestal = p
      }
    }

    for (const p of this.pedestals) {
      p.prompt.setVisible(p === nearestPedestal && !this.galleryOpen)
    }

    // ── Interact ──────────────────────────────────────────────────────────────
    if (this.player.interactJustDown && nearestPedestal && !this.galleryOpen) {
      this.galleryOpen = true
      window.dispatchEvent(new CustomEvent('game:showGalleryItem', {
        detail: nearestPedestal.exhibit,
      }))
    }

    // ── Room exit ─────────────────────────────────────────────────────────────
    // Reveal Lady Autoplay when player passes the last pedestal
    if (!this._autoplayTriggered && this.player.x > roomW * 0.68) {
      this._autoplayTriggered = true
      this.tweens.add({ targets: [this._autoplay, this._autoplayLabel], alpha: 1, duration: 800 })
    }

    if (!this.galleryOpen && this.player.x > roomW - 120) {
      this._exitTo('CreditsScene')
    }
  }

  shutdown() {
    if (this.player) this.player.destroy()
    this.player = null
  }
}
