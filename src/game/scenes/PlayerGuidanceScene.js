/**
 * PlayerGuidanceScene — Szene 2: Die Rote Festung
 *
 * Thema: Signposting — nur visuelle Hinweise (Fackel) führen zum richtigen Weg.
 *
 * Ablauf:
 *   1. Red Dot Waifu erscheint in der Mitte, hält Dialog, verschwindet.
 *   2. 6 Ausgänge, nur der mit Fackel ist korrekt.
 *   3. 3× hintereinander korrekt → finales Timegate erscheint.
 *   4. K-Ability (Speedup-Diamant) zerstört das Gate.
 *   5. Todesröcheln der Waifu → Übergang zu GalleryScene.
 *
 * Fallen ab Runde 2: gelbe Farbe auf einem falschen Ausgang.
 * Fallen ab Runde 3: großer Pfeil + "Hier entlang" auf einem anderen falschen Ausgang.
 *
 * Fußschalter: E aktiviert → spielt YouTube-Video (Half-Life) via React-Overlay.
 */

import Phaser from 'phaser'
import PlayerController, { FLOOR_H, SPAWN_Y_OFFSET } from '../PlayerController.js'
import GameState from '../GameState.js'

const DOOR_COUNT     = 6
const CORRECT_NEEDED = 3
const MAX_DIAMOND_RANGE = 700

