/**
 * WorldBuildingScene — Scene 1
 *
 * World width: W * 11
 *
 *   Intro   (0    → W*3 ):  Wide backdrop, backstory fades, speedup succubus,
 *                            and a time barrier gate before the forest.
 *   Zone 2  (W*2  → W*8 ):  Steppe path. Backstory portrait stations 3/5/7.
 *                            Storm overlays this zone:
 *                              – rain starts as soon as player enters (stormProgress > 0)
 *                              – lightning adds when stormProgress > 0.5
 * Exit: player.x >= roomWidth − 180 → fade → PlayerGuidanceScene
 *
 * Window events dispatched (→ React):
 *   'game:encounterChoice'   { id: 'speedup_succubus' }
 *
 * Window events received (← React):
 *   'game:encounterDecision' { decision: 'speedup' | 'cancel' }
 */

import Phaser from 'phaser'
import PlayerController, { FLOOR_H, SPAWN_Y_OFFSET } from '../PlayerController.js'
import GameState from '../GameState.js'

// ─── Zone X boundaries (multiples of scene width W) ──────────────────────────
const ZONE = { Z1: 0, Z2: 1.5, WIDOW: 5, END: 7 }

// ─── Portrait stations in Zone 2 (W units) ───────────────────────────────────
const PORTRAIT_STATIONS = [2, 3.2, 4.4]

// ─── Widow encounter ──────────────────────────────────────────────────────────
const WIDOW_X_FACTOR  = 6
const WIDOW_HP        = 100
const HIT_DAMAGE      = 25
const ATTACK_STATES   = ['attack_up', 'attack_down', 'attack_left', 'attack_right']

