/**
 * Room 2 — Player Guidance Room
 *
 * Teaching concept: Dark Souls guides through environmental cues, not text.
 *
 * Layout
 * ──────
 *  • A wide room with a raised platform on the right side.
 *  • Two possible exits at the right wall (visual only — no physics wall):
 *      Upper exit  (platform height)  → torch glowing above it  → GalleryScene
 *      Lower exit  (floor level)      → pile of bones nearby     → back to GameScene
 *  • No text instructions. The torch is the only hint.
 *
 * Exit logic (in update):
 *  player.x > roomWidth - 120
 *    AND player.y < H - FLOOR_H - 140  →  upper (correct)  → GalleryScene
 *    AND player.body.blocked.down       →  lower (wrong)    → GameScene
 */

import Phaser from 'phaser'
import {
  buildPlayerTexture,
  PLAYER_W, PLAYER_H, FLOOR_H, MOVE_SPEED, JUMP_VEL,
} from '../spriteData.js'

export default class PlayerGuidanceScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayerGuidanceScene' })
    this.charConfig     = null
    this.player         = null
    this.cursors        = null
    this.wasd           = null
    this.gamepad        = null
    this.padJumpWasDown = false
    this.transitioning  = false
  }

  init(data) {
    this.charConfig    = data?.charConfig ?? null
    this.transitioning = false
  }

  create() {
    const W        = this.scale.width
    const H        = this.scale.height
    const roomW    = W * 3

    // ── Background ────────────────────────────────────────────────────────
    this.add.rectangle(roomW / 2, H / 2, roomW, H, 0x050508)

    // Atmospheric pillars
    for (let px = 500; px < roomW - 400; px += 600) {
      this.add.rectangle(px, (H - FLOOR_H) / 2, 22, H - FLOOR_H, 0x0d0d12).setAlpha(0.85)
    }

    // ── Floor ─────────────────────────────────────────────────────────────
    const floor = this.add.rectangle(roomW / 2, H - FLOOR_H / 2, roomW, FLOOR_H, 0x12100a)
    this.physics.add.existing(floor, true)
    this.add.rectangle(roomW / 2, H - FLOOR_H, roomW, 3, 0x38260e)

    // ── Raised platform (right side, reaches the right wall) ──────────────
    //    Player standing on it: y_center ≈ H - FLOOR_H - 229
    const platW = roomW * 0.18
    const platH = 18
    const platX = roomW - platW / 2          // flush with right wall
    const platY = H - FLOOR_H - 189         // platform center Y

    const platform = this.add.rectangle(platX, platY, platW, platH, 0x1c1810)
    this.physics.add.existing(platform, true)
    this.add.rectangle(platX, platY - platH / 2, platW, 3, 0x4a3520)

    // Smaller step leading up to the platform (visual + physics)
    const stepW = platW * 0.45
    const stepH = 18
    const stepX = roomW - platW - stepW / 2 + 6
    const stepY = H - FLOOR_H - 104

    const step = this.add.rectangle(stepX, stepY, stepW, stepH, 0x181610)
    this.physics.add.existing(step, true)
    this.add.rectangle(stepX, stepY - stepH / 2, stepW, 3, 0x3a2a14)

    // ── Decorative right wall (visual only — two gaps for exits) ──────────
    const wallX     = roomW - 12
    const wallThick = 24
    //  top to just above upper exit gap
    const upperGapCY = H - FLOOR_H - 229           // player-on-platform Y
    const upperGapH  = PLAYER_H + 22
    const upperTop   = upperGapCY - upperGapH / 2  // top of gap
    const upperBot   = upperGapCY + upperGapH / 2  // bottom of gap
    //  lower exit gap (floor level)
    const lowerGapCY = H - FLOOR_H - PLAYER_H / 2 - 2
    const lowerGapH  = PLAYER_H + 22
    const lowerTop   = lowerGapCY - lowerGapH / 2
    const lowerBot   = lowerGapCY + lowerGapH / 2

    // wall: ceiling → above upper gap
    if (upperTop > 0) {
      this.add.rectangle(wallX, upperTop / 2, wallThick, upperTop, 0x1a1210)
    }
    // wall: below upper gap → above lower gap
    const midH = lowerTop - upperBot
    if (midH > 0) {
      this.add.rectangle(wallX, upperBot + midH / 2, wallThick, midH, 0x1a1210)
    }
    // wall: below lower gap → floor top
    const botH = H - FLOOR_H - lowerBot
    if (botH > 0) {
      this.add.rectangle(wallX, lowerBot + botH / 2, wallThick, botH, 0x1a1210)
    }

    // ── Torch at upper exit ───────────────────────────────────────────────
    const torchX = roomW - 55
    const torchY = upperGapCY - 66

    this.add.rectangle(torchX, torchY + 22, 7, 28, 0x3a2810)          // handle
    this.add.rectangle(torchX, torchY,      12, 20, 0xff9900).setAlpha(0.92)  // outer flame
    this.add.rectangle(torchX, torchY - 8,  8,  14, 0xffcc44).setAlpha(0.88) // inner flame
    this.add.rectangle(torchX, torchY - 14, 4,   8, 0xffffff).setAlpha(0.55) // core
    // warm glow halos
    this.add.rectangle(torchX, torchY, 160, 130, 0xff8800).setAlpha(0.055)
    this.add.rectangle(torchX, torchY,  80,  70, 0xffaa00).setAlpha(0.10)

    // ── Bones near lower exit ─────────────────────────────────────────────
    const bX = roomW - 70
    const bY = H - FLOOR_H - 10
    this.add.rectangle(bX,      bY,     40,  8, 0x383028)
    this.add.rectangle(bX - 11, bY - 7,  8,  8, 0x383028)
    this.add.rectangle(bX + 11, bY - 7,  8,  8, 0x383028)

    // ── Doorway arch on the left (entry) ──────────────────────────────────
    this.add.rectangle(14, (H - FLOOR_H) / 2, 28, H - FLOOR_H, 0x16120a)

    // ── Player ────────────────────────────────────────────────────────────
    buildPlayerTexture(this, this.charConfig)
    this.player = this.physics.add.sprite(160, H - FLOOR_H - PLAYER_H / 2 - 2, 'player_tex')
    this.player.setCollideWorldBounds(true)
    this.physics.add.collider(this.player, floor)
    this.physics.add.collider(this.player, platform)
    this.physics.add.collider(this.player, step)

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
    if (this.input.gamepad) {
      this.input.gamepad.once('connected', pad => { this.gamepad = pad })
    }
  }

  // ── Exit helpers ─────────────────────────────────────────────────────────
  _exitTo(sceneKey) {
    if (this.transitioning) return
    this.transitioning = true
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(sceneKey, { charConfig: this.charConfig })
    })
    this.cameras.main.fadeOut(600, 0, 0, 0)
  }

  update() {
    if (!this.player || !this.cursors || this.transitioning) return

    const H        = this.scale.height
    const W        = this.scale.width
    const roomW    = W * 3
    const onGround = this.player.body.blocked.down

    // ── Gamepad ────────────────────────────────────────────────────────────
    const pad         = this.gamepad
    const padLeft     = pad ? pad.left  || (pad.axes[0] ?? 0) < -0.4 : false
    const padRight    = pad ? pad.right || (pad.axes[0] ?? 0) >  0.4 : false
    const padJumpNow  = pad ? (pad.buttons[0]?.isDown ?? false) : false
    const padJumpJust = padJumpNow && !this.padJumpWasDown
    this.padJumpWasDown = padJumpNow

    // ── Movement ──────────────────────────────────────────────────────────
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

    // ── Exit detection ────────────────────────────────────────────────────
    if (this.player.x > roomW - 120) {
      const exitThreshold = H - FLOOR_H - 140
      if (this.player.y < exitThreshold) {
        // Upper exit — player is elevated (on platform) → correct path
        this._exitTo('GalleryScene')
      } else if (onGround) {
        // Lower exit — player at floor level → wrong path, loop back
        this._exitTo('GameScene')
      }
    }
  }
}
