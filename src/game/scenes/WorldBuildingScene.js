/**
 * WorldBuildingScene — Scene 1 (replaces GameScene)
 *
 * Teaching concept: freedom vs. constraint.  The world establishes stakes
 * before any game-design lesson is taught.
 *
 * World width: W * 14
 *
 *   Zone 1  (0     → W*2 ):  Burning village.  Smoke + fire particles.
 *                             Fire wall blocks the left edge so player can
 *                             only go right.
 *   Zone 2  (W*2   → W*8 ):  Steppe path.  Fading copper-portrait backstory
 *                             images (male or female, driven by GameState.gender).
 *                             Three portrait stations, each fades in/out as
 *                             the player passes through.
 *   Zone 3  (W*8   → W*11):  Storm.  Rain particles, periodic lightning flash
 *                             on the camera.
 *   Zone 4  (W*11  → W*14):  FOMO Widow encounter.  Enemy stands at W*12.
 *                             Player collides → encounter window event fires →
 *                             React overlay shows "Fight / Pay" choice →
 *                             result comes back via 'game:encounterDecision'.
 *                             After decision the player continues to the exit.
 *
 * Exit: player.x >= roomWidth − 180  →  fade → PlayerGuidanceScene
 *
 * Window events dispatched (→ React):
 *   'game:encounterChoice'   { id: 'fomo_widow', hp: 100 }
 *
 * Window events received (← React):
 *   'game:encounterDecision' { decision: 'fight' | 'pay' }
 */

import Phaser from 'phaser'
import PlayerController, { FLOOR_H, SPAWN_Y_OFFSET } from '../PlayerController.js'
import GameState from '../GameState.js'
import { MANIFEST } from '../assets/manifest.js'

// ─── Zone X boundaries (multiples of scene width W) ──────────────────────────
const ZONE = { Z1: 0, Z2: 2, Z3: 8, Z4: 11, END: 14 }

// ─── Portrait stations (Zone 2) ───────────────────────────────────────────────
// xFactor = center_x / W;  fade starts at ±1 W around center
const PORTRAIT_STATIONS = [3, 5, 7]   // in W units

// ─── Widow encounter ──────────────────────────────────────────────────────────
const WIDOW_X_FACTOR = 12   // x = W * 12
const WIDOW_HP       = 100