export default class WorldBuildingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldBuildingScene' })
    this._player        = null
    this._transitioning = false
    this._floor         = null
    this._powerKey      = null

    this._introBackdropWidth = 0
    this._introCleared       = false
    this._speedBoostUnlocked = false
    this._succubusDone       = false
    this._succubusHintVisible = false
    this._widowTriggerX      = Number.NaN

    // encounter state
    this._encounterDone   = false
    this._encounterActive = false
    this._widowCancelled  = false
    this._widowHp         = WIDOW_HP
    this._decisionHandler = null
    this._lastPlayerState = null

    this._timeBarrier = null
    this._diamondBurst = null

    // particles
    this._fireEmitters  = []
    this._smokeEmitters = []
    this._rainEmitter   = null
    this._stormProgress = 0
    this._lightningActive = false

    // portraits
    this._portraits = []

    // lightning
    this._lightningTimer = null

    this._succubusBlocker = null
  }

  // ─── init ──────────────────────────────────────────────────────────────────
  init() {
    this._transitioning   = false
    this._encounterDone   = false
    this._encounterActive = false
    this._widowCancelled  = false
    this._widowHp         = WIDOW_HP
    this._stormProgress   = 0
    this._lightningActive = false
    this._lastPlayerState = null
    this._speedBoostUnlocked = false
    this._succubusDone = false
    this._succubusHintVisible = false
    this._widowTriggerX = Number.NaN
    this._introBackdropWidth = 0
    this._introCleared = false
    this._timeBarrier = null
    this._diamondBurst = null
    this._succubusBlocker = null
  }

  // ─── create ────────────────────────────────────────────────────────────────
  create() {
    const W  = this.scale.width
    const H  = this.scale.height
    this._W  = W
    this._H  = H
    const RW = W * ZONE.END
    this._roomWidth = RW

    // ── World & camera ────────────────────────────────────────────────────
    this.physics.world.setBounds(0, 0, RW, H + 600)
    this.cameras.main.setBounds(0, 0, RW, H)
    this.cameras.main.setZoom(1.08)
    this.cameras.main.setRoundPixels(true)

    // ── Backgrounds ───────────────────────────────────────────────────────
    this._buildBackgrounds(W, H, RW)

    // ── Floor ─────────────────────────────────────────────────────────────
    const floorRect = this.add.rectangle(RW / 2, H - FLOOR_H / 2, RW, FLOOR_H, 0x16100a)
    this.physics.add.existing(floorRect, true)
    this._floor = floorRect
    this.add.rectangle(RW / 2, H - FLOOR_H, RW, 2, 0x38260e)

    // Invisible safety floor below the visible strip so the intro cannot tunnel through.
    const safetyFloor = this.add.rectangle(RW / 2, H + 30, RW, 220, 0x000000).setAlpha(0)
    this.physics.add.existing(safetyFloor, true)
    this._safetyFloor = safetyFloor

    // ── Zones ─────────────────────────────────────────────────────────────
    this._buildZone1(W, H)
    this._buildSpeedupSuccubus(W, H)
    this._buildTimeBarrier(W, H)
    this._buildZone2(W, H)
    this._buildStormOverlay(W, H)

    // ── Player ────────────────────────────────────────────────────────────
    this._player = new PlayerController(this, 200, H - FLOOR_H - SPAWN_Y_OFFSET - 12)
    this.physics.add.collider(this._player.sprite, floorRect)
    this.physics.add.collider(this._player.sprite, safetyFloor)
    this.physics.add.collider(this._player.sprite, this._fireWall)
    if (this._succubusBlocker) {
      this.physics.add.collider(this._player.sprite, this._succubusBlocker)
    }
    if (this._timeBarrier?.body) {
      this.physics.add.collider(this._player.sprite, this._timeBarrier.body)
    }
    this.cameras.main.startFollow(this._player.sprite, true, 0.08, 0.08)
    this.cameras.main.setDeadzone(Math.round(W * 0.22), Math.round(H * 0.24))
    this.cameras.main.fadeIn(800, 0, 0, 0)

    this._powerKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K)

    // ── Encounter decision listener ───────────────────────────────────────
    this._decisionHandler = (e) => this._onEncounterDecision(e.detail)
    window.addEventListener('game:encounterDecision', this._decisionHandler)
  }

  // ─── Backgrounds ───────────────────────────────────────────────────────────
  _buildBackgrounds(W, H, RW) {
    // Single backdrop stretched across the entire scene; other bg images are not needed.
    if (this.textures.exists('wb_bg_intro')) {
      this.add.image(RW / 2, H / 2, 'wb_bg_intro')
        .setDisplaySize(RW, H)
        .setDepth(-10)
      this._introBackdropWidth = RW
    }
  }

  _zoneRect(xStart, xEnd, W, H, color) {
    const zW = xEnd - xStart
    this.add.rectangle(xStart + zW / 2, H / 2, zW, H, color).setDepth(-20)
  }

  // ─── Zone 1: Burning Village ────────────────────────────────────────────────
  _buildZone1(W, H) {
    // Fire wall — blocks left edge
    const fireWall = this.add.rectangle(10, H / 2, 20, H, 0xff4400).setAlpha(0)
    this.physics.add.existing(fireWall, true)
    this._fireWall = fireWall

    // Ambient orange glow over Zone 1
    this.add.rectangle(W * ZONE.Z2 / 2, H / 2, W * ZONE.Z2, H, 0xff2200)
      .setAlpha(0.04)
      .setDepth(-1)
  }

  _spawnFireColumn(x, y, size) {
    const em = this.add.particles(x, y, undefined, {
      lifespan:  { min: 350, max: 650 },
      speed:     { min: 20,  max: 55 },
      angle:     { min: 260, max: 280 },
      scale:     { start: size / 8, end: 0 },
      alpha:     { start: 0.85, end: 0 },
      tint:      [0xff6600, 0xff3300, 0xffaa00],
      quantity:  1,
      frequency: 60,
      blendMode: 'ADD',
    })
    em.setDepth(2)
    this._fireEmitters.push(em)
  }

  _spawnSmokeColumn(x, y) {
    const em = this.add.particles(x, y, undefined, {
      lifespan:  { min: 1200, max: 2200 },
      speed:     { min: 15,   max: 35 },
      angle:     { min: 250,  max: 270 },
      gravityY:  -20,
      scale:     { start: 1.2, end: 3.5 },
      alpha:     { start: 0.22, end: 0 },
      tint:      0x222222,
      quantity:  1,
      frequency: 120,
    })
    em.setDepth(3)
    this._smokeEmitters.push(em)
  }

  _buildSpeedupSuccubus(W, H) {
    const x = W * WIDOW_X_FACTOR - 180
    const y = H - FLOOR_H
    const spriteH = Math.round(H * 0.56)
    const spriteW = Math.round(spriteH * 0.72)
    this._succubusX = x
    this._succubusY = y

    const glow = this.add.circle(x, y - Math.round(spriteH * 0.55), 98, 0x5cbcff, 0.14).setDepth(2)
    const body = this.add.image(x, y, 'wb_speedup_succubus')
      .setOrigin(0.5, 1)
      .setDisplaySize(spriteW, spriteH)
      .setDepth(3)

    this._succubusName = this.add.text(x, y - spriteH - 18, 'SPEEDUP SUCCUBUS', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize: '15px',
      color: '#b8e9ff',
      stroke: '#052238',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5).setAlpha(0.78)

    this._succubusHint = this.add.text(x, y - Math.round(spriteH * 0.12), '[ E ]  REDEN', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize: '16px',
      color: '#d4f4ff',
      stroke: '#032040',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5).setAlpha(0)

    this._succubusBlocker = this.add.rectangle(x, y - Math.round(spriteH * 0.48), spriteW + 28, Math.round(spriteH * 0.9), 0x000000)
      .setAlpha(0)
    this.physics.add.existing(this._succubusBlocker, true)

    this._succubusNode = { glow, body }
  }

  _buildTimeBarrier(W, H) {
    const width = 54
    const height = Math.min(180, Math.round(H * 0.34))
    const x = W * WIDOW_X_FACTOR + 140
    const y = H - FLOOR_H - height / 2 - 8

    const body = this.add.rectangle(x, y, width, height, 0x0d285f)
      .setDepth(4)

    const glow = this.add.rectangle(x, y, width + 18, height + 18, 0x5a8dff, 0.12)
      .setDepth(3)

    const silhouette = this.add.rectangle(x, y, width + 8, height + 8, 0x0f6ecf, 0.16)
      .setDepth(4)
      .setVisible(false)

    const label = this.add.text(x, y - height / 2 - 28, '01:00', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#001328',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5)

    this.physics.add.existing(body, true)

    this._timeBarrier = {
      x,
      y,
      width,
      height,
      body,
      glow,
      silhouette,
      label,
      state: 'active',
      cycleEndsAt: 0,
      hiddenUntil: 0,
      blinkTween: null,
    }

    this._syncTimeBarrierActive()
    this._setTimeBarrierTimer(60)
  }

  _syncTimeBarrierActive() {
    const barrier = this._timeBarrier
    if (!barrier) return

    barrier.body.visible = true
    barrier.body.body.enable = true
    barrier.glow.visible = true
    barrier.silhouette.visible = false
    barrier.silhouette.setAlpha(0.16)
    barrier.label.setAlpha(1)

    if (barrier.blinkTween) {
      barrier.blinkTween.stop()
      barrier.blinkTween = null
    }
  }

  _hideTimeBarrier() {
    const barrier = this._timeBarrier
    if (!barrier || barrier.state === 'hidden') return

    barrier.state = 'hidden'
    barrier.hiddenUntil = this.time.now + 5000
    barrier.body.visible = false
    barrier.body.body.enable = false
    barrier.glow.visible = false
    barrier.label.setText('RELOAD 05')

    barrier.silhouette.visible = true
    barrier.silhouette.setAlpha(0.12)
    barrier.blinkTween = this.tweens.add({
      targets: barrier.silhouette,
      alpha: 0.48,
      duration: 220,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  _showTimeBarrier(resetTimer = true) {
    const barrier = this._timeBarrier
    if (!barrier) return

    barrier.state = 'active'
    barrier.hiddenUntil = 0
    barrier.cycleEndsAt = this.time.now + 60000
    this._syncTimeBarrierActive()
    if (resetTimer) {
      this._setTimeBarrierTimer(60)
    }
  }

  _setTimeBarrierTimer(secondsLeft) {
    const barrier = this._timeBarrier
    if (!barrier) return
    const safe = Math.max(0, secondsLeft)
    barrier.label.setText(`${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`)
  }

  _updateTimeBarrier() {
    const barrier = this._timeBarrier
    if (!barrier) return

    const now = this.time.now

    if (barrier.state === 'active') {
      const remaining = Math.max(0, Math.ceil((barrier.cycleEndsAt - now) / 1000))
      this._setTimeBarrierTimer(remaining)
      if (remaining <= 0) {
        this._hideTimeBarrier()
      }
      return
    }

    const hiddenLeft = Math.max(0, Math.ceil((barrier.hiddenUntil - now) / 1000))
    barrier.label.setText(`RELOAD ${String(hiddenLeft).padStart(2, '0')}`)
    if (hiddenLeft <= 0) {
      this._showTimeBarrier(true)
    }
  }

  _burstDiamond(fromX, fromY, toX, toY) {
    const diamond = this.add.graphics().setDepth(12)
    diamond.fillStyle(0xbfe9ff, 1)
    diamond.fillTriangle(0, -10, 10, 0, 0, 10)
    diamond.fillTriangle(0, -10, -10, 0, 0, 10)

    const state = { x: fromX, y: fromY }
    const sync = () => diamond.setPosition(state.x, state.y)
    sync()

    this.tweens.add({
      targets: state,
      x: toX,
      y: toY,
      duration: 280,
      ease: 'Sine.easeOut',
      onUpdate: sync,
      onComplete: () => {
        this.tweens.add({
          targets: diamond,
          alpha: 0,
          duration: 120,
          onComplete: () => diamond.destroy(),
        })
      },
    })
  }

  _triggerTimeBarrierBurst() {
    if (!this._speedBoostUnlocked || !this._timeBarrier || this._timeBarrier.state !== 'active') return
    this._burstDiamond(this._player.x + 34, this._player.y - 54, this._timeBarrier.x, this._timeBarrier.y - 16)
    this._hideTimeBarrier()
  }

  _showSuccubusPrompt(show) {
    if (!this._succubusHint) return
    if (this._succubusHintVisible === show) return
    this._succubusHintVisible = show
    this.tweens.killTweensOf(this._succubusHint)
    this._succubusHint.setAlpha(show ? 1 : 0)
    if (show) {
      this.tweens.add({
        targets: this._succubusHint,
        alpha: 0.4,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }
  }

  _updateSpeedupSection(playerX) {
    if (!this._succubusDone && this._succubusHint) {
      const nearSuccubus = Math.abs(playerX - this._succubusX) < 140
      this._showSuccubusPrompt(nearSuccubus && !this._encounterActive)
      if (nearSuccubus && !this._encounterActive && this._player.interactJustDown) {
        this._encounterActive = true
        window.dispatchEvent(new CustomEvent('game:encounterChoice', {
          detail: { id: 'speedup_succubus' },
        }))
      }
    } else {
      this._showSuccubusPrompt(false)
    }

    if (this._speedBoostUnlocked && this._timeBarrier && this._timeBarrier.state === 'active') {
      const nearBarrier = Math.abs(playerX - this._timeBarrier.x) < 190
      if (nearBarrier && this._powerKey && Phaser.Input.Keyboard.JustDown(this._powerKey)) {
        this._triggerTimeBarrierBurst()
      }
    }
  }

  // ─── Zone 2: Steppe Portraits ───────────────────────────────────────────────
  _buildZone2(W, H) {
    const gender = GameState.gender

    for (let i = 0; i < PORTRAIT_STATIONS.length; i++) {
      const centerX = W * PORTRAIT_STATIONS[i]
      const keyBase = `wb_portrait_${gender}_${i + 1}`
      let portraitObj

      if (this.textures.exists(keyBase)) {
        const img = this.textures.get(keyBase).getSourceImage()
        const targetH = Math.round(H * 0.62)
        const aspect = img ? (img.width / img.height) : 0.7
        const targetW = Math.max(140, Math.min(Math.round(targetH * aspect), Math.round(W * 0.2)))
        portraitObj = this.add.image(centerX, H / 2 - FLOOR_H, keyBase)
          .setDisplaySize(targetW, targetH)
          .setDepth(1)
          .setAlpha(0)
      } else {
        portraitObj = this.add.rectangle(centerX, H / 2 - FLOOR_H, Math.round(W * 0.18), Math.round(H * 0.62), 0x1a1208)
          .setDepth(1)
          .setAlpha(0)
        this.add.text(centerX, H / 2 - FLOOR_H, `missing_id:${keyBase}`, {
          fontFamily: '"Cinzel", Georgia, serif',
          fontSize:   '11px',
          color:      '#4a3820',
        }).setOrigin(0.5).setDepth(2).setAlpha(0)
      }

      this._portraits.push({ obj: portraitObj, centerX, fadeRadius: W * 0.8 })
    }
  }

  // ─── Storm overlay (covers Zone 2 progressively) ───────────────────────────
  _buildStormOverlay(W, H) {
    // Full-screen dark overlay fixed to camera
    this._stormOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x080a12)
      .setScrollFactor(0)
      .setAlpha(0)
      .setDepth(4)

    // Rain emitter in world space — position updated each frame to follow camera
    this._rainEmitter = this.add.particles(0, -30, undefined, {
      lifespan:  { min: 400, max: 700 },
      speedY:    { min: 300, max: 500 },
      speedX:    { min: 20,  max: 60 },
      scaleX:    0.04,
      scaleY:    { min: 0.4, max: 0.8 },
      alpha:     { start: 0.55, end: 0 },
      tint:      0x8899cc,
      quantity:  3,
      frequency: 16,
      emitZone:  { type: 'random', source: new Phaser.Geom.Rectangle(0, 0, W, 10) },
    })
    this._rainEmitter.setDepth(5).setActive(false).setVisible(false)

    // Lightning timer — fires every 4-8 s; only triggers when _lightningActive
    this._lightningTimer = this.time.addEvent({
      delay:         Phaser.Math.Between(4000, 8000),
      loop:          true,
      callback:      this._flashLightning,
      callbackScope: this,
    })
  }

  _flashLightning() {
    if (!this._lightningActive) return
    this.cameras.main.flash(120, 200, 220, 255, true)
    this._lightningTimer.delay = Phaser.Math.Between(4000, 8000)
  }

    // Scene 1 no longer spawns Widow; that encounter is reserved for the next screen.
    // ─── Encounter decision ─────────────────────────────────────────────────────
  _onEncounterDecision(detail) {
    if (!this._encounterActive) return
    this._encounterActive = false

    const decision = detail?.decision ?? 'cancel'

    if (decision === 'speedup') {
      this._succubusDone = true
      this._speedBoostUnlocked = true
      GameState.speedBoostUnlocked = true
      if (this._succubusBlocker) {
        this._succubusBlocker.body.enable = false
        this._succubusBlocker.destroy()
        this._succubusBlocker = null
      }
      const fadeOut = (t) => { if (t) this.tweens.add({ targets: t, alpha: 0, duration: 350, onComplete: () => t.destroy?.() }) }
      fadeOut(this._succubusNode?.glow)
      fadeOut(this._succubusNode?.body)
      fadeOut(this._succubusName)
      fadeOut(this._succubusHint)
      this._showSuccubusPrompt(false)
      return
    }

    if (decision === 'pay') {
      // Player chose the gacha store
      GameState.recordChoice('gacha')
      this._defeatWidow()
    } else {
      // Player cancelled — show J-prompt; organic combat or walk past
      this._widowCancelled = true
      this._showJPrompt()
    }
  }

  _showJPrompt() {
    if (!this._jPrompt) return
    this._jPrompt.setAlpha(1)
    this.tweens.add({
      targets:  this._jPrompt,
      alpha:    0.2,
      duration: 700,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
    })
  }

  _hideJPrompt() {
    if (!this._jPrompt) return
    this.tweens.killTweensOf(this._jPrompt)
    this._jPrompt.setAlpha(0)
  }

  _applyHitToWidow() {
    this._widowHp = Math.max(0, this._widowHp - HIT_DAMAGE)

    // Update HP bar width
    if (this._widowHpBar) {
      const frac = this._widowHp / WIDOW_HP
      this._widowHpBar.setDisplaySize(this._widowHpBarW * frac, 8)
    }

    // Flash widow
    if (this._widowSprite) {
      this.tweens.add({ targets: this._widowSprite, alpha: 0.3, duration: 80, yoyo: true })
    }

    if (this._widowHp <= 0) {
      GameState.recordChoice('fight')
      this._defeatWidow()
    }
  }

  _defeatWidow() {
    this._encounterDone = true
    this._hideJPrompt()
    const fade = (t) => { if (t) this.tweens.add({ targets: t, alpha: 0, duration: 500 }) }
    fade(this._widowSprite)
    fade(this._widowLabel)
    fade(this._widowHpBg)
    fade(this._widowHpBar)
  }

  // ─── Portrait fading ────────────────────────────────────────────────────────
  _updatePortraits(playerX) {
    for (const p of this._portraits) {
      const dist  = Math.abs(playerX - p.centerX)
      const alpha = Math.max(0, 1 - dist / p.fadeRadius) * 0.82
      if (p.obj && p.obj.setAlpha) p.obj.setAlpha(alpha)
    }
  }

  // ─── Storm progress (overlays Zone 2, lerped) ───────────────────────────────
  _updateStormAndRain(playerX) {
    const W       = this._W
    const z2Start = W * ZONE.Z2
    const z2End   = W * ZONE.WIDOW
    const raw     = (playerX - z2Start) / (z2End - z2Start)
    const target  = Phaser.Math.Clamp(raw, 0, 1)
    this._stormProgress = Phaser.Math.Linear(this._stormProgress, target, 0.03)

    // Storm overlay alpha
    if (this._stormOverlay) {
      this._stormOverlay.setAlpha(this._stormProgress * 0.55)
    }

    // Rain active once storm has started
    const rainActive = this._stormProgress > 0.02
    if (this._rainEmitter) {
      this._rainEmitter.setActive(rainActive).setVisible(rainActive)
      // Follow camera so rain always covers the viewport
      const cam = this.cameras.main
      this._rainEmitter.setPosition(cam.scrollX, cam.scrollY - 30)
    }

    // Lightning unlocks after 50% stormProgress
    this._lightningActive = this._stormProgress > 0.5
  }

  // ─── Attack hit detection ───────────────────────────────────────────────────
  _updateWidowCombat(playerX, playerState) {
    if (!this._widowCancelled || this._encounterDone) return
    const attackRange = this._player?.attackRange ?? 88
    if (Math.abs(playerX - this._widowTriggerX) > attackRange) return

    // Register a hit only when the player transitions INTO a new attack state
    if (
      ATTACK_STATES.includes(playerState) &&
      playerState !== this._lastPlayerState
    ) {
      this._applyHitToWidow()
    }
  }

  // ─── update ────────────────────────────────────────────────────────────────
  update() {
    if (!this._player || this._transitioning) return

    if (!this._encounterActive) {
      try {
        this._player.update()
      } catch (error) {
        console.error('[GAMERON] WorldBuildingScene player update crashed', error)
        window.dispatchEvent(new CustomEvent('game:debugError', { detail: { scope: 'WorldBuildingScene', error: String(error) } }))
        return
      }
    } else {
      this._player.halt()
    }

    const px = this._player.x
    const ps = this._player.state

    this._updatePortraits(px)
    this._updateSpeedupSection(px)
    this._updateTimeBarrier()
    this._updateStormAndRain(px)
    this._updateWidowCombat(px, ps)

    const groundY = this._H - FLOOR_H - SPAWN_Y_OFFSET
    if (this._player.sprite.y > groundY) {
      this._player.sprite.setY(groundY)
      this._player.sprite.setVelocityY(0)
    }

    // Must update AFTER combat check so we detect state transitions
    this._lastPlayerState = ps

    // ── Exit ────────────────────────────────────────────────────────────────
    if (px >= this._roomWidth - 180) {
      this._transitioning = true
      this.cameras.main.fadeOut(700, 0, 0, 0)
      this.time.delayedCall(760, () => {
        if (this.scene.isActive('WorldBuildingScene')) {
          this.scene.start('PlayerGuidanceScene')
        }
      })
    }

    if (this._timeBarrier && px > this._timeBarrier.x + 96) {
      this._introCleared = true
    }
  }

  // ─── shutdown ──────────────────────────────────────────────────────────────
  shutdown() {
    window.removeEventListener('game:encounterDecision', this._decisionHandler)
    if (this._player) this._player.destroy()
    this._player        = null
    this._fireEmitters  = []
    this._smokeEmitters = []
    this._rainEmitter   = null
    this._portraits     = []
    if (this._lightningTimer) this._lightningTimer.remove()
  }
}
