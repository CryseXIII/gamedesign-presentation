/**
 * PlayerGuidanceScene — Scene 2: Die Rote Festung
 *
 * Castle background: pgs_bg_castle.png (2048×768).
 * Central ornate picture frame in the BG → YouTube video embeds there via Phaser DOM.
 *
 * Flow:
 *   1. Red Dot Waifu (real sprite) appears in front of the frame, delivers dialog.
 *   2. Waifu fades out → pedestal with Play button reveals below frame.
 *   3. 4 doors in castle corners — find the correct one (marked by torch) 3× in a row.
 *   4. Pressing E at pedestal loads and plays the video inside the picture frame.
 *      F key or YouTube's own fullscreen button for fullscreen.
 *   5. After 3 correct doors → final timegate spawns. K = diamond shot.
 *   6. Death rattle dialog → GalleryScene.
 *
 * Decoys:
 *   Round ≥ 1: yellow paint mark on a wrong door.
 *   Round ≥ 2: white arrow + "Hier entlang" on another wrong door.
 *
 * Frame pixel constants (measured against 2048×768 source):
 *   Inner black screen: x 870–1178, y 245–418  → center (1024, 331), size 308×173
 */

import Phaser from 'phaser'
import PlayerController, { FLOOR_H, SPAWN_Y_OFFSET } from '../PlayerController.js'
import GameState from '../GameState.js'

// ── Constants ──────────────────────────────────────────────────────────────────
const BG_W = 2048
const BG_H = 768

// Picture-frame inner-screen fractions (relative to source image)
const FRAME_CX_FRAC = 1024 / 2048   // 0.5
const FRAME_CY_FRAC = 331  / 768    // ~0.431
const FRAME_IW_FRAC = 308  / 2048   // ~0.150
const FRAME_IH_FRAC = 173  / 768    // ~0.225

const DOOR_COUNT     = 4
const CORRECT_NEEDED = 3
const MAX_DIAMOND_RANGE = 1400
const ZOOM = 1.08

// Door X positions as fractions of worldW — mapped to the castle's four arch corners
const DOOR_X_FRACS = [0.045, 0.26, 0.74, 0.955]

// Placeholder video URL — user will supply the final Half-Life / Cuphead link
const DEFAULT_VIDEO_URL = 'https://www.youtube.com/embed/9NZDpZzcjsc?autoplay=1&start=20'

