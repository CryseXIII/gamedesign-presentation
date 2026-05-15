/**
 * Room 3 — Gallery Room
 *
 * A long hall with four pedestals. Each holds a "painting" (placeholder rectangle).
 * Walk near a pedestal and press E (or South gamepad button) to read the exhibit.
 * The exhibit text fires a window event → React overlay (GameScreen) handles display.
 * Walking to the far right → CreditsScene.
 */

import Phaser from 'phaser'
import {
  buildPlayerTexture,
  PLAYER_W, PLAYER_H, FLOOR_H, MOVE_SPEED, JUMP_VEL,
} from '../spriteData.js'

// ─── Exhibit data ─────────────────────────────────────────────────────────────
const EXHIBITS = [
  {
    id:    'bonfire',
    title: 'THE BONFIRE',
    paintColor: 0x3a1800,
    content: 'No tutorial popup. No arrow. No "Press E to warm yourself."\n\nThe fire simply burns — warm and bright in a cold, dark world.\n\nYou approach because it feels right. Fire means safety in every story humans have ever told.\n\nDark Souls does not teach you mechanics. It trusts you to understand.',
  },
  {
    id:    'hud',
    title: 'THE MINIMAL HUD',
    paintColor: 0x08101e,
    content: 'Two bars. That\'s all.\n\nHP on the left. Stamina below it. No minimap. No objective tracker. No area label.\n\nEvery piece of missing information is intentional.\n\nThe world is what you see. Your body is what those bars measure. Everything else — you must learn.',
  },
  {
    id:    'ubisoft',
    title: 'THE ASSISTANT',
    paintColor: 0x081808,
    content: '"Head to the waypoint. Press F to collect. New Objective: Follow your ally. New ability unlocked! Tutorial: Stealth."\n\nWhen the game explains everything, nothing needs to be understood.\nWhen nothing needs to be understood, nothing can surprise you.\n\nWhen nothing can surprise you — you are not playing. You are being played.',
  },
  {
    id:    'tell',
    title: 'THE TELL',
    paintColor: 0x180018,
    content: 'The Silver Knight raises his shield.\nThen lowers his spear.\nThen lunges.\n\nNo prompt says "DODGE NOW." No red outline. No damage indicator.\n\nYou watch. You die. You watch again.\n\nThe enemy\'s animation is the communication. Motion is meaning. Death is the teacher.\n\nThis is deliberate game design.',
  },
]

const INTERACT_DIST = 130   // px from pedestal center to trigger prompt

