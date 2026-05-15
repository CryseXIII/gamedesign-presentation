/**
 * PlayerController
 *
 * Encapsulates the hero physics sprite, animation state machine, and all
 * player input.  Scenes create one instance and call player.update() every
 * frame.  Scenes own collision registration and camera follow.
 *
 * Sprite sheet physics body:
 *   setSize(38, 84)   setOffset(45, 34)   origin (0.5, 0.5)
 *   body top    = sprite.y − 64 + 34 = sprite.y − 30
 *   body bottom = sprite.y − 30 + 84 = sprite.y + 54
 *
 * Spawn Y:   H − FLOOR_H − SPAWN_Y_OFFSET  (places body just above floor)
 *
 * Controls:
 *   A / ← / D / →   move
 *   W / ↑ / Space    jump (double-jump on second press while airborne)
 *   J                light attack (3-hit combo while grounded; aerial variant)
 *   K                heavy attack (grounded only)
 *   E                interact  (exposed via interactJustDown getter)
 *   Gamepad left stick / dpad, A-button jump
 */

import Phaser from 'phaser'
import { registerAnimations } from './animConfig.js'

// ─── Exported constants ────────────────────────────────────────────────────────
export const FLOOR_H        = 80
export const MOVE_SPEED     = 220
export const JUMP_VEL       = -570
/** Spawn sprite.y this many px above floor top so the body rests cleanly. */
export const SPAWN_Y_OFFSET = 64

// ─── State keys ───────────────────────────────────────────────────────────────
const S = {
  IDLE:        'idle',
  RUN:         'run',
  JUMP_RISE:   'jumpRise',
  FALL:        'fall',
  LAND:        'land',
  DOUBLE_JUMP: 'doubleJump',
  LIGHT1:      'light1',
  LIGHT2:      'light2',
  LIGHT3:      'light3',
  HEAVY:       'heavy',
  AIR_LIGHT:   'airLight',
}

