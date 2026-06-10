/**
 * PlayerController
 *
 * Encapsulates the hero physics sprite, animation state machine, and all
 * player input.  Scenes create one instance and call player.update() every
 * frame.  Scenes own collision registration and camera follow.
 *
 * Sprite sheet physics body:
 *   setSize(38, 84)   setOffset(45, 40)   origin (0.5, 0.5)
 *   body top    = sprite.y − 64 + 40 = sprite.y − 24
 *   body bottom = sprite.y − 24 + 84 = sprite.y + 60
 *
 * Spawn Y:   H − FLOOR_H − SPAWN_Y_OFFSET  (places body just above floor)
 *
 * Controls:
 *   A / ← / D / →   move
 *   W / ↑ / Space    jump (double-jump on second press while airborne)
 *   J                directional attack (up/down/left/right selected by input)
 *   E                interact  (exposed via interactJustDown getter)
 *   Gamepad left stick / dpad, A-button jump
 */

import Phaser from 'phaser'
import GameState from './GameState.js'
import {
  getPlayerAnimationKey,
  getPlayerTextureKey,
  registerPlayerAnimations,
} from './animConfig.js'

// ─── Exported constants ────────────────────────────────────────────────────────
export const FLOOR_H        = 80
export const MOVE_SPEED     = 380
export const JUMP_VEL       = -570
export const ATTACK_RANGE   = 88
/**
 * Spawn sprite.y this many px above floor top so the body rests cleanly.
 * Derived from: body bottom offset = setOffset.y + setSize.height - frameH/2
 *               = 40 + 84 − 64 = 60  → SPAWN_Y_OFFSET = 60
 */
export const SPAWN_Y_OFFSET = 60