export default class PlayerGuidanceScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayerGuidanceScene' })
    this._reset()
  }

  _reset() {
    this._player         = null
    this._transitioning  = false
    this._correctCount   = 0
    this._round          = 0
    this._correctDoor    = -1
    this._waifuDone      = false
    this._finalGateBuilt = false
    this._switchUsed     = false
    this._doorCooldown   = false

    this._floorRect      = null
    this._doors          = []
    this._torchObjects   = []
    this._decoyObjects   = []
    this._timeBarrier    = null
    this._gateTimer      = null
    this._switchX        = 0
    this._switchZone     = null

    this._dialogVisible  = false
    this._dialogLines    = []
    this._dialogStep     = 0
    this._dialogCb       = null
    this._dialogKeyFn    = null
    this._dialogBg       = null
    this._dialogText     = null
    this._dialogHint     = null

    this._kHandler       = null
    this._speedBoost     = false
  }

  init() {
    this._reset()
    this._speedBoost = !!GameState.speedBoostUnlocked
  }

  // ─────────────────────────────────────────────────────────────────
  // create
  // ─────────────────────────────────────────────────────────────────
  create() {
    const W  = this.scale.width
    const H  = this.scale.height
    this._W  = W
    this._H  = H
    const RW = W * 6
    this._roomWidth = RW

    this.physics.world.setBounds(0, 0, RW, H + 600)
    this.cameras.main.setBounds(0, 0, RW, H)
    this.cameras.main.setZoom(1.08)
    this.cameras.main.setRoundPixels(true)

    // ── Backgrounds ─────────────────────────────────────────────────
    this._buildBackground(W, H, RW)

    // ── Floor ───────────────────────────────────────────────────────
    const floorRect = this.add.rectangle(RW / 2, H - FLOOR_H / 2, RW, FLOOR_H, 0x16100a)
    this.physics.add.existing(floorRect, true)
    this._floorRect = floorRect
    this.add.rectangle(RW / 2, H - FLOOR_H, RW, 2, 0x38260e)

    const safetyFloor = this.add.rectangle(RW / 2, H + 30, RW, 220, 0x000000).setAlpha(0)
    this.physics.add.existing(safetyFloor, true)

    // ── Doors & waifu & switch ───────────────────────────────────────
    this._buildDoors(W, H)
    this._buildFloorSwitch(W, H)
    this._buildWaifu(W, H)

    // ── Dialog HUD (fixed to camera) ────────────────────────────────
    this._buildDialogHUD(W, H)

    // ── Player ──────────────────────────────────────────────────────
    this._player = new PlayerController(this, 160, H - FLOOR_H - SPAWN_Y_OFFSET)
    this.physics.add.collider(this._player.sprite, floorRect)
    this.physics.add.collider(this._player.sprite, safetyFloor)

    // ── Camera ──────────────────────────────────────────────────────
    this.cameras.main.startFollow(this._player.sprite, true, 0.1, 0.1)
    this.cameras.main.setDeadzone(Math.round(W * 0.22), Math.round(H * 0.24))
    this.cameras.main.fadeIn(600, 0, 0, 0)

    // ── K key ───────────────────────────────────────────────────────
    this.input.keyboard.enableGlobalCapture()
    this._kHandler = () => {
      if (this._timeBarrier?.state === 'active' && this._speedBoost) {
        this._fireDiamond()
      }
    }
    this.input.keyboard.on('keydown-K', this._kHandler)

    // ── Door overlap (set up after player exists) ───────────────────
    this._doors.forEach((door, idx) => {
      this.physics.add.overlap(
        this._player.sprite, door.trigger,
        () => this._onDoorEntered(idx), undefined, this,
      )
    })

    // ── Pick first correct door ──────────────────────────────────────
    this._pickCorrectDoor()

    // ── Start waifu dialog after short delay ────────────────────────
    this.time.delayedCall(900, () => this._startWaifuDialog())
  }

  // ─────────────────────────────────────────────────────────────────
  // Background
  // ─────────────────────────────────────────────────────────────────
  _buildBackground(W, H, RW) {
    // Stone base
    this.add.rectangle(RW / 2, H / 2, RW, H, 0x0b0a0e).setDepth(-20)
    // Ceiling stone band
    this.add.rectangle(RW / 2, 18, RW, 36, 0x1a1218).setDepth(-10)
    // Subtle red menace glow in the middle section
    this.add.rectangle(RW * 0.45, H / 2, W * 3, H, 0x2a0008).setAlpha(0.08).setDepth(-8)
    // Pillars
    for (let px = W * 1.0; px < RW - W * 0.5; px += W * 1.1) {
      this.add.rectangle(px, (H - FLOOR_H) / 2 + 18, 30, H - FLOOR_H, 0x1a1518).setAlpha(0.7).setDepth(-5)
    }
    // Entry arch left
    this.add.rectangle(24, (H - FLOOR_H) / 2 + 18, 48, H - FLOOR_H, 0x140d0f).setDepth(-4)
  }

  // ─────────────────────────────────────────────────────────────────
  // Doors
  // ─────────────────────────────────────────────────────────────────
  _buildDoors(W, H) {
    const DOOR_W = 76
    const DOOR_H = 148
    const doorY  = H - FLOOR_H - DOOR_H / 2

    const xPositions = [
      W * 1.7, W * 2.3, W * 2.9,
      W * 3.6, W * 4.2, W * 4.8,
    ]

    this._doors = xPositions.map((dx, idx) => {
      const frame   = this.add.rectangle(dx, doorY, DOOR_W + 10, DOOR_H + 10, 0x3a1822).setDepth(1)
      const portal  = this.add.rectangle(dx, doorY, DOOR_W, DOOR_H, 0x060307).setDepth(2)
      const numText = this.add.text(dx, doorY - DOOR_H / 2 + 14, `${idx + 1}`, {
        fontFamily: '"Cinzel", Georgia, serif',
        fontSize: '11px',
        color: '#552233',
      }).setOrigin(0.5).setDepth(3)

      const trigger = this.add.rectangle(dx, doorY, DOOR_W, DOOR_H, 0x000000).setAlpha(0)
      this.physics.add.existing(trigger, true)

      return { x: dx, y: doorY, doorH: DOOR_H, frame, portal, numText, trigger, idx }
    })
  }

  // ─────────────────────────────────────────────────────────────────
  // Torch / Decoys
  // ─────────────────────────────────────────────────────────────────
  _pickCorrectDoor() {
    this._correctDoor = Phaser.Math.Between(0, DOOR_COUNT - 1)
    this._refreshDecorations()
  }

  _refreshDecorations() {
    // Destroy old torches & decoys
    this._torchObjects.forEach(o => { try { o.destroy() } catch {} })
    this._decoyObjects.forEach(o => { try { o.destroy() } catch {} })
    this._torchObjects = []
    this._decoyObjects = []

    const door  = this._doors[this._correctDoor]
    const H     = this._H

    // ─ Torch on correct door ─
    const torchHandleY = door.y - door.doorH / 2 - 12
    const handle = this.add.rectangle(door.x, torchHandleY + 18, 6, 22, 0x3a2810).setDepth(6)
    this._torchObjects.push(handle)

    const flame = this.add.particles(door.x, torchHandleY, undefined, {
      lifespan:  { min: 280, max: 480 },
      speed:     { min: 18, max: 48 },
      angle:     { min: 250, max: 290 },
      scale:     { start: 0.45, end: 0 },
      alpha:     { start: 1, end: 0 },
      tint:      [0xff7700, 0xffaa00, 0xffcc44],
      quantity:  2,
      frequency: 28,
      blendMode: 'ADD',
    }).setDepth(7)
    this._torchObjects.push(flame)

    const warmGlow = this.add.rectangle(door.x, door.y - door.doorH / 2, 60, 80, 0xff8800).setAlpha(0.06).setDepth(5)
    this._torchObjects.push(warmGlow)

    // ─ Decoy: yellow paint from round 1 ─
    if (this._round >= 1) {
      const wrongs = this._doors.filter((_, i) => i !== this._correctDoor)
      const paintDoor = Phaser.Utils.Array.GetRandom(wrongs)
      const paint = this.add.rectangle(paintDoor.x, H - FLOOR_H - 10, 100, 22, 0xddc800)
        .setAlpha(0.72).setDepth(5)
      this._decoyObjects.push(paint)
    }

    // ─ Decoy: arrow from round 2 ─
    if (this._round >= 2) {
      const wrongs2 = this._doors.filter((_, i) => i !== this._correctDoor)
      const arrowDoor = Phaser.Utils.Array.GetRandom(wrongs2)
      const ax = arrowDoor.x, ay = this._H - FLOOR_H - 52

      const arrowG = this.add.graphics().setDepth(6)
      arrowG.fillStyle(0xffffff, 0.88)
      arrowG.fillTriangle(ax - 26, ay + 12, ax + 26, ay, ax - 26, ay - 12)
      this._decoyObjects.push(arrowG)

      const arrowTxt = this.add.text(arrowDoor.x, ay - 28, 'Hier entlang', {
        fontFamily: '"Cinzel", Georgia, serif',
        fontSize: '14px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(6)
      this._decoyObjects.push(arrowTxt)
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Floor switch
  // ─────────────────────────────────────────────────────────────────
  _buildFloorSwitch(W, H) {
    const x = Math.round(W * 0.85)
    const y = H - FLOOR_H - 6
    this._switchX = x

    const g = this.add.graphics().setDepth(3)
    g.fillStyle(0x3a3020, 1)
    g.fillRoundedRect(x - 24, y - 9, 48, 18, 4)
    g.lineStyle(2, 0x7a6030, 0.9)
    g.strokeRoundedRect(x - 24, y - 9, 48, 18, 4)
    g.fillStyle(0xff9900, 0.85)
    g.fillRect(x - 7, y - 5, 14, 10)

    this.add.text(x, y - 28, '[ E ]  SCHALTER', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize: '12px',
      color: '#c08838',
      stroke: '#1a1008',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(4).setAlpha(0.85)

    const zone = this.add.rectangle(x, y - 2, 64, 44, 0x000000).setAlpha(0)
    this.physics.add.existing(zone, true)
    this._switchZone = zone
  }

  // ─────────────────────────────────────────────────────────────────
  // Red Dot Waifu (generated graphics)
  // ─────────────────────────────────────────────────────────────────
  _buildWaifu(W, H) {
    const x      = Math.round(W * 2.4)
    const y      = H - FLOOR_H
    const spriteH = Math.round(H * 0.54)
    this._waifuX  = x
    this._waifuY  = y

    const glow = this.add.circle(x, y - Math.round(spriteH * 0.55), 88, 0xff0033, 0.18).setDepth(2)

    const fig = this.add.graphics().setDepth(3)
    fig.fillStyle(0x7a0a1e, 1)
    fig.fillTriangle(x - 28, y, x + 28, y, x, y - spriteH * 0.44)
    fig.fillStyle(0xcc2244, 0.92)
    fig.fillTriangle(x - 18, y - spriteH * 0.44, x + 18, y - spriteH * 0.44, x, y - spriteH * 0.18)
    fig.fillStyle(0xff4466, 0.95)
    fig.fillCircle(x, y - spriteH * 0.74, 20)
    fig.fillStyle(0xff6688, 0.28)
    fig.fillTriangle(x - 52, y - spriteH * 0.18, x - 12, y - spriteH * 0.38, x - 18, y - spriteH * 0.1)
    fig.fillTriangle(x + 52, y - spriteH * 0.18, x + 12, y - spriteH * 0.38, x + 18, y - spriteH * 0.1)

    const nameLabel = this.add.text(x, y - spriteH - 22, 'RED DOT WAIFU', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize: '15px',
      color: '#ff8899',
      stroke: '#3a0011',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5).setAlpha(0.88)

    this._waifuGlow  = glow
    this._waifuFig   = fig
    this._waifuLabel = nameLabel
  }

  // ─────────────────────────────────────────────────────────────────
  // Dialog HUD (scrollFactor 0 = fixed to viewport)
  // ─────────────────────────────────────────────────────────────────
  _buildDialogHUD(W, H) {
    this._dialogBg = this.add.rectangle(W / 2, H - 46, W - 16, 88, 0x08040f)
      .setScrollFactor(0).setAlpha(0).setDepth(60).setStrokeStyle(2, 0xcc2244)

    this._dialogText = this.add.text(20, H - 88, '', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize: '14px',
      color: '#f0b0b8',
      wordWrap: { width: W - 40 },
    }).setScrollFactor(0).setAlpha(0).setDepth(61)

    this._dialogHint = this.add.text(W - 20, H - 18, '', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize: '11px',
      color: '#aa5566',
    }).setScrollFactor(0).setOrigin(1, 1).setAlpha(0).setDepth(61)
  }

  _showDialog(lines, onComplete) {
    this._dialogLines = lines
    this._dialogStep  = 0
    this._dialogCb    = onComplete
    this._dialogVisible = true
    this._dialogBg.setAlpha(0.95)
    this._dialogText.setAlpha(1)
    this._dialogHint.setAlpha(0.85)
    this._updateDialogLine()

    this._dialogKeyFn = (event) => {
      if (event.key !== 'e' && event.key !== 'E') return
      event.preventDefault()
      event.stopImmediatePropagation()
      if (this._dialogStep < this._dialogLines.length - 1) {
        this._dialogStep++
        this._updateDialogLine()
      } else {
        this._closeDialog()
      }
    }
    window.addEventListener('keydown', this._dialogKeyFn, true)
  }

  _updateDialogLine() {
    this._dialogText.setText(this._dialogLines[this._dialogStep])
    this._dialogHint.setText(`${this._dialogStep + 1} / ${this._dialogLines.length}   E WEITER`)
  }

  _closeDialog() {
    this._dialogVisible = false
    this._dialogBg.setAlpha(0)
    this._dialogText.setAlpha(0)
    this._dialogHint.setAlpha(0)
    if (this._dialogKeyFn) {
      window.removeEventListener('keydown', this._dialogKeyFn, true)
      this._dialogKeyFn = null
    }
    if (this._dialogCb) {
      const cb = this._dialogCb
      this._dialogCb = null
      cb()
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Waifu dialog
  // ─────────────────────────────────────────────────────────────────
  _startWaifuDialog() {
    this._showDialog([
      'Du... hast es bis hierher geschafft?',
      'Die Speedup-Hexe hat dich für ihre Zwecke benutzt. Was glaubst du, wer du bist?',
      'Dieses Feuer in deinen Augen... das gehört mir.',
      'Ich halte dich hier fest. Für immer.',
      'Sechs Türen. Drei Mal hintereinander den richtigen Ausgang finden.',
      'Unmöglich.',
    ], () => {
      const fade = (t) => {
        if (!t) return
        this.tweens.add({ targets: t, alpha: 0, duration: 400, onComplete: () => { try { t.destroy() } catch {} } })
      }
      fade(this._waifuGlow)
      fade(this._waifuFig)
      fade(this._waifuLabel)
      this._waifuDone = true
    })
  }

  _startDeathRattle() {
    this._showDialog([
      '[röchelt]  Das... ist nicht möglich...',
      'Ich bin in meinem eigenen Zauber gefangen...',
      'Ich finde... den Ausgang nicht mehr...',
      '[verschwindet im Dunkel]',
    ], () => {
      this._transitioning = true
      this.cameras.main.fadeOut(700, 0, 0, 0)
      this.time.delayedCall(760, () => this.scene.start('GalleryScene'))
    })
  }

  // ─────────────────────────────────────────────────────────────────
  // Door logic
  // ─────────────────────────────────────────────────────────────────
  _onDoorEntered(idx) {
    if (this._doorCooldown || !this._waifuDone || this._dialogVisible || this._finalGateBuilt) return
    this._doorCooldown = true

    if (idx === this._correctDoor) {
      this._correctCount++
      this._round++
      this.cameras.main.flash(160, 0, 200, 80, false)

      if (this._correctCount >= CORRECT_NEEDED) {
        this._finalGateBuilt = true
        this.time.delayedCall(400, () => {
          this._respawnPlayer()
          this._clearDoorDecorations()
          this._buildFinalGate()
          this._doorCooldown = false
        })
      } else {
        this.time.delayedCall(400, () => {
          this._respawnPlayer()
          this._pickCorrectDoor()
          this._doorCooldown = false
        })
      }
    } else {
      // Wrong door → reset counter
      this._correctCount = 0
      this._round++
      this.cameras.main.flash(200, 200, 0, 0, false)
      this.time.delayedCall(400, () => {
        this._respawnPlayer()
        this._pickCorrectDoor()
        this._doorCooldown = false
      })
    }
  }

  _respawnPlayer() {
    if (!this._player?.sprite) return
    this._player.sprite.setPosition(160, this._H - FLOOR_H - SPAWN_Y_OFFSET)
    this._player.sprite.setVelocity(0, 0)
  }

  _clearDoorDecorations() {
    this._torchObjects.forEach(o => { try { o.destroy() } catch {} })
    this._decoyObjects.forEach(o => { try { o.destroy() } catch {} })
    this._torchObjects = []
    this._decoyObjects = []
  }

  // ─────────────────────────────────────────────────────────────────
  // Final timegate
  // ─────────────────────────────────────────────────────────────────
  _buildFinalGate() {
    const W = this._W
    const H = this._H
    const x = W * 5.3
    const y = H / 2

    this._gateX = x

    const body = this.add.rectangle(x, y, 64, H + 600, 0x5a0010).setDepth(4)
    const glow  = this.add.rectangle(x, y, 84, H + 620, 0xff0033, 0.1).setDepth(3)
    const label = this.add.text(x, H - FLOOR_H - 160, '01:00', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize:   '18px',
      color:      '#ff4466',
      stroke:     '#300010',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5)

    this.physics.add.existing(body, true)
    if (this._player) {
      this.physics.add.collider(this._player.sprite, body)
    }

    this._timeBarrier = { body, glow, label, state: 'active' }

    // Countdown timer (visual)
    let sec = 60
    this._gateTimer = this.time.addEvent({
      delay: 1000, loop: true,
      callback: () => {
        sec = Math.max(0, sec - 1)
        const m = Math.floor(sec / 60), s = sec % 60
        label.setText(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
        if (sec <= 0) {
          this._hideTimegate()
          this._gateTimer?.remove()
        }
      },
    })

    // Hint label
    this.add.text(x, H - FLOOR_H - 210, '[ K ]  ABILITY', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize:   '14px',
      color:      '#ff6680',
      stroke:     '#200010',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5)

    // Exit overlap zone (after gate)
    const exitZone = this.add.rectangle(this._roomWidth - 100, H / 2, 200, H + 600, 0x000000).setAlpha(0)
    this.physics.add.existing(exitZone, true)
    if (this._player) {
      this.physics.add.overlap(this._player.sprite, exitZone, () => {
        if (!this._transitioning) this._startDeathRattle()
      }, undefined, this)
    }

    // Wooden exit sign next to gate
    this._buildWoodenSign(x + 110, H)
  }

  _hideTimegate() {
    if (!this._timeBarrier) return
    this._timeBarrier.state = 'hidden'
    this._timeBarrier.body.setAlpha(0)
    this._timeBarrier.body.body.enable = false
    this._timeBarrier.glow.setAlpha(0)
    this._timeBarrier.label.setAlpha(0)
  }

  // ─────────────────────────────────────────────────────────────────
  // Wooden sign (exit signpost style)
  // ─────────────────────────────────────────────────────────────────
  _buildWoodenSign(x, H) {
    const y = H - FLOOR_H - 90

    const g = this.add.graphics().setDepth(8)
    // Post
    g.fillStyle(0x3d2810, 1)
    g.fillRect(x - 5, y - 40, 10, 80)
    // Board
    g.fillStyle(0x5a3c18, 1)
    g.fillRoundedRect(x - 48, y - 68, 96, 50, 6)
    g.lineStyle(2, 0x8b6b3e, 0.9)
    g.strokeRoundedRect(x - 48, y - 68, 96, 50, 6)
    // Arrow symbol
    g.fillStyle(0xd1bf91, 0.9)
    g.fillTriangle(x + 8, y - 43, x + 28, y - 43 + 12, x + 8, y - 43 + 24)

    this.add.text(x - 8, y - 50, 'WEITER', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize:   '14px',
      color:      '#d1bf91',
      stroke:     '#1a100a',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(9)
  }

  // ─────────────────────────────────────────────────────────────────
  // Diamond shot
  // ─────────────────────────────────────────────────────────────────
  _fireDiamond() {
    if (!this._timeBarrier || this._timeBarrier.state !== 'active') return
    if (!this._player) return

    const fromX = this._player.x + 34
    const fromY = this._player.y - 54
    const distToGate = this._gateX - this._player.x
    const hitsGate   = distToGate > 0 && distToGate <= MAX_DIAMOND_RANGE
    const toX        = hitsGate ? this._gateX : fromX + MAX_DIAMOND_RANGE

    const diamond = this.add.graphics().setDepth(12)
    diamond.fillStyle(0xff4466, 1)
    diamond.fillTriangle(0, -11, 11, 0, 0, 11)
    diamond.fillTriangle(0, -11, -11, 0, 0, 11)
    diamond.setPosition(fromX, fromY)

    const pos = { x: fromX, y: fromY }
    const sync = () => diamond.setPosition(pos.x, pos.y)

    this.tweens.add({
      targets: pos,
      x: toX, y: fromY,
      duration: 320,
      ease: 'Linear',
      onUpdate: sync,
      onComplete: () => {
        if (hitsGate) this._hideTimegate()
        this.tweens.add({ targets: diamond, alpha: 0, duration: 100, onComplete: () => diamond.destroy() })
      },
    })
  }

  // ─────────────────────────────────────────────────────────────────
  // update
  // ─────────────────────────────────────────────────────────────────
  update() {
    if (!this._player || this._transitioning) return

    const inDialog = this._dialogVisible
    if (!inDialog) {
      try {
        this._player.update()
      } catch (err) {
        console.error('[PGS] player update error', err)
        return
      }
    } else {
      this._player.halt()
    }

    // Ground clamp
    const groundY = this._H - FLOOR_H - SPAWN_Y_OFFSET
    if (this._player.sprite.y > groundY) {
      this._player.sprite.setY(groundY)
      this._player.sprite.setVelocityY(0)
    }

    const px = this._player.x

    // Floor switch (E key)
    if (!this._switchUsed && !inDialog && this._player.interactJustDown) {
      if (Math.abs(px - this._switchX) < 50) {
        this._activateSwitch()
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Floor switch → YouTube video
  // ─────────────────────────────────────────────────────────────────
  _activateSwitch() {
    this._switchUsed = true
    window.dispatchEvent(new CustomEvent('game:showVideo', {
      // Half-Life intro / G-Man sequence — change URL/timestamp as needed
      detail: { url: 'https://www.youtube.com/embed/9NZDpZzcjsc?autoplay=1&start=20' },
    }))
  }

  // ─────────────────────────────────────────────────────────────────
  // shutdown
  // ─────────────────────────────────────────────────────────────────
  shutdown() {
    if (this._player) this._player.destroy()
    this._player = null
    if (this._kHandler) this.input.keyboard.off('keydown-K', this._kHandler)
    if (this._dialogKeyFn) window.removeEventListener('keydown', this._dialogKeyFn, true)
    if (this._gateTimer) this._gateTimer.remove()
    this._torchObjects.forEach(o => { try { o.destroy() } catch {} })
    this._decoyObjects.forEach(o => { try { o.destroy() } catch {} })
  }
}