// ── Scene ──────────────────────────────────────────────────────────────────────
export default class PlayerGuidanceScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayerGuidanceScene' })
    this._reset()
  }

  _reset() {
    this._player          = null
    this._transitioning   = false
    this._correctCount    = 0
    this._round           = 0
    this._correctDoor     = -1
    this._waifuDone       = false
    this._finalGateBuilt  = false
    this._doorCooldown    = false
    this._videoVisible    = false
    this._pedestalShown   = false
    this._worldW          = 0
    this._W               = 0
    this._H               = 0

    this._floorRect       = null
    this._doors           = []
    this._torchObjects    = []
    this._decoyObjects    = []
    this._timeBarrier     = null
    this._gateTimer       = null
    this._gateX           = 0

    this._pedestalGfx     = null
    this._pedestalEPrompt = null
    this._pedestalZoneX   = 0
    this._pedestalZone    = null

    this._videoFrame      = null      // Phaser DOMElement (iframe)
    this._videoUrl        = DEFAULT_VIDEO_URL
    this._fKeyFn          = null

    this._waifuSprite     = null
    this._waifuLabel      = null

    this._frameCX = 0
    this._frameCY = 0
    this._frameIW = 0
    this._frameIH = 0

    this._dialogVisible   = false
    this._dialogLines     = []
    this._dialogStep      = 0
    this._dialogCb        = null
    this._dialogKeyFn     = null
    this._dialogBg        = null
    this._dialogText      = null
    this._dialogHint      = null

    this._kHandler        = null
    this._speedBoost      = false
  }

  init() {
    this._reset()
    this._speedBoost = !!GameState.speedBoostUnlocked
  }

  // ── create ──────────────────────────────────────────────────────────────────
  create() {
    const W = this.scale.width
    const H = this.scale.height
    this._W = W
    this._H = H

    // World scaled to canvas height, preserving bg aspect ratio
    const scale  = H / BG_H
    const worldW = Math.round(BG_W * scale)
    this._worldW = worldW

    this.physics.world.setBounds(0, 0, worldW, H + 600)
    this.cameras.main.setBounds(0, 0, worldW, H)
    this.cameras.main.setZoom(ZOOM)
    this.cameras.main.setRoundPixels(true)

    // ── Background ─────────────────────────────────────────────────────
    this.add.image(0, 0, 'pgs_bg_castle')
      .setOrigin(0, 0)
      .setDisplaySize(worldW, H)
      .setDepth(-10)

    // ── Frame world coords ─────────────────────────────────────────────
    this._frameCX = Math.round(worldW * FRAME_CX_FRAC)
    this._frameCY = Math.round(H      * FRAME_CY_FRAC)
    this._frameIW = Math.round(worldW * FRAME_IW_FRAC)
    this._frameIH = Math.round(H      * FRAME_IH_FRAC)

    // ── Floor ──────────────────────────────────────────────────────────
    const floor = this.add.rectangle(worldW / 2, H - FLOOR_H / 2, worldW, FLOOR_H, 0x000000, 0)
    this.physics.add.existing(floor, true)
    this._floorRect = floor

    const safetyFloor = this.add.rectangle(worldW / 2, H + 30, worldW, 220, 0x000000, 0)
    this.physics.add.existing(safetyFloor, true)

    // ── Doors ──────────────────────────────────────────────────────────
    this._buildDoors(worldW, H)

    // ── Video iframe ───────────────────────────────────────────────────
    this._buildVideoFrame()

    // ── Pedestal (hidden until waifu dialog ends) ──────────────────────
    this._buildPedestal(worldW, H)

    // ── Red Dot Waifu sprite ───────────────────────────────────────────
    this._buildWaifu(worldW, H)

    // ── Dialog HUD (viewport-fixed) ────────────────────────────────────
    this._buildDialogHUD(W, H)

    // ── Player ─────────────────────────────────────────────────────────
    const spawnX = this._frameCX - 180
    this._player = new PlayerController(this, spawnX, H - FLOOR_H - SPAWN_Y_OFFSET)
    this.physics.add.collider(this._player.sprite, floor)
    this.physics.add.collider(this._player.sprite, safetyFloor)

    // ── Camera ─────────────────────────────────────────────────────────
    this.cameras.main.startFollow(this._player.sprite, true, 0.1, 0.1)
    this.cameras.main.setDeadzone(Math.round(W * 0.22), Math.round(H * 0.24))
    this.cameras.main.fadeIn(600, 0, 0, 0)

    // ── Keyboard ───────────────────────────────────────────────────────
    this.input.keyboard.enableGlobalCapture()

    this._kHandler = () => {
      if (this._timeBarrier?.state === 'active' && this._speedBoost) {
        this._fireDiamond()
      }
    }
    this.input.keyboard.on('keydown-K', this._kHandler)

    // F key → fullscreen iframe
    this._fKeyFn = (e) => {
      if ((e.key === 'f' || e.key === 'F') && this._videoVisible && this._videoFrame) {
        try { this._videoFrame.node.requestFullscreen?.() } catch {}
      }
    }
    window.addEventListener('keydown', this._fKeyFn)

    // ── Door overlaps ──────────────────────────────────────────────────
    this._doors.forEach((door, idx) => {
      this.physics.add.overlap(
        this._player.sprite, door.trigger,
        () => this._onDoorEntered(idx), undefined, this,
      )
    })

    // ── First round ────────────────────────────────────────────────────
    this._pickCorrectDoor()

    // ── Waifu intro dialog ─────────────────────────────────────────────
    this.time.delayedCall(900, () => this._startWaifuDialog())
  }

  // ── Background ────────────────────────────────────────────────────────────
  // (handled inline in create — single image call)

  // ── Doors — 4 positions at castle arch corners ───────────────────────────
  _buildDoors(worldW, H) {
    const DOOR_W = Phaser.Math.Clamp(Math.round(worldW * 0.048), 60, 110)
    const DOOR_H = Phaser.Math.Clamp(Math.round(H * 0.30), 110, 210)
    const doorY  = H - FLOOR_H - DOOR_H / 2

    const labels = ['I', 'II', 'III', 'IV']
    this._doors = DOOR_X_FRACS.map((xFrac, idx) => {
      const dx = Math.round(worldW * xFrac)

      const frame  = this.add.rectangle(dx, doorY, DOOR_W + 14, DOOR_H + 14, 0x2a1018).setDepth(2)
      const portal = this.add.rectangle(dx, doorY, DOOR_W,      DOOR_H,      0x04020a).setDepth(3)
      const num    = this.add.text(dx, doorY - DOOR_H / 2 + 14, labels[idx], {
        fontFamily: '"Cinzel", Georgia, serif',
        fontSize:   '12px',
        color:      '#662244',
      }).setOrigin(0.5).setDepth(4)

      const trigger = this.add.rectangle(dx, doorY, DOOR_W + 24, DOOR_H, 0x000000).setAlpha(0)
      this.physics.add.existing(trigger, true)

      return { x: dx, y: doorY, doorH: DOOR_H, frame, portal, num, trigger, idx }
    })
  }

  // ── Torch + decoys ────────────────────────────────────────────────────────
  _pickCorrectDoor() {
    this._correctDoor = Phaser.Math.Between(0, DOOR_COUNT - 1)
    this._refreshDecorations()
  }

  _refreshDecorations() {
    this._torchObjects.forEach(o => { try { o.destroy() } catch {} })
    this._decoyObjects.forEach(o => { try { o.destroy() } catch {} })
    this._torchObjects = []
    this._decoyObjects = []

    const door = this._doors[this._correctDoor]
    const H    = this._H

    // Torch handle
    const handle = this.add.rectangle(door.x, door.y - door.doorH / 2 - 10, 6, 22, 0x3a2810).setDepth(6)
    this._torchObjects.push(handle)

    // Flame particles
    const flame = this.add.particles(door.x, door.y - door.doorH / 2 - 18, undefined, {
      lifespan:  { min: 260, max: 460 },
      speed:     { min: 18, max: 50 },
      angle:     { min: 252, max: 288 },
      scale:     { start: 0.44, end: 0 },
      alpha:     { start: 1, end: 0 },
      tint:      [0xff7700, 0xffaa00, 0xffcc44],
      quantity:  2,
      frequency: 30,
      blendMode: 'ADD',
    }).setDepth(7)
    this._torchObjects.push(flame)

    const glow = this.add.rectangle(door.x, door.y - door.doorH / 2, 56, 72, 0xff8800).setAlpha(0.06).setDepth(5)
    this._torchObjects.push(glow)

    // Decoy: yellow paint from round 1
    if (this._round >= 1) {
      const wrongs = this._doors.filter((_, i) => i !== this._correctDoor)
      const pd = Phaser.Utils.Array.GetRandom(wrongs)
      const paint = this.add.rectangle(pd.x, H - FLOOR_H - 10, 96, 20, 0xddc800)
        .setAlpha(0.72).setDepth(5)
      this._decoyObjects.push(paint)
    }

    // Decoy: arrow + text from round 2
    if (this._round >= 2) {
      const wrongs2 = this._doors.filter((_, i) => i !== this._correctDoor)
      const ad  = Phaser.Utils.Array.GetRandom(wrongs2)
      const ax  = ad.x
      const ay  = H - FLOOR_H - 52

      const g = this.add.graphics().setDepth(6)
      g.fillStyle(0xffffff, 0.88)
      g.fillTriangle(ax - 26, ay + 12, ax + 26, ay, ax - 26, ay - 12)
      this._decoyObjects.push(g)

      const txt = this.add.text(ad.x, ay - 28, 'Hier entlang', {
        fontFamily: '"Cinzel", Georgia, serif',
        fontSize:   '14px',
        color:      '#ffffff',
        stroke:     '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(6)
      this._decoyObjects.push(txt)
    }
  }

  // ── Video iframe via Phaser DOM ───────────────────────────────────────────
  _buildVideoFrame() {
    // CSS size = world pixels × zoom (DOM is in screen pixel space)
    const cssW = Math.round(this._frameIW * ZOOM)
    const cssH = Math.round(this._frameIH * ZOOM)
    const style = `width:${cssW}px;height:${cssH}px;border:none;background:#000;display:block;`

    try {
      this._videoFrame = this.add.dom(this._frameCX, this._frameCY, 'iframe', style)
      const node = this._videoFrame.node
      node.setAttribute('allowfullscreen', '')
      node.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture')
      node.src = ''
      this._videoFrame.setVisible(false).setDepth(20)
    } catch (err) {
      console.warn('[PGS] Phaser DOM not available for iframe, will fallback to React overlay', err)
      this._videoFrame = null
    }
  }

  // ── Pedestal ──────────────────────────────────────────────────────────────
  _buildPedestal(worldW, H) {
    const x  = this._frameCX
    const y  = H - FLOOR_H - 24
    this._pedestalZoneX = x

    // Stone pedestal + glowing button (alpha 0 initially)
    const g = this.add.graphics().setDepth(8).setAlpha(0)

    // Base
    g.fillStyle(0x221830, 1)
    g.fillRoundedRect(x - 40, y - 58, 80, 58, 7)
    g.lineStyle(2, 0x8844cc, 0.7)
    g.strokeRoundedRect(x - 40, y - 58, 80, 58, 7)

    // Stone detail lines
    g.lineStyle(1, 0x3a2860, 0.5)
    g.lineBetween(x - 40, y - 38, x + 40, y - 38)
    g.lineBetween(x - 40, y - 20, x + 40, y - 20)

    // Purple glowing button
    g.fillStyle(0x7700bb, 1)
    g.fillCircle(x, y - 35, 16)
    g.lineStyle(3, 0xcc55ff, 0.95)
    g.strokeCircle(x, y - 35, 16)

    // Play triangle (filled white)
    g.fillStyle(0xffffff, 1)
    g.fillTriangle(x - 7, y - 44, x - 7, y - 26, x + 11, y - 35)

    // E-prompt label
    const ePrompt = this.add.text(x, y - 76, '[ E ]  ABSPIELEN', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize:   '13px',
      color:      '#cc88ff',
      stroke:     '#1a0030',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(9).setAlpha(0)

    // F-hint (shown when video is already playing)
    const fHint = this.add.text(x, this._frameCY + this._frameIH / 2 + 18, '[ F ]  Vollbild', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize:   '11px',
      color:      '#9966cc',
      stroke:     '#100020',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(9).setAlpha(0)

    this._pedestalGfx    = g
    this._pedestalEPrompt = ePrompt
    this._pedestalFHint   = fHint

    // Invisible trigger
    const zone = this.add.rectangle(x, y - 30, 88, 70, 0x000000).setAlpha(0)
    this.physics.add.existing(zone, true)
    this._pedestalZone = zone
  }

  _showPedestal() {
    if (this._pedestalShown) return
    this._pedestalShown = true
    this.tweens.add({ targets: this._pedestalGfx,    alpha: 1, duration: 700, ease: 'Quad.easeOut' })
    this.tweens.add({ targets: this._pedestalEPrompt, alpha: 1, duration: 700, delay: 200 })
  }

  _activatePedestal() {
    if (this._videoVisible) return
    this._videoVisible = true
    this._pedestalEPrompt?.setAlpha(0)

    if (this._videoFrame) {
      // Embed directly in the picture frame
      this._videoFrame.node.src = this._videoUrl
      this._videoFrame.setVisible(true)
      this.tweens.add({ targets: this._pedestalFHint, alpha: 0.85, duration: 400, delay: 600 })
    } else {
      // Fallback: React overlay
      window.dispatchEvent(new CustomEvent('game:showVideo', {
        detail: { url: this._videoUrl },
      }))
    }
  }

  // ── Red Dot Waifu — real sprite ───────────────────────────────────────────
  _buildWaifu(worldW, H) {
    const x  = this._frameCX
    const y  = H - FLOOR_H
    const sz = Math.round(H * 0.62)

    this._waifuSprite = this.add.image(x, y, 'pgs_red_dot_waifu')
      .setOrigin(0.5, 1)
      .setDisplaySize(sz, sz)
      .setDepth(6)

    this._waifuLabel = this.add.text(x, y - sz - 6, 'RED DOT WAIFU', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize:   '14px',
      color:      '#ff8899',
      stroke:     '#3a0011',
      strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(7)
  }

  // ── Dialog HUD ────────────────────────────────────────────────────────────
  _buildDialogHUD(W, H) {
    this._dialogBg = this.add.rectangle(W / 2, H - 46, W - 16, 88, 0x08040f)
      .setScrollFactor(0).setAlpha(0).setDepth(60).setStrokeStyle(2, 0xcc2244)

    this._dialogText = this.add.text(20, H - 88, '', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize:   '14px',
      color:      '#f0b0b8',
      wordWrap:   { width: W - 40 },
    }).setScrollFactor(0).setAlpha(0).setDepth(61)

    this._dialogHint = this.add.text(W - 20, H - 18, '', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize:   '11px',
      color:      '#aa5566',
    }).setScrollFactor(0).setOrigin(1, 1).setAlpha(0).setDepth(61)
  }

  _showDialog(lines, onComplete) {
    this._dialogLines   = lines
    this._dialogStep    = 0
    this._dialogCb      = onComplete
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

  // ── Waifu dialog → fade out → reveal pedestal ────────────────────────────
  _startWaifuDialog() {
    this._showDialog([
      'Du... hast es bis hierher geschafft?',
      'Die Speedup-Hexe hat dich für ihre Zwecke benutzt. Was glaubst du, wer du bist?',
      'Schau dich um. Vier Türen. Drei Mal hintereinander den richtigen Ausgang finden.',
      'Das Schild macht es dir leicht? Oder täuscht es dich? Sieh genauer hin.',
      'Und das hier...',
      '[zeigt auf den schwarzen Rahmen hinter sich]',
      '...ist das Wissen, das dich zerstört. Ich halte dich hier fest. Für immer.',
    ], () => {
      // Fade out waifu sprite + label
      const fade = (t) => {
        if (!t) return
        this.tweens.add({ targets: t, alpha: 0, duration: 500,
          onComplete: () => { try { t.destroy() } catch {} } })
      }
      fade(this._waifuSprite)
      fade(this._waifuLabel)
      this._waifuDone = true

      // Reveal pedestal after waifu is gone
      this.time.delayedCall(550, () => this._showPedestal())
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
      // Hide video iframe if playing
      if (this._videoFrame) {
        this._videoFrame.node.src = ''
        this._videoFrame.setVisible(false)
      }
      this.cameras.main.fadeOut(700, 0, 0, 0)
      this.time.delayedCall(760, () => this.scene.start('GalleryScene'))
    })
  }

  // ── Door logic ────────────────────────────────────────────────────────────
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
    this._player.sprite.setPosition(this._frameCX - 180, this._H - FLOOR_H - SPAWN_Y_OFFSET)
    this._player.sprite.setVelocity(0, 0)
  }

  _clearDoorDecorations() {
    this._torchObjects.forEach(o => { try { o.destroy() } catch {} })
    this._decoyObjects.forEach(o => { try { o.destroy() } catch {} })
    this._torchObjects = []
    this._decoyObjects = []
  }

  // ── Final timegate ────────────────────────────────────────────────────────
  _buildFinalGate() {
    const W  = this._W
    const H  = this._H
    const wW = this._worldW
    const x  = wW - Math.round(wW * 0.08)
    this._gateX = x

    const body  = this.add.rectangle(x, H / 2, 64, H + 600, 0x5a0010).setDepth(4)
    const glow  = this.add.rectangle(x, H / 2, 84, H + 620, 0xff0033, 0.1).setDepth(3)
    const label = this.add.text(x, H - FLOOR_H - 160, '01:00', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize:   '18px',
      color:      '#ff4466',
      stroke:     '#300010',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5)

    this.physics.add.existing(body, true)
    if (this._player) this.physics.add.collider(this._player.sprite, body)

    this._timeBarrier = { body, glow, label, state: 'active' }

    let sec = 60
    this._gateTimer = this.time.addEvent({
      delay: 1000, loop: true,
      callback: () => {
        sec = Math.max(0, sec - 1)
        const m = Math.floor(sec / 60)
        const s = sec % 60
        label.setText(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
        if (sec <= 0) {
          this._hideTimegate()
          this._gateTimer?.remove()
        }
      },
    })

    this.add.text(x, H - FLOOR_H - 210, '[ K ]  ABILITY', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize:   '14px',
      color:      '#ff6680',
      stroke:     '#200010',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5)

    // Exit overlap zone past the gate
    const exitZone = this.add.rectangle(wW - 60, H / 2, 120, H + 600, 0x000000).setAlpha(0)
    this.physics.add.existing(exitZone, true)
    if (this._player) {
      this.physics.add.overlap(this._player.sprite, exitZone, () => {
        if (!this._transitioning) this._startDeathRattle()
      }, undefined, this)
    }

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

  // ── Wooden exit sign ──────────────────────────────────────────────────────
  _buildWoodenSign(x, H) {
    const y = H - FLOOR_H - 90
    const g = this.add.graphics().setDepth(8)
    g.fillStyle(0x3d2810, 1)
    g.fillRect(x - 5, y - 40, 10, 80)
    g.fillStyle(0x5a3c18, 1)
    g.fillRoundedRect(x - 48, y - 68, 96, 50, 6)
    g.lineStyle(2, 0x8b6b3e, 0.9)
    g.strokeRoundedRect(x - 48, y - 68, 96, 50, 6)
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

  // ── Diamond shot ──────────────────────────────────────────────────────────
  _fireDiamond() {
    if (!this._timeBarrier || this._timeBarrier.state !== 'active') return
    if (!this._player) return

    const fromX      = this._player.x + 34
    const fromY      = this._player.y - 54
    const distToGate = this._gateX - this._player.x
    const hitsGate   = distToGate > 0 && distToGate <= MAX_DIAMOND_RANGE
    const toX        = hitsGate ? this._gateX : fromX + MAX_DIAMOND_RANGE

    const diamond = this.add.graphics().setDepth(12)
    diamond.fillStyle(0xff4466, 1)
    diamond.fillTriangle(0, -11, 11, 0, 0, 11)
    diamond.fillTriangle(0, -11, -11, 0, 0, 11)
    diamond.setPosition(fromX, fromY)

    const pos = { x: fromX, y: fromY }
    this.tweens.add({
      targets: pos,
      x: toX, y: fromY,
      duration: 340,
      ease: 'Linear',
      onUpdate: () => diamond.setPosition(pos.x, pos.y),
      onComplete: () => {
        if (hitsGate) this._hideTimegate()
        this.tweens.add({ targets: diamond, alpha: 0, duration: 100, onComplete: () => diamond.destroy() })
      },
    })
  }

  // ── update ────────────────────────────────────────────────────────────────
  update() {
    if (!this._player || this._transitioning) return

    if (this._dialogVisible) {
      this._player.halt()
      return
    }

    try {
      this._player.update()
    } catch (err) {
      console.error('[PGS] player update error', err)
      return
    }

    // Ground clamp
    const groundY = this._H - FLOOR_H - SPAWN_Y_OFFSET
    if (this._player.sprite.y > groundY) {
      this._player.sprite.setY(groundY)
      this._player.sprite.setVelocityY(0)
    }

    // Pedestal interaction
    if (
      this._pedestalShown &&
      !this._videoVisible &&
      this._player.interactJustDown &&
      Math.abs(this._player.x - this._pedestalZoneX) < 60
    ) {
      this._activatePedestal()
    }
  }

  // ── shutdown ──────────────────────────────────────────────────────────────
  shutdown() {
    if (this._player) this._player.destroy()
    this._player = null
    if (this._kHandler)  this.input.keyboard.off('keydown-K', this._kHandler)
    if (this._fKeyFn)    window.removeEventListener('keydown', this._fKeyFn)
    if (this._dialogKeyFn) window.removeEventListener('keydown', this._dialogKeyFn, true)
    if (this._gateTimer) this._gateTimer.remove()
    if (this._videoFrame) {
      try { this._videoFrame.node.src = '' } catch {}
    }
    this._torchObjects.forEach(o => { try { o.destroy() } catch {} })
    this._decoyObjects.forEach(o => { try { o.destroy() } catch {} })
  }
}