// ─── State keys ───────────────────────────────────────────────────────────────
const S = {
  IDLE:          'idle',
  RUN:           'run',
  JUMP:          'jump',
  DOUBLE_JUMP:   'double_jump',
  HURT:          'hurt',
  ATTACK_UP:     'attack_up',
  ATTACK_DOWN:   'attack_down',
  ATTACK_LEFT:   'attack_left',
  ATTACK_RIGHT:  'attack_right',
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
    this._gender = GameState.gender || 'male'

    // ── Sprite & physics ──────────────────────────────────────────────────
    this.sprite = scene.physics.add.sprite(x, y, getPlayerTextureKey(this._gender, S.IDLE))
    this.sprite.setOrigin(0.5, 0.5)
    this.sprite.setDisplaySize(128, 128)
    this.sprite.body.setSize(38, 84)
    this.sprite.body.setOffset(45, 40)
    this.sprite.setCollideWorldBounds(true)

    // ── Animations ────────────────────────────────────────────────────────
    registerPlayerAnimations(scene, this._gender)
    this._playAnimationSafely(this._animKey(S.IDLE))

    // ── State machine ──────────────────────────────────────────────────────
    this._state         = S.IDLE
    this._wasOnGround   = false
    this._canDoubleJump = false
    this._hurtUntil     = 0
    this._runFrameKeys  = Array.from({ length: 8 }, (_, i) => getPlayerTextureKey(this._gender, `run_${i}`))

    // ── Input ─────────────────────────────────────────────────────────────
    this._cursors  = scene.input.keyboard.createCursorKeys()
    this._wasd     = scene.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    })
    this._jKey     = scene.input.keyboard.addKey('J')
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

    console.info('[GAMERON] player init', { x, y })
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  get x()     { return this.sprite.x }
  get y()     { return this.sprite.y }
  get body()  { return this.sprite.body }
  get state() { return this._state }
  get attackRange() { return ATTACK_RANGE }

  /**
   * True on the exact frame the player presses E (or equivalent).
   * Scenes use this to trigger interactions without duplicating key bindings.
   */
  get interactJustDown() {
    return Phaser.Input.Keyboard.JustDown(this._eKey)
  }

  get isHurt() {
    return this.scene.time.now < this._hurtUntil
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  _isAttacking() {
    return (
      this._state === S.ATTACK_UP    ||
      this._state === S.ATTACK_DOWN  ||
      this._state === S.ATTACK_LEFT  ||
      this._state === S.ATTACK_RIGHT
    )
  }

  _isAirborne() {
    return this.sprite?.body ? !this.sprite.body.blocked.down : false
  }

  _animKey(state) {
    return getPlayerAnimationKey(this._gender, state)
  }

  _playAnimationSafely(animKey) {
    try {
      if (this.scene.anims.exists(animKey)) {
        this.sprite.play(animKey)
        return true
      }
    } catch (error) {
      console.error('[GAMERON] sprite.play failed, falling back to frame 0', {
        requested: animKey,
        error: error?.message || error,
      })
    }

    if (this.sprite?.setFrame) {
      try {
        this.sprite.setFrame(0)
      } catch {
        // Keep the sprite alive even if the frame can't be set yet.
      }
    }
    return false
  }

  _hasRunFrames() {
    return this._runFrameKeys.every(key => this.scene.textures.exists(key))
  }

  _applyRunTexture(now = this.scene.time.now) {
    if (!this._hasRunFrames()) return
    const frameIndex = Math.floor(now / 90) % this._runFrameKeys.length
    const frameKey = this._runFrameKeys[frameIndex]
    if (this.sprite.texture?.key !== frameKey) {
      this.sprite.setTexture(frameKey)
    }
  }

  _logSpriteDebug(reason) {
    if (!this.sprite) return
    console.info('[GAMERON] player sprite', {
      reason,
      state: this._state,
      texture: this.sprite.texture?.key,
      frame: this.sprite.frame?.name,
      gender: this._gender,
    })
  }

  _groundStateForInput(goLeft, goRight) {
    return goLeft || goRight ? S.RUN : S.IDLE
  }

  _resolveAttackState(goUp, goDown, goLeft, goRight) {
    if (goUp) return S.ATTACK_UP
    if (goDown) return S.ATTACK_DOWN
    if (goLeft) return S.ATTACK_LEFT
    if (goRight) return S.ATTACK_RIGHT
    return this.sprite.flipX ? S.ATTACK_LEFT : S.ATTACK_RIGHT
  }

  /**
   * Transition to a new state and play its animation.
   * No-op if already in that state (prevents animation restart jitter).
   */
  _setState(s) {
    if (this._state === s) return
    console.info('[GAMERON] player state', { from: this._state, to: s })
    this._state = s

    if (s === S.RUN) {
      if (this._hasRunFrames()) {
        this._applyRunTexture()
      }
      return
    }

    const animKey = this._animKey(s)
    if (!this.scene.anims.exists(animKey)) {
      console.error('[GAMERON] missing animation, falling back to idle', { requested: s })
      this._state = S.IDLE
      this._playAnimationSafely(this._animKey(S.IDLE))
      return
    }

    if (!this._playAnimationSafely(animKey)) {
      this._state = S.IDLE
      this._playAnimationSafely(this._animKey(S.IDLE))
      return
    }

    if (s === S.RUN) {
      this._logSpriteDebug('run')
    }
  }

  takeHit(sourceX = null, knockback = 260) {
    const now = this.scene.time.now
    if (now < this._hurtUntil) return false

    this._hurtUntil = now + 750
    this._state = S.HURT

    const awayFromSource = sourceX == null
      ? (this.sprite.flipX ? 1 : -1)
      : (this.sprite.x < sourceX ? -1 : 1)

    this.sprite.setVelocityX(awayFromSource * knockback)
    this.sprite.setVelocityY(-120)
    this.sprite.setTintFill(0xffffff)
    this.sprite.setAlpha(0.35)

    this.sprite.play(this.scene.anims.exists(this._animKey(S.HURT)) ? this._animKey(S.HURT) : this._animKey(S.IDLE))

    this.scene.tweens.killTweensOf(this.sprite)
    this.scene.tweens.add({
      targets: this.sprite,
      alpha:   1,
      duration: 80,
      yoyo:    true,
      repeat:  5,
      onComplete: () => {
        if (this.sprite) {
          this.sprite.clearTint()
          if (this.scene.time.now >= this._hurtUntil) {
            this.sprite.setAlpha(1)
          }
        }
      },
    })

    return true
  }

  _onAnimComplete(key) {
    switch (key) {
      case this._animKey(S.DOUBLE_JUMP):
        this._setState(
          this._isAirborne()
            ? S.JUMP
            : this._groundStateForInput(
              this._cursors.left.isDown || this._wasd.left.isDown,
              this._cursors.right.isDown || this._wasd.right.isDown,
            )
        )
        break

      case this._animKey(S.ATTACK_UP):
      case this._animKey(S.ATTACK_DOWN):
      case this._animKey(S.ATTACK_LEFT):
      case this._animKey(S.ATTACK_RIGHT):
        this._setState(
          this._isAirborne()
            ? S.JUMP
            : this._groundStateForInput(
              this._cursors.left.isDown || this._wasd.left.isDown,
              this._cursors.right.isDown || this._wasd.right.isDown,
            )
        )
        break

      // jump stays active while airborne; grounded transitions are handled in update()
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
    const now       = this.scene.time.now

    if (this._hurtUntil && now >= this._hurtUntil) {
      this._hurtUntil = 0
      this.sprite.clearTint()
      this.sprite.setAlpha(1)
      if (this._state === S.HURT) {
        this._setState(onGround ? S.IDLE : S.JUMP)
      }
    }

    if (this._hurtUntil && now < this._hurtUntil) {
      this._wasOnGround = onGround
      return
    }

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
    const goUp    = this._cursors.up.isDown    || this._wasd.up.isDown
    const goDown  = this._cursors.down?.isDown ?? false
    const jumpJust =
      Phaser.Input.Keyboard.JustDown(this._cursors.up)    ||
      Phaser.Input.Keyboard.JustDown(this._wasd.up)       ||
      Phaser.Input.Keyboard.JustDown(this._spaceKey)      ||
      padJumpJust

    const attackJust = Phaser.Input.Keyboard.JustDown(this._jKey)
    const jumpInputJust = !attackJust && jumpJust
    const moveSpeed = GameState.speedBoostUnlocked ? MOVE_SPEED * 1.5 : MOVE_SPEED

    // ── Flip sprite ──────────────────────────────────────────────────────────
    if (!this._isAttacking()) {
      if (goLeft)  this.sprite.setFlipX(true)
      if (goRight) this.sprite.setFlipX(false)
    }

    // ── Horizontal velocity ──────────────────────────────────────────────────
    if (!this._isAttacking()) {
      if      (goLeft)  this.sprite.setVelocityX(-moveSpeed)
      else if (goRight) this.sprite.setVelocityX( moveSpeed)
      else              this.sprite.setVelocityX(0)
    } else {
      // Dampen momentum during grounded attacks; let air physics run free
      if (onGround) this.sprite.setVelocityX(body.velocity.x * 0.8)
    }

    // ── Jump ─────────────────────────────────────────────────────────────────
    if (jumpInputJust) {
      if (onGround) {
        this.sprite.setVelocityY(JUMP_VEL)
        this._canDoubleJump = true
        this._setState(S.JUMP)
      } else if (this._canDoubleJump && this._state !== S.DOUBLE_JUMP) {
        this._canDoubleJump = false
        this.sprite.setVelocityY(JUMP_VEL * 0.85)
        this._setState(S.DOUBLE_JUMP)
      }
    }

    // ── Airborne state transitions ────────────────────────────────────────────
    if (!onGround && !this._isAttacking()) {
      // Edge case: player walks off a ledge
      if (this._state === S.IDLE || this._state === S.RUN) {
        this._setState(S.JUMP)
      }
    }

    // ── Landing / grounded movement ───────────────────────────────────────────
    if (onGround && !this._isAttacking()) {
      this._canDoubleJump = false
      if (this._state === S.DOUBLE_JUMP || this._state === S.JUMP) {
        this._setState(this._groundStateForInput(goLeft, goRight))
      }
    }

    // ── Combat input ──────────────────────────────────────────────────────────
    if (attackJust && !this._isAttacking()) {
      this._setState(this._resolveAttackState(goUp, goDown, goLeft, goRight))
    }

    // ── Grounded movement animations ──────────────────────────────────────────
    if (
      onGround &&
      !this._isAttacking() &&
      this._state !== S.JUMP &&
      this._state !== S.DOUBLE_JUMP
    ) {
      const nextGroundState = this._groundStateForInput(goLeft, goRight)
      if (this._state !== nextGroundState) {
        this._setState(nextGroundState)
      }
    }

    if (this._state === S.RUN) {
      this._applyRunTexture(now)
      this._logSpriteDebug('run-frame')
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
      this.sprite.setVelocityY(0)
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
