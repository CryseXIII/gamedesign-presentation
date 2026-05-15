import Phaser from 'phaser'
import {
  buildPlayerTexture,
  PLAYER_W, PLAYER_H, FLOOR_H, MOVE_SPEED, JUMP_VEL,
} from '../spriteData.js'

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
    this.charConfig      = null
    this.roomWidth       = 0
    this.player          = null
    this.cursors         = null
    this.wasd            = null
    this.gamepad         = null
    this.padJumpWasDown  = false
    this.transitioning   = false
  }

  // ─── init: receives data from game.scene.add(…, true, data) or scene.start() ──
  init(data) {
    this.charConfig    = data?.charConfig ?? null
    this.transitioning = false
  }

  // ─── create ──────────────────────────────────────────────────────────────
  create() {
    const W = this.scale.width
    const H = this.scale.height
    this.roomWidth = W * 4

    // ── Background ────────────────────────────────────────────────────────
    this.add.rectangle(this.roomWidth / 2, H / 2, this.roomWidth, H, 0x08080f)

    // Stone pillar atmosphere (decorative only)
    for (let px = 600; px < this.roomWidth - 400; px += 700) {
      this.add
        .rectangle(px, (H - FLOOR_H) / 2, 26, H - FLOOR_H, 0x111118)
        .setAlpha(0.9)
    }

    // ── Floor (static physics body) ───────────────────────────────────────
    const floorY  = H - FLOOR_H / 2
    const floor   = this.add.rectangle(
      this.roomWidth / 2, floorY, this.roomWidth, FLOOR_H, 0x16100a
    )
    this.physics.add.existing(floor, true)

    // Subtle top-edge highlight
    this.add.rectangle(
      this.roomWidth / 2, H - FLOOR_H, this.roomWidth, 3, 0x38260e
    )

    // ── Player texture from pixel-art charConfig ──────────────────────────
    buildPlayerTexture(this, this.charConfig)

    // ── Player sprite ─────────────────────────────────────────────────────
    const startX = 180
    const startY = H - FLOOR_H - PLAYER_H / 2 - 2
    this.player  = this.physics.add.sprite(startX, startY, 'player_tex')
    this.player.setCollideWorldBounds(true)
    this.physics.add.collider(this.player, floor)

    // ── World & camera bounds ─────────────────────────────────────────────
    this.physics.world.setBounds(0, 0, this.roomWidth, H + 600)
    this.cameras.main.setBounds(0, 0, this.roomWidth, H)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.fadeIn(600, 0, 0, 0)

    // ── "Next area" marker at the far right ───────────────────────────────
    this.add.text(
      this.roomWidth - 260,
      H - FLOOR_H - 20,
      '▷  NEXT AREA',
      { fontFamily: '"Cinzel", Georgia, serif', fontSize: '22px', color: '#c9a84c' }
    ).setOrigin(0.5, 1).setAlpha(0.55)

    // ── Input ─────────────────────────────────────────────────────────────
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd    = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    })

    if (this.input.gamepad) {
      this.input.gamepad.once('connected', (pad) => { this.gamepad = pad })
    }
  }

  // ─── update ──────────────────────────────────────────────────────────────
  update() {
    if (!this.player || !this.cursors || this.transitioning) return

    const onGround = this.player.body.blocked.down

    // ── Gamepad state ──────────────────────────────────────────────────────
    const pad         = this.gamepad
    const padLeft     = pad ? (pad.left  || (pad.axes[0] ?? 0) < -0.4) : false
    const padRight    = pad ? (pad.right || (pad.axes[0] ?? 0) > 0.4)  : false
    const padJumpNow  = pad ? (pad.buttons[0]?.isDown ?? false) : false
    const padJumpJust = padJumpNow && !this.padJumpWasDown
    this.padJumpWasDown = padJumpNow

    // ── Movement flags ────────────────────────────────────────────────────
    const goLeft  = this.cursors.left.isDown  || this.wasd.left.isDown  || padLeft
    const goRight = this.cursors.right.isDown || this.wasd.right.isDown || padRight
    const jumpJust =
      Phaser.Input.Keyboard.JustDown(this.cursors.up)    ||
      Phaser.Input.Keyboard.JustDown(this.wasd.up)       ||
      Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
      padJumpJust

    // ── Apply velocity ────────────────────────────────────────────────────
    this.player.setVelocityX(0)
    if (goLeft)  { this.player.setVelocityX(-MOVE_SPEED); this.player.setFlipX(true)  }
    if (goRight) { this.player.setVelocityX( MOVE_SPEED); this.player.setFlipX(false) }
    if (jumpJust && onGround) this.player.setVelocityY(JUMP_VEL)

    // ── Room exit → PlayerGuidanceScene ───────────────────────────────────
    if (this.player.x >= this.roomWidth - 200) {
      this.transitioning = true
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('PlayerGuidanceScene', { charConfig: this.charConfig })
      })
      this.cameras.main.fadeOut(600, 0, 0, 0)
    }
  }
}
