/**
 * PlayerController
 *
 * Controls:
 *   A / ←  / D / →   move left / right
 *   SPACE             jump (double-jump on second press while airborne)
 *   ↓ / S  + SPACE    drop through one-way platforms
 *   J                 attack (direction from held keys)
 *   E                 interact  (exposed via interactJustDown getter)
 *   Gamepad: left stick / dpad, A-button jump
 *
 * Physics body (display size 128×128, origin 0.5):
 *   setSize(38, 84)   setOffset(45, 40)
 *   body top    = sprite.y − 64 + 40 = sprite.y − 24
 *   body bottom = sprite.y − 24 + 84 = sprite.y + 60
 *
 * Spawn Y: H − FLOOR_H − SPAWN_Y_OFFSET  (body bottom flush with floor top)
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
/** Spawn sprite.y so physics body bottom rests on floor top. */
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
  constructor(scene, x, y) {
    this.scene   = scene
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

    // ── State machine ─────────────────────────────────────────────────────
    this._state         = S.IDLE
    this._wasOnGround   = false
    this._canDoubleJump = false
    this._hurtUntil     = 0
    this._moveDirection = 0

    // ── Drop-through ──────────────────────────────────────────────────────
    this._dropThroughMode = false
    this._dropTimer       = null

    // ── Input ─────────────────────────────────────────────────────────────
    this._cursors  = scene.input.keyboard.createCursorKeys()
    this._wasd     = scene.input.keyboard.addKeys({
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
    })
    this._jKey     = scene.input.keyboard.addKey('J')
    this._eKey     = scene.input.keyboard.addKey('E')
    this._spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    this._gamepad        = null
    this._padJumpWasDown = false
    this._jumpRequested  = false
    this._frozen         = false

    // Single keydown listener for jump (event-based, reliable on all browsers)
    this._onJumpKeyDown = () => { this._jumpRequested = true }
    scene.input.keyboard.on('keydown-SPACE', this._onJumpKeyDown)
    scene.input.keyboard.on('keydown-UP',    this._onJumpKeyDown)

    if (scene.input.gamepad) {
      scene.input.gamepad.on('connected', pad => { this._gamepad = pad })
    }

    // ── Animation complete ─────────────────────────────────────────────────
    this.sprite.on('animationcomplete', (anim) => {
      this._onAnimComplete(anim.key)
    })

    console.info('[GAMERON] player init', { x, y, gender: this._gender })
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  get x()     { return this.sprite.x }
  get y()     { return this.sprite.y }
  get body()  { return this.sprite.body }
  get state() { return this._state }
  get attackRange() { return ATTACK_RANGE }
  /** True while drop-through mode is active (platform colliders should pass through). */
  get dropThrough() { return this._dropThroughMode }

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
    } catch (err) {
      console.warn('[GAMERON] play failed', { animKey, err: err?.message })
    }
    try { this.sprite.setFrame(0) } catch {}
    return false
  }

  _groundStateForInput(goLeft, goRight) {
    return goLeft || goRight ? S.RUN : S.IDLE
  }

  _resolveAttackState(goUp, goDown, goLeft, goRight) {
    if (goUp)    return S.ATTACK_UP
    if (goDown)  return S.ATTACK_DOWN
    if (goLeft)  return S.ATTACK_LEFT
    if (goRight) return S.ATTACK_RIGHT
    return this.sprite.flipX ? S.ATTACK_LEFT : S.ATTACK_RIGHT
  }

  _setState(s) {
    if (this._state === s) return
    this._state = s

    const animKey = this._animKey(s)
    if (!this._playAnimationSafely(animKey) && s !== S.IDLE) {
      // fallback to idle
      this._state = S.IDLE
      this._playAnimationSafely(this._animKey(S.IDLE))
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

    const hurtKey = this._animKey(S.HURT)
    this.sprite.play(this.scene.anims.exists(hurtKey) ? hurtKey : this._animKey(S.IDLE))

    this.scene.tweens.killTweensOf(this.sprite)
    this.scene.tweens.add({
      targets: this.sprite, alpha: 1, duration: 80, yoyo: true, repeat: 5,
      onComplete: () => {
        if (this.sprite) {
          this.sprite.clearTint()
          if (this.scene.time.now >= this._hurtUntil) this.sprite.setAlpha(1)
        }
      },
    })

    return true
  }

  _onAnimComplete(key) {
    switch (key) {
      case this._animKey(S.DOUBLE_JUMP):
        this._setState(this._isAirborne()
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
        this._setState(this._isAirborne()
          ? S.JUMP
          : this._groundStateForInput(
            this._cursors.left.isDown || this._wasd.left.isDown,
            this._cursors.right.isDown || this._wasd.right.isDown,
          )
        )
        break

      default:
        break
    }
  }

  // ── Main update ────────────────────────────────────────────────────────────
  update() {
    if (!this.sprite || !this.sprite.body) return
    if (this._frozen) return

    const body     = this.sprite.body
    const onGround = !!(body.blocked.down || body.touching.down || (typeof body.onFloor === 'function' && body.onFloor()))
    const now      = this.scene.time.now

    // ── Hurt recovery ────────────────────────────────────────────────────────
    if (this._hurtUntil && now >= this._hurtUntil) {
      this._hurtUntil = 0
      this.sprite.clearTint()
      this.sprite.setAlpha(1)
      if (this._state === S.HURT) this._setState(onGround ? S.IDLE : S.JUMP)
    }
    if (this._hurtUntil && now < this._hurtUntil) {
      this._wasOnGround = onGround
      return
    }

    // ── Gamepad ──────────────────────────────────────────────────────────────
    const pad          = this._gamepad
    const padLeft      = pad ? (pad.left  || (pad.axes[0] ?? 0) < -0.4) : false
    const padRight     = pad ? (pad.right || (pad.axes[0] ?? 0) >  0.4) : false
    const padJumpNow   = pad ? (pad.buttons[0]?.isDown ?? false) : false
    const padJumpJust  = padJumpNow && !this._padJumpWasDown
    this._padJumpWasDown = padJumpNow

    // ── Directional input ────────────────────────────────────────────────────
    const rawLeft  = this._cursors.left.isDown  || this._wasd.left.isDown  || padLeft
    const rawRight = this._cursors.right.isDown || this._wasd.right.isDown || padRight
    if      (rawLeft  && !rawRight) this._moveDirection = -1
    else if (rawRight && !rawLeft)  this._moveDirection =  1
    else if (!rawLeft && !rawRight) this._moveDirection =  0

    const goLeft  = this._moveDirection < 0
    const goRight = this._moveDirection > 0
    const goUp    = this._cursors.up?.isDown ?? false
    const goDown  = this._cursors.down?.isDown || this._wasd.down?.isDown || false

    // Consume jump request (event-based + pad)
    const jumpWanted = this._jumpRequested || padJumpJust
    this._jumpRequested = false

    const attackJust   = Phaser.Input.Keyboard.JustDown(this._jKey)
    const moveSpeed    = GameState.speedBoostUnlocked ? MOVE_SPEED * 1.5 : MOVE_SPEED

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
      if (onGround) this.sprite.setVelocityX(body.velocity.x * 0.8)
    }

    // ── Jump / drop-through ──────────────────────────────────────────────────
    if (jumpWanted && !attackJust) {
      if (onGround && goDown) {
        // Drop through one-way platforms
        this._dropThroughMode = true
        if (this._dropTimer) this._dropTimer.remove()
        this._dropTimer = this.scene.time.delayedCall(280, () => {
          this._dropThroughMode = false
        })
      } else if (onGround) {
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
      if (this._state === S.IDLE || this._state === S.RUN) this._setState(S.JUMP)
    }

    // ── Landing ───────────────────────────────────────────────────────────────
    if (onGround && !this._isAttacking()) {
      this._canDoubleJump = false
      if (this._state === S.DOUBLE_JUMP || this._state === S.JUMP) {
        this._setState(this._groundStateForInput(goLeft, goRight))
      }
    }

    // ── Combat ────────────────────────────────────────────────────────────────
    if (attackJust && !this._isAttacking()) {
      this._setState(this._resolveAttackState(goUp, goDown, goLeft, goRight))
    }

    // ── Ground movement animations ────────────────────────────────────────────
    if (onGround && !this._isAttacking() && this._state !== S.JUMP && this._state !== S.DOUBLE_JUMP) {
      const next = this._groundStateForInput(goLeft, goRight)
      if (this._state !== next) this._setState(next)
    }

    this._wasOnGround = onGround
  }

  /**
   * Freeze the player in place (gravity + velocity disabled).
   * Use during dialogs / cutscenes.
   */
  freeze() {
    if (!this.sprite?.body) return
    this._frozen = true
    this.sprite.setVelocityX(0)
    this.sprite.setVelocityY(0)
    this.sprite.body.setAllowGravity(false)
  }

  /**
   * Restore normal physics after freeze().
   */
  unfreeze() {
    this._frozen = false
    if (this.sprite?.body) this.sprite.body.setAllowGravity(true)
  }

  /** Halt horizontal velocity. For use in scenes that also manually clamp. */
  halt() {
    if (this.sprite && this.sprite.body) {
      this.sprite.setVelocityX(0)
      this.sprite.setVelocityY(0)
    }
  }

  destroy() {
    if (this.sprite) {
      this.sprite.destroy()
      this.sprite = null
    }
    if (this.scene?.input?.keyboard && this._onJumpKeyDown) {
      this.scene.input.keyboard.off('keydown-SPACE', this._onJumpKeyDown)
      this.scene.input.keyboard.off('keydown-UP',    this._onJumpKeyDown)
    }
    if (this._dropTimer) {
      this._dropTimer.remove()
      this._dropTimer = null
    }
  }
}