// ─── PlayerController ─────────────────────────────────────────────────────────
export default class PlayerController {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x  Spawn X (world coords)
   * @param {number} y  Spawn Y (world coords)
   */
  constructor(scene, x, y) {
    this.scene = scene

    // ── Sprite & physics ──────────────────────────────────────────────────
    this.sprite = scene.physics.add.sprite(x, y, 'hero')
    this.sprite.setOrigin(0.5, 0.5)
    this.sprite.body.setSize(38, 84)
    this.sprite.body.setOffset(45, 34)
    this.sprite.setCollideWorldBounds(true)

    // ── Animations ────────────────────────────────────────────────────────
    registerAnimations(scene)
    this.sprite.play(S.IDLE)

    // ── State machine ──────────────────────────────────────────────────────
    this._state         = S.IDLE
    this._wasOnGround   = false
    this._canDoubleJump = false
    this._comboQueued   = false

    // ── Input ─────────────────────────────────────────────────────────────
    this._cursors  = scene.input.keyboard.createCursorKeys()
    this._wasd     = scene.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    })
    this._jKey     = scene.input.keyboard.addKey('J')
    this._kKey     = scene.input.keyboard.addKey('K')
    this._eKey     = scene.input.keyboard.addKey('E')
    this._spaceKey = scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    )

    this._gamepad        = null
    this._padJumpWasDown = false

    if (scene.input.gamepad) {
      scene.input.gamepad.on('connected', pad => { this._gamepad = pad })
    }

    // ── Animation complete ─────────────────────────────────────────────────
    this.sprite.on('animationcomplete', (anim) => {
      this._onAnimComplete(anim.key)
    })
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  get x()     { return this.sprite.x }
  get y()     { return this.sprite.y }
  get body()  { return this.sprite.body }
  get state() { return this._state }

  /**
   * True on the exact frame the player presses E (or equivalent).
   * Scenes use this to trigger interactions without duplicating key bindings.
   */
  get interactJustDown() {
    return Phaser.Input.Keyboard.JustDown(this._eKey)
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  _isAttacking() {
    return (
      this._state === S.LIGHT1    ||
      this._state === S.LIGHT2    ||
      this._state === S.LIGHT3    ||
      this._state === S.HEAVY     ||
      this._state === S.AIR_LIGHT
    )
  }

  /**
   * Transition to a new state and play its animation.
   * No-op if already in that state (prevents animation restart jitter).
   */
  _setState(s) {
    if (this._state === s) return
    this._state = s
    this.sprite.play(s)
  }

  _onAnimComplete(key) {
    switch (key) {
      case 'land':
        this._setState(S.IDLE)
        break

      case 'light1':
        if (this._comboQueued) {
          this._comboQueued = false
          this._setState(S.LIGHT2)
        } else {
          this._setState(S.IDLE)
        }
        break

      case 'light2':
        if (this._comboQueued) {
          this._comboQueued = false
          this._setState(S.LIGHT3)
        } else {
          this._setState(S.IDLE)
        }
        break

      case 'light3':
      case 'heavy':
        this._comboQueued = false
        this._setState(S.IDLE)
        break

      case 'airLight':
        this._comboQueued = false
        // Decide based on current physics state
        if (this.sprite.body.blocked.down) {
          this._setState(S.IDLE)
        } else {
          this._setState(S.FALL)
        }
        break

      // jumpRise / doubleJump: fall transition handled in update()
      default:
        break
    }
  }

  // ── Main update ────────────────────────────────────────────────────────────
  /**
   * Call once per frame from the scene's update() method.
   * Do NOT call while a UI overlay is blocking input.
   */
  update() {
    if (!this.sprite || !this.sprite.body) return

    const body      = this.sprite.body
    const onGround  = body.blocked.down
    const velY      = body.velocity.y
    const justLanded = !this._wasOnGround && onGround

    // ── Gamepad ─────────────────────────────────────────────────────────────
    const pad          = this._gamepad
    const padLeft      = pad ? (pad.left  || (pad.axes[0] ?? 0) < -0.4) : false
    const padRight     = pad ? (pad.right || (pad.axes[0] ?? 0) >  0.4) : false
    const padJumpNow   = pad ? (pad.buttons[0]?.isDown ?? false) : false
    const padJumpJust  = padJumpNow && !this._padJumpWasDown
    this._padJumpWasDown = padJumpNow

    // ── Directional + jump input ─────────────────────────────────────────────
    const goLeft  = this._cursors.left.isDown  || this._wasd.left.isDown  || padLeft
    const goRight = this._cursors.right.isDown || this._wasd.right.isDown || padRight
    const jumpJust =
      Phaser.Input.Keyboard.JustDown(this._cursors.up)    ||
      Phaser.Input.Keyboard.JustDown(this._wasd.up)       ||
      Phaser.Input.Keyboard.JustDown(this._spaceKey)      ||
      padJumpJust

    const lightJust = Phaser.Input.Keyboard.JustDown(this._jKey)
    const heavyJust = Phaser.Input.Keyboard.JustDown(this._kKey)

    // ── Flip sprite ──────────────────────────────────────────────────────────
    if (!this._isAttacking()) {
      if (goLeft)  this.sprite.setFlipX(true)
      if (goRight) this.sprite.setFlipX(false)
    }

    // ── Horizontal velocity ──────────────────────────────────────────────────
    if (!this._isAttacking()) {
      if      (goLeft)  this.sprite.setVelocityX(-MOVE_SPEED)
      else if (goRight) this.sprite.setVelocityX( MOVE_SPEED)
      else              this.sprite.setVelocityX(0)
    } else {
      // Dampen momentum during grounded attacks; let air physics run free
      if (onGround) this.sprite.setVelocityX(body.velocity.x * 0.8)
    }

    // ── Jump ─────────────────────────────────────────────────────────────────
    if (jumpJust) {
      if (onGround) {
        this.sprite.setVelocityY(JUMP_VEL)
        this._canDoubleJump = true
        this._setState(S.JUMP_RISE)
      } else if (this._canDoubleJump && this._state !== S.DOUBLE_JUMP) {
        this._canDoubleJump = false
        this.sprite.setVelocityY(JUMP_VEL * 0.85)
        this._setState(S.DOUBLE_JUMP)
      }
    }

    // ── Airborne state transitions ────────────────────────────────────────────
    if (!onGround && !justLanded) {
      if (
        (this._state === S.JUMP_RISE || this._state === S.DOUBLE_JUMP) &&
        velY > 50
      ) {
        this._setState(S.FALL)
      }
      // Edge case: player walks off a ledge
      if (this._state === S.IDLE || this._state === S.RUN) {
        this._setState(velY < 0 ? S.JUMP_RISE : S.FALL)
      }
    }

    // ── Landing ──────────────────────────────────────────────────────────────
    if (justLanded) {
      this._canDoubleJump = false
      if (this._state !== S.LAND) {
        this._setState(S.LAND)
      }
    }

    // ── Combat input ──────────────────────────────────────────────────────────
    if (lightJust) {
      if (onGround && !this._isAttacking()) {
        this._comboQueued = false
        this._setState(S.LIGHT1)
      } else if (
        onGround &&
        (this._state === S.LIGHT1 || this._state === S.LIGHT2)
      ) {
        // Buffer next combo hit
        this._comboQueued = true
      } else if (!onGround && this._state !== S.AIR_LIGHT) {
        this._setState(S.AIR_LIGHT)
      }
    }

    if (heavyJust && onGround && !this._isAttacking()) {
      this._setState(S.HEAVY)
    }

    // ── Grounded movement animations ──────────────────────────────────────────
    if (
      onGround &&
      !this._isAttacking() &&
      this._state !== S.LAND &&
      this._state !== S.JUMP_RISE
    ) {
      if (goLeft || goRight) {
        if (this._state !== S.RUN)  this._setState(S.RUN)
      } else {
        if (this._state !== S.IDLE) this._setState(S.IDLE)
      }
    }

    this._wasOnGround = onGround
  }

  /**
   * Halt movement and hold the current velocity.
   * Call when a UI overlay is showing and player.update() is skipped.
   */
  halt() {
    if (this.sprite && this.sprite.body) {
      this.sprite.setVelocityX(0)
    }
  }

  /**
   * Remove the sprite and clean up.  Call from scene's shutdown() lifecycle.
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy()
      this.sprite = null
    }
  }
}