export default class WorldBuildingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldBuildingScene' })
    this._player        = null
    this._transitioning = false
    this._floor         = null

    // encounter state
    this._encounterDone    = false
    this._encounterActive  = false
    this._widowHp          = WIDOW_HP
    this._decisionHandler  = null

    // particles + emitters
    this._fireEmitters  = []
    this._smokeEmitters = []
    this._rainEmitter   = null

    // portraits
    this._portraits = []     // { img, centerX, visible }

    // lightning
    this._lightningTimer = null
  }

  // ─── init ──────────────────────────────────────────────────────────────────
  init() {
    this._transitioning   = false
    this._encounterDone   = false
    this._encounterActive = false
    this._widowHp         = WIDOW_HP
  }

  // ─── create ────────────────────────────────────────────────────────────────
  create() {
    const W = this.scale.width
    const H = this.scale.height
    this._W = W
    this._H = H
    const RW = W * ZONE.END
    this._roomWidth = RW

    // ── World & camera setup ──────────────────────────────────────────────
    this.physics.world.setBounds(0, 0, RW, H + 600)
    this.cameras.main.setBounds(0, 0, RW, H)

    // ── Background gradient per zone ─────────────────────────────────────
    this._buildBackgrounds(W, H, RW)

    // ── Floor (static physics body) ───────────────────────────────────────
    const floorRect = this.add.rectangle(RW / 2, H - FLOOR_H / 2, RW, FLOOR_H, 0x16100a)
    this.physics.add.existing(floorRect, true)
    this._floor = floorRect
    // Floor edge line
    this.add.rectangle(RW / 2, H - FLOOR_H, RW, 2, 0x38260e)

    // ── Zone 1: Fire wall (left edge) + particles ─────────────────────────
    this._buildZone1(W, H)

    // ── Zone 2: Steppe portraits ──────────────────────────────────────────
    this._buildZone2(W, H)

    // ── Zone 3: Rain + lightning ──────────────────────────────────────────
    this._buildZone3(W, H)

    // ── Zone 4: FOMO Widow ────────────────────────────────────────────────
    this._buildZone4(W, H)

    // ── Player ────────────────────────────────────────────────────────────
    this._player = new PlayerController(this, 200, H - FLOOR_H - SPAWN_Y_OFFSET)
    this.physics.add.collider(this._player.sprite, floorRect)
    this.cameras.main.startFollow(this._player.sprite, true, 0.08, 0.08)
    this.cameras.main.fadeIn(800, 0, 0, 0)

    // ── Zone label (debug / narrative) ───────────────────────────────────
    this._zoneLabel = this.add.text(W / 2, 40, '', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize:   '14px',
      color:      '#7a5c18',
      alpha:      0.7,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(20)

    // ── Listen for encounter decision ─────────────────────────────────────
    this._decisionHandler = (e) => this._onEncounterDecision(e.detail)
    window.addEventListener('game:encounterDecision', this._decisionHandler)
  }

  // ─── Backgrounds ───────────────────────────────────────────────────────────
  _buildBackgrounds(W, H, RW) {
    // Zone 1: deep orange-black
    this._zoneRect(0, W * ZONE.Z2, W, H, 0x120803)
    // Zone 2: muted steppe dusk
    this._zoneRect(W * ZONE.Z2, W * ZONE.Z3, W, H, 0x0d0c08)
    // Zone 3: stormy blue-black
    this._zoneRect(W * ZONE.Z3, W * ZONE.Z4, W, H, 0x060810)
    // Zone 4: dark shrine, purple-black
    this._zoneRect(W * ZONE.Z4, W * ZONE.END, W, H, 0x08040e)

    // Asset backgrounds (shown when available, fallback already is the rect)
    const zones = [
      { key: 'wb_bg_village', x: W * (ZONE.Z1 + (ZONE.Z2 - ZONE.Z1) / 2), zoneW: W * (ZONE.Z2 - ZONE.Z1) },
      { key: 'wb_bg_steppe',  x: W * (ZONE.Z2 + (ZONE.Z3 - ZONE.Z2) / 2), zoneW: W * (ZONE.Z3 - ZONE.Z2) },
      { key: 'wb_bg_storm',   x: W * (ZONE.Z3 + (ZONE.Z4 - ZONE.Z3) / 2), zoneW: W * (ZONE.Z4 - ZONE.Z3) },
      { key: 'wb_bg_widow',   x: W * (ZONE.Z4 + (ZONE.END - ZONE.Z4) / 2), zoneW: W * (ZONE.END - ZONE.Z4) },
    ]
    for (const z of zones) {
      if (this.textures.exists(z.key)) {
        this.add.image(z.x, H / 2, z.key)
          .setDisplaySize(z.zoneW, H)
          .setDepth(-10)
      }
    }
  }

  _zoneRect(xStart, xEnd, W, H, color) {
    const zW = xEnd - xStart
    this.add.rectangle(xStart + zW / 2, H / 2, zW, H, color).setDepth(-20)
  }

  // ─── Zone 1: Burning Village ────────────────────────────────────────────────
  _buildZone1(W, H) {
    // Fire wall on the left edge — invisible static body, prevents going left
    const fireWall = this.add.rectangle(10, H / 2, 20, H, 0xff4400).setAlpha(0)
    this.physics.add.existing(fireWall, true)
    this._fireWall = fireWall

    // Ruined building silhouettes (colored rectangles as placeholders)
    const ruins = [
      { x: 200, w: 80,  h: 200 },
      { x: 380, w: 55,  h: 160 },
      { x: 520, w: 100, h: 240 },
      { x: 680, w: 60,  h: 180 },
    ]
    for (const r of ruins) {
      this.add.rectangle(r.x, H - FLOOR_H - r.h / 2, r.w, r.h, 0x0d0804)
        .setDepth(-5)
    }

    // Fire particle emitters on ruin tops
    for (const r of ruins) {
      this._spawnFireColumn(r.x, H - FLOOR_H - r.h, 18)
    }

    // Floating smoke drifting up-right
    for (const r of ruins) {
      this._spawnSmokeColumn(r.x, H - FLOOR_H - r.h)
    }

    // Ambient orange glow overlay on Zone 1
    this.add.rectangle(W, H / 2, W * ZONE.Z2, H, 0xff2200)
      .setAlpha(0.04)
      .setDepth(-1)
  }

  _spawnFireColumn(x, y, size) {
    // Phaser particle emitter (Phaser 3 style)
    const particles = this.add.particles(x, y, undefined, {
      lifespan:   { min: 350, max: 650 },
      speed:      { min: 20,  max: 55 },
      angle:      { min: 260, max: 280 },
      scale:      { start: size / 8, end: 0 },
      alpha:      { start: 0.85, end: 0 },
      tint:       [0xff6600, 0xff3300, 0xffaa00],
      quantity:   1,
      frequency:  60,
      blendMode:  'ADD',
    })
    particles.setDepth(2)
    this._fireEmitters.push(particles)
  }

  _spawnSmokeColumn(x, y) {
    const particles = this.add.particles(x, y, undefined, {
      lifespan:   { min: 1200, max: 2200 },
      speed:      { min: 15,   max: 35 },
      angle:      { min: 250,  max: 270 },
      gravityY:   -20,
      scale:      { start: 1.2, end: 3.5 },
      alpha:      { start: 0.22, end: 0 },
      tint:       0x222222,
      quantity:   1,
      frequency:  120,
    })
    particles.setDepth(3)
    this._smokeEmitters.push(particles)
  }

  // ─── Zone 2: Steppe Portraits ───────────────────────────────────────────────
  _buildZone2(W, H) {
    const gender = GameState.gender   // 'male' | 'female'

    for (let i = 0; i < PORTRAIT_STATIONS.length; i++) {
      const centerX  = W * PORTRAIT_STATIONS[i]
      const keyBase  = `wb_portrait_${gender}_${i + 1}`

      let portraitObj

      if (this.textures.exists(keyBase)) {
        portraitObj = this.add.image(centerX, H / 2 - FLOOR_H, keyBase)
          .setDisplaySize(W * 0.55, H * 0.6)
          .setDepth(1)
          .setAlpha(0)
      } else {
        // Placeholder rectangle + label
        portraitObj = this.add.rectangle(centerX, H / 2 - FLOOR_H, W * 0.55, H * 0.6, 0x1a1208)
          .setDepth(1)
          .setAlpha(0)
        this.add.text(centerX, H / 2 - FLOOR_H, `missing_id:${keyBase}`, {
          fontFamily: '"Cinzel", Georgia, serif',
          fontSize:   '11px',
          color:      '#4a3820',
        }).setOrigin(0.5).setDepth(2).setAlpha(0)
          ._placeholderParent = portraitObj   // keep ref so we can fade together
      }

      this._portraits.push({ obj: portraitObj, centerX, fadeRadius: W * 1.2 })
    }
  }

  // ─── Zone 3: Rain + Lightning ───────────────────────────────────────────────
  _buildZone3(W, H) {
    const zoneX  = W * ZONE.Z3
    const zoneW  = W * (ZONE.Z4 - ZONE.Z3)

    // Rain overlay rect
    this._rainOverlay = this.add.rectangle(zoneX + zoneW / 2, H / 2, zoneW, H, 0x080a12)
      .setAlpha(0)
      .setDepth(-1)

    // Rain particles
    this._rainEmitter = this.add.particles(zoneX, -20, undefined, {
      lifespan:   { min: 400, max: 700 },
      speedY:     { min: 300, max: 500 },
      speedX:     { min: 20,  max: 60 },
      scaleX:     0.04,
      scaleY:     { min: 0.4, max: 0.8 },
      alpha:      { start: 0.55, end: 0 },
      tint:       0x8899cc,
      quantity:   3,
      frequency:  16,
      emitZone:   { type: 'random', source: new Phaser.Geom.Rectangle(0, 0, zoneW, 10) },
    })
    this._rainEmitter.setDepth(5).setActive(false)

    // Lightning timer — fires every 4-8 seconds while in zone
    this._lightningTimer = this.time.addEvent({
      delay:     Phaser.Math.Between(4000, 8000),
      loop:      true,
      callback:  this._flashLightning,
      callbackScope: this,
    })
  }

  _flashLightning() {
    if (!this._inZone(this._W * ZONE.Z3, this._W * ZONE.Z4)) return
    this.cameras.main.flash(120, 200, 220, 255, true)
    // Reschedule with random delay
    this._lightningTimer.delay = Phaser.Math.Between(4000, 8000)
  }

  // ─── Zone 4: FOMO Widow ─────────────────────────────────────────────────────
  _buildZone4(W, H) {
    const widowX = W * WIDOW_X_FACTOR

    // Eerie glow under widow position
    this.add.circle(widowX, H - FLOOR_H - 80, 120, 0x7700cc, 0.18).setDepth(0)
    this.add.circle(widowX, H - FLOOR_H - 80, 60,  0xbb44ff, 0.12).setDepth(0)

    // Widow sprite / placeholder
    if (this.textures.exists('wb_fomo_widow')) {
      this._widowSprite = this.add.image(widowX, H - FLOOR_H - 120, 'wb_fomo_widow')
        .setDisplaySize(160, 280)
        .setDepth(4)
    } else {
      this._widowSprite = this.add.rectangle(widowX, H - FLOOR_H - 120, 90, 220, 0x440055)
        .setDepth(4)
      this.add.text(widowX, H - FLOOR_H - 120, 'missing_id:wb_fomo_widow', {
        fontFamily: '"Cinzel", Georgia, serif',
        fontSize:   '10px',
        color:      '#bb44ff',
      }).setOrigin(0.5).setDepth(5)
    }

    // Floating name label
    this._widowLabel = this.add.text(widowX, H - FLOOR_H - 250, 'FOMO WIDOW', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize:   '16px',
      color:      '#bb44ff',
    }).setOrigin(0.5).setDepth(5).setAlpha(0.7)

    // HP bar
    const hpBgW = 140
    this._widowHpBg   = this.add.rectangle(widowX, H - FLOOR_H - 230, hpBgW, 8, 0x220033).setDepth(5)
    this._widowHpBar  = this.add.rectangle(widowX - hpBgW / 2, H - FLOOR_H - 230, hpBgW, 8, 0xaa00ff)
      .setOrigin(0, 0.5).setDepth(6)
    this._widowHpBarW = hpBgW

    // Collision trigger zone (invisible rect)
    const triggerW  = 200
    const trigger   = this.add.rectangle(widowX, H - FLOOR_H - 60, triggerW, H * 0.8, 0xffffff).setAlpha(0)
    this.physics.add.existing(trigger, true)
    this._widowTrigger   = trigger
    this._widowTriggerX  = widowX

    // Exit area marker
    this.add.text(
      this._roomWidth - 250,
      H - FLOOR_H - 20,
      '▷  WEITER',
      { fontFamily: '"Cinzel", Georgia, serif', fontSize: '20px', color: '#c9a84c' }
    ).setOrigin(0.5, 1).setAlpha(0.5)
  }

  // ─── Encounter decision callback ────────────────────────────────────────────
  _onEncounterDecision(detail) {
    if (!this._encounterActive) return
    this._encounterActive = false

    const decision = detail?.decision ?? 'fight'

    if (decision === 'fight') {
      GameState.recordChoice('fight')
      // Simple fight: widow takes damage from hits; for now: instant defeat
      this._defeatWidow()
    } else {
      GameState.recordChoice('gacha')
      // Player paid — widow disappears, gachaScore goes up
      this._defeatWidow()
    }
  }

  _defeatWidow() {
    this._encounterDone = true
    // Fade widow out
    if (this._widowSprite) this.tweens.add({ targets: this._widowSprite,    alpha: 0, duration: 600 })
    if (this._widowLabel)  this.tweens.add({ targets: this._widowLabel,     alpha: 0, duration: 400 })
    if (this._widowHpBg)   this.tweens.add({ targets: this._widowHpBg,      alpha: 0, duration: 400 })
    if (this._widowHpBar)  this.tweens.add({ targets: this._widowHpBar,     alpha: 0, duration: 400 })
  }

  // ─── Zone helpers ───────────────────────────────────────────────────────────
  _inZone(xMin, xMax) {
    const cam = this.cameras.main
    return cam.scrollX >= xMin - cam.width && cam.scrollX <= xMax
  }

  // ─── Portrait fading ────────────────────────────────────────────────────────
  _updatePortraits(playerX) {
    for (const p of this._portraits) {
      const dist  = Math.abs(playerX - p.centerX)
      const alpha = Math.max(0, 1 - dist / p.fadeRadius) * 0.82
      if (p.obj && p.obj.setAlpha) p.obj.setAlpha(alpha)
    }
  }

  // ─── Zone label helper ──────────────────────────────────────────────────────
  _updateZoneLabel(playerX) {
    const W = this._W
    let label = ''
    if (playerX < W * ZONE.Z2)       label = 'I — Das brennende Dorf'
    else if (playerX < W * ZONE.Z3)  label = 'II — Die Steppe des Verlustes'
    else if (playerX < W * ZONE.Z4)  label = 'III — Der Sturm'
    else                              label = 'IV — Die FOMO-Witwe'
    if (this._zoneLabel) this._zoneLabel.setText(label)
  }

  // ─── Rain zone activation ───────────────────────────────────────────────────
  _updateRain(playerX) {
    const W = this._W
    const inStorm = playerX >= W * ZONE.Z3 && playerX < W * ZONE.Z4
    if (this._rainEmitter) this._rainEmitter.setActive(inStorm).setVisible(inStorm)
    if (this._rainOverlay) {
      const targetAlpha = inStorm ? 0.15 : 0
      if (Math.abs((this._rainOverlay.alpha ?? 0) - targetAlpha) > 0.005) {
        this._rainOverlay.setAlpha(
          Phaser.Math.Linear(this._rainOverlay.alpha, targetAlpha, 0.04)
        )
      }
    }
  }

  // ─── update ────────────────────────────────────────────────────────────────
  update() {
    if (!this._player || this._transitioning) return

    // Block player input during active encounter
    if (!this._encounterActive) {
      this._player.update()
    } else {
      this._player.halt()
    }

    const px = this._player.x

    // Fire-wall collider (zone 1 only)
    if (this._fireWall) {
      this.physics.add.collider(this._player.sprite, this._fireWall)
    }

    this._updatePortraits(px)
    this._updateZoneLabel(px)
    this._updateRain(px)

    // ── FOMO Widow trigger ──────────────────────────────────────────────────
    if (
      !this._encounterDone &&
      !this._encounterActive &&
      Math.abs(px - this._widowTriggerX) < 220
    ) {
      this._encounterActive = true
      window.dispatchEvent(new CustomEvent('game:encounterChoice', {
        detail: { id: 'fomo_widow', hp: WIDOW_HP }
      }))
    }

    // ── Exit ────────────────────────────────────────────────────────────────
    if (px >= this._roomWidth - 180) {
      this._transitioning = true
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('PlayerGuidanceScene')
      })
      this.cameras.main.fadeOut(700, 0, 0, 0)
    }
  }

  // ─── shutdown ──────────────────────────────────────────────────────────────
  shutdown() {
    window.removeEventListener('game:encounterDecision', this._decisionHandler)
    if (this._player) this._player.destroy()
    this._player       = null
    this._fireEmitters = []
    this._smokeEmitters = []
    this._rainEmitter  = null
    this._portraits    = []
    if (this._lightningTimer) this._lightningTimer.remove()
  }
}