export default class GalleryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GalleryScene' })
    this.charConfig          = null
    this.player              = null
    this.cursors             = null
    this.wasd                = null
    this.gamepad             = null
    this.padJumpWasDown      = false
    this.padActWasDown       = false
    this.transitioning       = false
    this.galleryOpen         = false
    this.pedestals           = []   // [{ x, prompt }]
    this.eKey                = null
    this.galleryCloseHandler = null
  }

  init(data) {
    this.charConfig    = data?.charConfig ?? null
    this.transitioning = false
    this.galleryOpen   = false
  }

  create() {
    const W     = this.scale.width
    const H     = this.scale.height
    const roomW = W * 4

    // ── Background ────────────────────────────────────────────────────────
    this.add.rectangle(roomW / 2, H / 2, roomW, H, 0x06060c)

    // Vaulted ceiling hint (dark bands)
    for (let bx = 300; bx < roomW; bx += 500) {
      this.add.rectangle(bx, 40, 12, 80, 0x0e0e16).setAlpha(0.7)
    }

    // Wall torches every ~600px
    for (let tx = 250; tx < roomW; tx += 600) {
      this._drawTorch(tx, 70)
    }

    // ── Floor ─────────────────────────────────────────────────────────────
    const floor = this.add.rectangle(roomW / 2, H - FLOOR_H / 2, roomW, FLOOR_H, 0x100e08)
    this.physics.add.existing(floor, true)
    this.add.rectangle(roomW / 2, H - FLOOR_H, roomW, 3, 0x382808)

    // ── Pedestals ────────────────────────────────────────────────────────
    this.pedestals = []
    const spacing  = roomW / (EXHIBITS.length + 1)

    EXHIBITS.forEach((ex, i) => {
      const px = Math.round(spacing * (i + 1))
      const pedTop = H - FLOOR_H   // pedestal sits on floor
      const pedH   = 100
      const pedW   = 90

      // Pedestal base
      this.add.rectangle(px, pedTop - pedH / 2, pedW, pedH, 0x1a1610)
      // Top cap
      this.add.rectangle(px, pedTop - pedH - 5, pedW + 10, 12, 0x221e14)
      // Painting / placeholder artwork
      const paintW = 150
      const paintH = 110
      const paintY = pedTop - pedH - 5 - paintH / 2 - 14
      this.add.rectangle(px, paintY, paintW + 8, paintH + 8, 0x0a0806)  // frame
      this.add.rectangle(px, paintY, paintW, paintH, ex.paintColor)
      // Title label on painting
      this.add.text(px, paintY, ex.title, {
        fontFamily: '"Cinzel", Georgia, serif',
        fontSize:   '11px',
        color:      '#c8b89a',
        align:      'center',
      }).setOrigin(0.5).setAlpha(0.65)

      // Interaction prompt (hidden until player is near)
      const prompt = this.add.text(px, paintY - paintH / 2 - 22, '[E] EXAMINE', {
        fontFamily: '"Cinzel", Georgia, serif',
        fontSize:   '13px',
        color:      '#d4af37',
        align:      'center',
      }).setOrigin(0.5, 1).setVisible(false)

      this.pedestals.push({ x: px, prompt, exhibit: ex })
    })

    // ── Exit arch (right side) ────────────────────────────────────────────
    this.add.text(
      roomW - 200,
      H - FLOOR_H - 24,
      '▷  ONWARD',
      { fontFamily: '"Cinzel", Georgia, serif', fontSize: '20px', color: '#c9a84c' }
    ).setOrigin(0.5, 1).setAlpha(0.5)

    // ── Entry arch (left side) ────────────────────────────────────────────
    this.add.rectangle(14, (H - FLOOR_H) / 2, 28, H - FLOOR_H, 0x16120a)

    // ── Player ────────────────────────────────────────────────────────────
    buildPlayerTexture(this, this.charConfig)
    this.player = this.physics.add.sprite(160, H - FLOOR_H - PLAYER_H / 2 - 2, 'player_tex')
    this.player.setCollideWorldBounds(true)
    this.physics.add.collider(this.player, floor)

    // ── World & camera ────────────────────────────────────────────────────
    this.physics.world.setBounds(0, 0, roomW, H + 600)
    this.cameras.main.setBounds(0, 0, roomW, H)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.fadeIn(600, 0, 0, 0)

    // ── Input ─────────────────────────────────────────────────────────────
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd    = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    })
    this.eKey = this.input.keyboard.addKey('E')
    if (this.input.gamepad) {
      this.input.gamepad.once('connected', pad => { this.gamepad = pad })
    }

    // ── Listen for gallery close from React overlay ───────────────────────
    this.galleryCloseHandler = () => { this.galleryOpen = false }
    window.addEventListener('game:galleryItemClosed', this.galleryCloseHandler)
    this.events.once('shutdown', () => {
      window.removeEventListener('game:galleryItemClosed', this.galleryCloseHandler)
    })
  }

  // ── Torch helper ──────────────────────────────────────────────────────────
  _drawTorch(x, y) {
    this.add.rectangle(x, y + 18, 6, 24, 0x3a2810)
    this.add.rectangle(x, y,       10, 16, 0xff9000).setAlpha(0.85)
    this.add.rectangle(x, y - 6,    7, 10, 0xffcc44).setAlpha(0.80)
    this.add.rectangle(x, y,       80, 60, 0xff8800).setAlpha(0.05)
  }

  // ── Exit helper ───────────────────────────────────────────────────────────
  _exitTo(sceneKey) {
    if (this.transitioning) return
    this.transitioning = true
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(sceneKey, { charConfig: this.charConfig })
    })
    this.cameras.main.fadeOut(600, 0, 0, 0)
  }

  update() {
    if (!this.player || !this.cursors) return

    const H     = this.scale.height
    const W     = this.scale.width
    const roomW = W * 4

    // ── Gamepad ────────────────────────────────────────────────────────────
    const pad         = this.gamepad
    const padLeft     = pad ? pad.left  || (pad.axes[0] ?? 0) < -0.4 : false
    const padRight    = pad ? pad.right || (pad.axes[0] ?? 0) >  0.4 : false
    const padJumpNow  = pad ? (pad.buttons[0]?.isDown ?? false) : false
    const padJumpJust = padJumpNow && !this.padJumpWasDown
    this.padJumpWasDown = padJumpNow
    const padActNow   = pad ? (pad.buttons[2]?.isDown ?? false) : false   // Square/X
    const padActJust  = padActNow && !this.padActWasDown
    this.padActWasDown = padActNow

    const onGround = this.player.body.blocked.down

    // ── Player movement (locked while gallery open) ────────────────────────
    if (!this.galleryOpen && !this.transitioning) {
      const goLeft  = this.cursors.left.isDown  || this.wasd.left.isDown  || padLeft
      const goRight = this.cursors.right.isDown || this.wasd.right.isDown || padRight
      const jumpJust =
        Phaser.Input.Keyboard.JustDown(this.cursors.up)    ||
        Phaser.Input.Keyboard.JustDown(this.wasd.up)       ||
        Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
        padJumpJust

      this.player.setVelocityX(0)
      if (goLeft)  { this.player.setVelocityX(-MOVE_SPEED); this.player.setFlipX(true)  }
      if (goRight) { this.player.setVelocityX( MOVE_SPEED); this.player.setFlipX(false) }
      if (jumpJust && onGround) this.player.setVelocityY(JUMP_VEL)
    } else if (!this.transitioning) {
      this.player.setVelocityX(0)
    }

    // ── Pedestal proximity ────────────────────────────────────────────────
    let nearestPedestal = null
    let minDist         = INTERACT_DIST

    for (const p of this.pedestals) {
      const dist = Math.abs(this.player.x - p.x)
      if (dist < minDist) {
        minDist = dist
        nearestPedestal = p
      }
    }

    for (const p of this.pedestals) {
      p.prompt.setVisible(p === nearestPedestal && !this.galleryOpen)
    }

    // ── Interact ──────────────────────────────────────────────────────────
    const eJust = Phaser.Input.Keyboard.JustDown(this.eKey) || padActJust
    if (eJust && nearestPedestal && !this.galleryOpen) {
      this.galleryOpen = true
      window.dispatchEvent(new CustomEvent('game:showGalleryItem', {
        detail: nearestPedestal.exhibit,
      }))
    }

    // ── Room exit ─────────────────────────────────────────────────────────
    if (!this.galleryOpen && this.player.x > roomW - 120) {
      this._exitTo('CreditsScene')
    }
  }
}
