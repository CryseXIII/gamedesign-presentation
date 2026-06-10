/**
 * PlayerGuidanceScene — Scene 2: Die Rote Festung
 *
 * Single-screen platformer — no camera scroll, no zoom.
 *
 * Layout:
 *   Background  pgs_bg_castle.png fills canvas W×H
 *   Floor        ground at H − FLOOR_H
 *   4 stone-curtain platforms (one-way — jump through from below, Down+Space to drop):
 *     P0 oben-links   x≈17% W,  y≈H−330
 *     P1 oben-rechts  x≈83% W,  y≈H−330
 *     P2 unten-links  x≈20% W,  y≈H−220
 *     P3 unten-rechts x≈80% W,  y≈H−220
 *   Each platform has a door trigger.  Correct door is marked with a CPU torch.
 *   Find the correct door 3× in a row → final timegate spawns.
 *   K fires a diamond shot that shatters the timegate.
 *
 *   Red Dot Waifu sprite at x≈38% W, floor level.
 *   Video iframe in the castle's ornate picture frame (background).
 *   Pedestal with [E] ABSPIELEN appears after waifu dialog.
 *
 * YouTube: https://www.youtube.com/embed/OK4koZJcook?autoplay=1&start=1240
 */

import Phaser from 'phaser'
import PlayerController, { FLOOR_H, SPAWN_Y_OFFSET } from '../PlayerController.js'
import GameState from '../GameState.js'

// ── Constants ──────────────────────────────────────────────────────────────────
const CORRECT_NEEDED    = 3
const MAX_DIAMOND_RANGE = 1400

// Video embed URL  (20:40 = 1240 s)
const VIDEO_URL = 'https://www.youtube.com/embed/OK4koZJcook?autoplay=1&start=1240'

// Picture-frame: ornate frame in bg_castle, tuned for 1280×720 canvas
const FRAME_CX_FRAC = 0.500
const FRAME_CY_FRAC = 0.430
const FRAME_IW_FRAC = 0.195
const FRAME_IH_FRAC = 0.290

// Platform positions tuned for bg_castle.png displayed at 1280×720
// Castle visual floor ≈ H*0.86.  Portals at ~50% and ~68% of H from top.
const PGS_FLOOR_TOP_FRAC = 0.86   // castle's walkable surface as fraction of H

const PLAT_DEFS = [
  { id: 'oben-links',   xFrac: 0.165, yFrac: 0.46, label: 'I'   },
  { id: 'oben-rechts',  xFrac: 0.836, yFrac: 0.46, label: 'II'  },
  { id: 'unten-links',  xFrac: 0.165, yFrac: 0.63, label: 'III' },
  { id: 'unten-rechts', xFrac: 0.836, yFrac: 0.63, label: 'IV'  },
]
const PLAT_W_FRAC = 0.10
const PLAT_H_PX   = 20

// ── Scene ──────────────────────────────────────────────────────────────────────
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
    this._doorCooldown   = false
    this._videoVisible   = false
    this._pedestalShown  = false
    this._W = this._H    = 0

    this._platforms     = []   // { x, topY, w, body, collider }
    this._doors         = []   // { platIdx, trigX, trigY, trigW, trigH, trigger }
    this._torchObjs     = []
    this._decoyObjs     = []
    this._timeBarrier   = null
    this._gateTimer     = null
    this._gateX         = 0

    this._pedestalGfx   = null
    this._pedestalEPmt  = null
    this._pedestalFHint = null
    this._pedestalX     = 0

    this._videoFrame    = null
    this._videoFrameX   = 0
    this._videoFrameY   = 0

    this._waifuSprite   = null
    this._waifuLabel    = null

    this._dialogVisible  = false
    this._dialogLines    = []
    this._dialogStep     = 0
    this._dialogCb       = null
    this._dialogKeyFn    = null
    this._dialogBg       = null
    this._dialogText     = null
    this._dialogHint     = null
    this._dialogSpeaker  = null

    this._kHandler       = null
    this._fKeyFn         = null
    this._speedBoost     = false
    this._nearDoor       = -1
    this._eDoorFn        = null
  }

  init() {
    this._reset()
    this._speedBoost = !!GameState.speedBoostUnlocked
  }

  // ── preload ─────────────────────────────────────────────────────────────────
  preload() {
    if (!this.textures.exists('pgs_bg_castle'))
      this.load.image('pgs_bg_castle', '/assets/scenes/pgs/bg_castle.png')
    if (!this.textures.exists('pgs_red_dot_waifu'))
      this.load.image('pgs_red_dot_waifu', '/assets/scenes/pgs/red_dot_waifu.png')
    if (!this.textures.exists('pgs_rdw_victory'))
      this.load.image('pgs_rdw_victory', '/assets/scenes/pgs/rdw_victory.jpg')
  }

  // ── create ──────────────────────────────────────────────────────────────────
  create() {
    const W = this.scale.width
    const H = this.scale.height
    this._W = W
    this._H = H

    // Fixed camera — no scroll, no zoom
    this.cameras.main.setBounds(0, 0, W, H)
    this.physics.world.setBounds(0, 0, W, H + 400)

    // ── Background ─────────────────────────────────────────────────────────
    this.add.image(0, 0, 'pgs_bg_castle')
      .setOrigin(0, 0)
      .setDisplaySize(W, H)
      .setDepth(-10)

    // ── Floor (castle visual floor at PGS_FLOOR_TOP_FRAC of H) ────────────────
    const floorTopY = Math.round(H * PGS_FLOOR_TOP_FRAC)
    const floorCY   = floorTopY + FLOOR_H / 2
    const floor     = this.add.rectangle(W / 2, floorCY, W, FLOOR_H, 0x000000, 0)
    this.physics.add.existing(floor, true)

    // ── Boundary walls ──────────────────────────────────────────────────────
    const wallH = H + 400
    const wallL = this.add.rectangle(Math.round(W * 0.11), H / 2, 12, wallH, 0x000000, 0)
    const wallR = this.add.rectangle(Math.round(W * 0.89), H / 2, 12, wallH, 0x000000, 0)
    this.physics.add.existing(wallL, true)
    this.physics.add.existing(wallR, true)

    // ── Platforms (yFrac from top) ─────────────────────────────────────────
    const platW = Math.round(W * PLAT_W_FRAC)

    PLAT_DEFS.forEach((def, idx) => {
      const px   = Math.round(W * def.xFrac)
      const topY = Math.round(H * def.yFrac)
      const midY = topY + PLAT_H_PX / 2

      const slab = this.add.rectangle(px, midY, platW, PLAT_H_PX, 0x000000, 0)
      this.physics.add.existing(slab, true)

      this._drawDoorArch(px, topY, platW, idx)
      this._platforms.push({ x: px, topY, w: platW, slab, body: slab.body })
    })

    // ── Video frame position ────────────────────────────────────────────────
    this._videoFrameX = Math.round(W * FRAME_CX_FRAC)
    this._videoFrameY = Math.round(H * FRAME_CY_FRAC)

    // ── Player ─────────────────────────────────────────────────────────────
    const spawnX = Math.round(W * 0.14)
    const spawnY = floorTopY - SPAWN_Y_OFFSET
    this._player = new PlayerController(this, spawnX, spawnY)

    // Colliders
    this.physics.add.collider(this._player.sprite, floor)
    this.physics.add.collider(this._player.sprite, wallL)
    this.physics.add.collider(this._player.sprite, wallR)

    // One-way colliders with platforms
    this._platforms.forEach((plat) => {
      const col = this.physics.add.collider(
        this._player.sprite,
        plat.slab,
        null,
        (playerSprite, platform) => {
          if (this._player.dropThrough) return false
          const body = playerSprite.body
          if (body.velocity.y < 0) return false           // rising — pass through
          const playerBottom = body.y + body.height
          if (playerBottom > platform.body.y + 12) return false  // below top
          return true
        },
        this,
      )
      plat.collider = col
    })

    // ── Door triggers on platforms ──────────────────────────────────────────
    this._buildDoors(platW, floorTopY)

    // ── Video iframe ───────────────────────────────────────────────────────
    this._buildVideoFrame(W, H)

    // ── Pedestal ───────────────────────────────────────────────────────────
    this._buildPedestal(W, H)

    // ── Waifu sprite ───────────────────────────────────────────────────────
    this._buildWaifu(W, H)

    // ── Dialog HUD ─────────────────────────────────────────────────────────
    this._buildDialogHUD(W, H)

    // ── Camera fade-in ─────────────────────────────────────────────────────
    this.cameras.main.fadeIn(600, 0, 0, 0)

    // ── Keyboard ───────────────────────────────────────────────────────────
    this.input.keyboard.enableGlobalCapture()

    this._kHandler = () => {
      if (this._timeBarrier?.state === 'active' && this._speedBoost) {
        this._player?.triggerInteract()
        this._fireDiamond()
      }
    }
    this.input.keyboard.on('keydown-K', this._kHandler)

    this._fKeyFn = (e) => {
      if ((e.key === 'f' || e.key === 'F') && this._videoVisible && this._videoFrame) {
        try { this._videoFrame.node.requestFullscreen?.() } catch {}
      }
    }
    window.addEventListener('keydown', this._fKeyFn)

    // Door E-press handler — live proximity check, no overlap flag needed
    this._eDoorFn = (e) => {
      if (e.key !== 'e' && e.key !== 'E') return
      if (this._dialogVisible || !this._waifuDone || this._finalGateBuilt || this._doorCooldown) return
      const near = this._nearestDoor()
      if (near >= 0) this._onDoorEntered(near)
    }
    window.addEventListener('keydown', this._eDoorFn)

    // ── First round setup ──────────────────────────────────────────────────
    this._pickCorrectDoor()

    // ── Waifu intro dialog ─────────────────────────────────────────────────
    this.time.delayedCall(900, () => this._startWaifuDialog())
  }

  // ── Door arch visual — dark opening only, no labels ──────────────────────
  _drawDoorArch(px, topY, platW, _idx) {
    const g     = this.add.graphics().setDepth(3)
    const doorW = Math.round(platW * 0.70)
    const doorH = 80
    const archR = Math.round(doorW * 0.5)

    // Dark door void
    g.fillStyle(0x06040c, 0.92)
    g.fillRect(px - doorW / 2, topY - doorH + archR, doorW, doorH - archR)
    g.fillCircle(px, topY - doorH + archR, archR)

    // Subtle frame edge
    g.lineStyle(2, 0x3a2860, 0.6)
    g.strokeRect(px - doorW / 2, topY - doorH + archR, doorW, doorH - archR)
  }

  // ── Door triggers (one per platform, at the arch opening on platform) ──────
  _buildDoors(platW, floorTopY) {
    const doorW     = Math.round(platW * 0.46)
    const doorTrigH = 100    // trigger height on platform surface

    PLAT_DEFS.forEach((def, idx) => {
      const px    = Math.round(this._W * def.xFrac)
      const topY  = floorTopY - def.yOffBot    // platform surface y
      const trigY = topY - doorTrigH / 2       // trigger centered above platform surface

      const trig = this.add.rectangle(px, trigY, doorW + 16, doorTrigH, 0x000000).setAlpha(0)
      this.physics.add.existing(trig, true)

      this.physics.add.overlap(this._player.sprite, trig, () => {
        this._nearDoor = idx
      }, undefined, this)

      this._doors.push({ platIdx: idx, x: px, trigY, trigger: trig })
    })
  }

  // ── Torch + decoys ─────────────────────────────────────────────────────────
  _pickCorrectDoor() {
    this._correctDoor = Phaser.Math.Between(0, PLAT_DEFS.length - 1)
    this._refreshDecorations()
  }

  _refreshDecorations() {
    this._torchObjs.forEach(o => { try { o.destroy() } catch {} })
    this._decoyObjs.forEach(o => { try { o.destroy() } catch {} })
    this._torchObjs = []
    this._decoyObjs = []

    const def  = PLAT_DEFS[this._correctDoor]
    const px   = Math.round(this._W * def.xFrac)
    const topY = Math.round(this._H * def.yFrac)   // platform surface Y from top

    // Torch beside the correct door
    const torchX = px + Math.round(this._W * PLAT_W_FRAC / 2) + 18
    this._drawTorch(torchX, topY - 4)

    // Round ≥ 1: yellow paint splash on ONE wrong platform
    if (this._round >= 1) {
      const wrongs = PLAT_DEFS.filter((_, i) => i !== this._correctDoor)
      const wd  = Phaser.Utils.Array.GetRandom(wrongs)
      const wdx = Math.round(this._W * wd.xFrac)
      const wdY = Math.round(this._H * wd.yFrac)

      const g = this.add.graphics().setDepth(5)
      // Paint spill shape — ellipse + drips
      g.fillStyle(0xddc800, 0.75)
      g.fillEllipse(wdx, wdY - 3, 80, 18)
      // A couple of paint drips below
      g.fillRect(wdx - 24, wdY - 3, 8, 22)
      g.fillRect(wdx + 12, wdY - 3, 6, 16)
      this._decoyObjs.push(g)
    }

    // Round ≥ 2: arrows + "Hier entlang" pointing to wrong exits
    if (this._round >= 2) {
      const wrongs2 = PLAT_DEFS.filter((_, i) => i !== this._correctDoor)
      wrongs2.forEach(ad => {
        const adx  = Math.round(this._W * ad.xFrac)
        const adY  = Math.round(this._H * ad.yFrac) - 50   // above the door

        const ag = this.add.graphics().setDepth(6)
        ag.fillStyle(0xffffff, 0.90)
        // Arrow pointing right (toward the door)
        const pointDir = adx < this._W / 2 ? 1 : -1
        if (pointDir > 0) {
          ag.fillTriangle(adx + 28, adY, adx + 8, adY - 12, adx + 8, adY + 12)
        } else {
          ag.fillTriangle(adx - 28, adY, adx - 8, adY - 12, adx - 8, adY + 12)
        }
        this._decoyObjs.push(ag)

        const at = this.add.text(adx, adY - 22, 'Hier entlang', {
          fontFamily: '"Cinzel", Georgia, serif',
          fontSize:   '12px',
          color:      '#ffffff',
          stroke:     '#000000',
          strokeThickness: 3,
        }).setOrigin(0.5).setDepth(6)
        this._decoyObjs.push(at)
      })
    }
  }

  _drawTorch(x, y) {
    const g = this.add.graphics().setDepth(8)
    // Handle
    g.fillStyle(0x3a2810, 1)
    g.fillRect(x - 3, y, 6, 22)
    // Cup / bowl
    g.fillStyle(0x6a4820, 1)
    g.fillRect(x - 5, y - 4, 10, 6)
    // Glow halo (soft circle)
    g.fillStyle(0xff8800, 0.12)
    g.fillCircle(x, y - 8, 26)
    g.fillStyle(0xff8800, 0.18)
    g.fillCircle(x, y - 8, 18)
    // Flame shape (triangle)
    g.fillStyle(0xff6600, 0.85)
    g.fillTriangle(x, y - 22, x - 7, y - 4, x + 7, y - 4)
    g.fillStyle(0xffcc00, 0.9)
    g.fillTriangle(x, y - 16, x - 4, y - 4, x + 4, y - 4)
    this._torchObjs.push(g)

    // Pulsing tween for the glow
    const pulse = this.add.graphics().setDepth(7)
    pulse.fillStyle(0xff8800, 0.08)
    pulse.fillCircle(0, 0, 32)
    pulse.setPosition(x, y - 8)
    this._torchObjs.push(pulse)
    this.tweens.add({
      targets: pulse, alpha: 0.4, yoyo: true, repeat: -1,
      duration: 600, ease: 'Sine.easeInOut',
    })
  }

  // ── Video iframe ───────────────────────────────────────────────────────────
  _buildVideoFrame(W, H) {
    const iw    = Math.round(W * FRAME_IW_FRAC)
    const ih    = Math.round(H * FRAME_IH_FRAC)
    const style = `width:${iw}px;height:${ih}px;border:none;background:#000;display:block;`
    try {
      this._videoFrame = this.add.dom(this._videoFrameX, this._videoFrameY, 'iframe', style)
      this._videoFrame.node.setAttribute('allowfullscreen', '')
      this._videoFrame.node.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture')
      this._videoFrame.node.src = ''
      this._videoFrame.setVisible(false).setDepth(20)
    } catch (err) {
      console.warn('[PGS] DOM iframe unavailable', err)
      this._videoFrame = null
    }
  }

  // ── Pedestal ───────────────────────────────────────────────────────────────
  _buildPedestal(W, H) {
    const x  = this._videoFrameX
    const y  = H - FLOOR_H - 20
    this._pedestalX = x

    const g = this.add.graphics().setDepth(8).setAlpha(0)
    g.fillStyle(0x221830, 1)
    g.fillRoundedRect(x - 40, y - 58, 80, 58, 7)
    g.lineStyle(2, 0x8844cc, 0.7)
    g.strokeRoundedRect(x - 40, y - 58, 80, 58, 7)
    g.lineStyle(1, 0x3a2860, 0.5)
    g.lineBetween(x - 40, y - 38, x + 40, y - 38)
    g.lineBetween(x - 40, y - 20, x + 40, y - 20)
    g.fillStyle(0x7700bb, 1)
    g.fillCircle(x, y - 35, 16)
    g.lineStyle(3, 0xcc55ff, 0.95)
    g.strokeCircle(x, y - 35, 16)
    g.fillStyle(0xffffff, 1)
    g.fillTriangle(x - 7, y - 44, x - 7, y - 26, x + 11, y - 35)

    const ePrompt = this.add.text(x, y - 78, '[ E ]  ABSPIELEN', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize:   '20px',
      color:      '#cc88ff',
      stroke:     '#1a0030',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(9).setAlpha(0)

    const fHint = this.add.text(x, Math.round(H * FRAME_CY_FRAC) + Math.round(H * FRAME_IH_FRAC / 2) + 18,
      '[ F ]  Vollbild', {
        fontFamily: '"Cinzel", Georgia, serif',
        fontSize:   '18px',
        color:      '#9966cc',
        stroke:     '#100020',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(9).setAlpha(0)

    this._pedestalGfx   = g
    this._pedestalEPmt  = ePrompt
    this._pedestalFHint = fHint

    // Trigger zone for E press
    const zone = this.add.rectangle(x, y - 30, 100, 90, 0x000000).setAlpha(0)
    this.physics.add.existing(zone, true)
    this._pedestalZone = zone

    this.physics.add.overlap(this._player.sprite, zone, () => {
      if (this._pedestalShown && !this._videoVisible && this._player.interactJustDown) {
        this._activatePedestal()
      }
    }, undefined, this)
  }

  _showPedestal() {
    if (this._pedestalShown) return
    this._pedestalShown = true
    this.tweens.add({ targets: this._pedestalGfx,  alpha: 1, duration: 700, ease: 'Quad.easeOut' })
    this.tweens.add({ targets: this._pedestalEPmt, alpha: 1, duration: 700, delay: 200 })
  }

  _activatePedestal() {
    if (this._videoVisible) return
    this._videoVisible = true
    this._pedestalEPmt?.setAlpha(0)

    if (this._videoFrame) {
      this._videoFrame.node.src = VIDEO_URL
      this._videoFrame.setVisible(true)
      this.tweens.add({ targets: this._pedestalFHint, alpha: 0.85, duration: 400, delay: 600 })
    } else {
      window.dispatchEvent(new CustomEvent('game:showVideo', { detail: { url: VIDEO_URL } }))
    }
  }

  // ── Red Dot Waifu sprite ───────────────────────────────────────────────────
  _buildWaifu(W, H) {
    const floorTopY = Math.round(H * PGS_FLOOR_TOP_FRAC)
    const x  = Math.round(W * 0.55)   // further right, near the frame
    const y  = floorTopY
    const ph = 280
    const pw = 280   // source is 1:1

    this._waifuSprite = this.add.image(x, y, 'pgs_red_dot_waifu')
      .setOrigin(0.5, 1)
      .setDisplaySize(pw, ph)
      .setDepth(6)
    // Bilinear for the photo-style portrait
    try { this.textures.get('pgs_red_dot_waifu').setFilter(Phaser.Textures.FilterMode.LINEAR) } catch {}

    this._waifuLabel = this.add.text(x, y - ph - 4, 'RED DOT WAIFU', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize:   '22px',
      color:      '#ff8899',
      stroke:     '#3a0011',
      strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(7)
  }

  // ── Dialog HUD ─────────────────────────────────────────────────────────────
  _buildDialogHUD(W, H) {
    // All at scrollFactor(0) in screen-space coordinates
    const boxH  = 90
    const boxY  = H - boxH / 2 - 4
    const textY = H - boxH + 10
    const hintY = H - 10

    this._dialogBg = this.add.rectangle(W / 2, boxY, W - 12, boxH, 0x08040f)
      .setScrollFactor(0).setAlpha(0).setDepth(60).setStrokeStyle(2, 0xcc2244)

    this._dialogSpeaker = this.add.text(18, boxY - boxH / 2 + 8, '', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize:   '18px',
      color:      '#ff8899',
    }).setScrollFactor(0).setAlpha(0).setDepth(61)

    this._dialogText = this.add.text(18, textY + 16, '', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize:   '22px',
      color:      '#f0b0b8',
      wordWrap:   { width: W - 36 },
    }).setScrollFactor(0).setAlpha(0).setDepth(61)

    this._dialogHint = this.add.text(W - 18, hintY, '', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize:   '18px',
      color:      '#aa5566',
    }).setScrollFactor(0).setOrigin(1, 1).setAlpha(0).setDepth(61)
  }

  _showDialog(lines, onComplete, speaker = 'Red Dot Waifu') {
    this._dialogLines   = lines
    this._dialogStep    = 0
    this._dialogCb      = onComplete
    this._dialogVisible = true
    this._dialogBg.setAlpha(0.95)
    this._dialogSpeaker.setAlpha(1)
    this._dialogText.setAlpha(1)
    this._dialogHint.setAlpha(0.85)
    if (speaker) this._dialogSpeaker.setText(speaker)
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

    // Freeze player while talking
    this._player?.freeze()
  }

  _updateDialogLine() {
    this._dialogText.setText(this._dialogLines[this._dialogStep])
    this._dialogHint.setText(`${this._dialogStep + 1} / ${this._dialogLines.length}   [E] Weiter`)
  }

  _closeDialog() {
    this._dialogVisible = false
    this._dialogBg.setAlpha(0)
    this._dialogSpeaker.setAlpha(0)
    this._dialogText.setAlpha(0)
    this._dialogHint.setAlpha(0)
    if (this._dialogKeyFn) {
      window.removeEventListener('keydown', this._dialogKeyFn, true)
      this._dialogKeyFn = null
    }
    this._player?.unfreeze()
    if (this._dialogCb) {
      const cb = this._dialogCb
      this._dialogCb = null
      cb()
    }
  }

  // ── Waifu dialog ───────────────────────────────────────────────────────────
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
      const fade = (t) => {
        if (!t) return
        this.tweens.add({ targets: t, alpha: 0, duration: 500, onComplete: () => { try { t.destroy() } catch {} } })
      }
      fade(this._waifuSprite)
      fade(this._waifuLabel)
      this._waifuDone = true
      this.time.delayedCall(560, () => this._showPedestal())
    })
  }

  // ── Door logic ─────────────────────────────────────────────────────────────
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
          this._clearDecorations()
          this._showVictoryScreen()
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
    const floorTopY = Math.round(this._H * PGS_FLOOR_TOP_FRAC)
    this._player.sprite.setPosition(Math.round(this._W * 0.14), floorTopY - SPAWN_Y_OFFSET)
    this._player.sprite.setVelocity(0, 0)
  }

  _clearDecorations() {
    this._torchObjs.forEach(o => { try { o.destroy() } catch {} })
    this._decoyObjs.forEach(o => { try { o.destroy() } catch {} })
    this._torchObjs = []
    this._decoyObjs = []
  }

  // ── Live door proximity — used by E-key handler ────────────────────────────
  _nearestDoor() {
    if (!this._player) return -1
    const px = this._player.sprite.x
    const py = this._player.sprite.y
    const platW = Math.round(this._W * PLAT_W_FRAC)
    for (let i = 0; i < this._platforms.length; i++) {
      const plat = this._platforms[i]
      const door = this._doors[i]
      if (!door) continue
      const dx = Math.abs(px - door.x)
      // Player center Y when standing on platform: topY - SPAWN_Y_OFFSET
      const standY = plat.topY - 50
      const dy = Math.abs(py - standY)
      if (dx < platW * 0.8 && dy < 90) return i
    }
    return -1
  }

  // ── Victory screen after 3rd correct door ─────────────────────────────────
  _showVictoryScreen() {
    const W = this._W
    const H = this._H
    this._player?.freeze()

    // Full-screen victory image
    let vsImg = null
    if (this.textures.exists('pgs_rdw_victory')) {
      vsImg = this.add.image(W / 2, H / 2, 'pgs_rdw_victory')
        .setDisplaySize(W, H)
        .setDepth(50)
        .setAlpha(0)
      this.tweens.add({ targets: vsImg, alpha: 1, duration: 600 })
    }

    // Waifu death rattle dialog on top
    this.time.delayedCall(700, () => {
      this._showDialog([
        '[röchelt]  Das... ist nicht möglich...',
        'Ich bin in meinem eigenen Zauber gefangen...',
        'Ich finde... den Ausgang nicht mehr...',
        '[verschwindet im Dunkel]',
      ], () => {
        this._transitioning = true
        if (vsImg) this.tweens.add({ targets: vsImg, alpha: 0, duration: 400 })
        if (this._videoFrame) {
          this._videoFrame.node.src = ''
          this._videoFrame.setVisible(false)
        }
        this.cameras.main.fadeOut(700, 0, 0, 0)
        this.time.delayedCall(760, () => this.scene.start('BannerSirenScene'))
      }, 'Red Dot Waifu')
    })
  }

  // ── Final timegate ─────────────────────────────────────────────────────────
  _buildFinalGate() {
    const W  = this._W
    const H  = this._H
    const x  = W - Math.round(W * 0.06)
    this._gateX = x

    const body  = this.add.rectangle(x, H / 2, 56, H + 400, 0x5a0010).setDepth(4)
    const glow  = this.add.rectangle(x, H / 2, 80, H + 420, 0xff0033, 0.10).setDepth(3)
    const label = this.add.text(x, H - FLOOR_H - 150, '01:00', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize:   '26px',
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

    this.add.text(x, H - FLOOR_H - 200, '[ K ]  ABILITY', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize:   '22px',
      color:      '#ff6680',
      stroke:     '#200010',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5)

    // Exit zone past gate (unused now — victory screen handles transition)
    const exitZone = this.add.rectangle(W - 30, H / 2, 60, H + 400, 0x000000).setAlpha(0)
    this.physics.add.existing(exitZone, true)

    // Wooden exit sign
    this._buildWoodenSign(x + 90, H)
  }

  _hideTimegate() {
    if (!this._timeBarrier) return
    this._timeBarrier.state = 'hidden'
    this._timeBarrier.body.setAlpha(0)
    this._timeBarrier.body.body.enable = false
    this._timeBarrier.glow.setAlpha(0)
    this._timeBarrier.label.setAlpha(0)
  }

  _buildWoodenSign(x, H) {
    const y = H - FLOOR_H - 80
    const g = this.add.graphics().setDepth(8)
    g.fillStyle(0x3d2810, 1)
    g.fillRect(x - 5, y - 36, 10, 72)
    g.fillStyle(0x5a3c18, 1)
    g.fillRoundedRect(x - 48, y - 62, 96, 48, 6)
    g.lineStyle(2, 0x8b6b3e, 0.9)
    g.strokeRoundedRect(x - 48, y - 62, 96, 48, 6)
    g.fillStyle(0xd1bf91, 0.9)
    g.fillTriangle(x + 8, y - 38, x + 26, y - 38 + 10, x + 8, y - 38 + 20)
    this.add.text(x - 10, y - 46, 'WEITER', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize:   '20px',
      color:      '#d1bf91',
      stroke:     '#1a100a',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(9)
  }

  // ── Diamond shot ───────────────────────────────────────────────────────────
  _fireDiamond() {
    if (!this._timeBarrier || this._timeBarrier.state !== 'active') return
    if (!this._player) return

    const fromX = this._player.x + 34
    const fromY = this._player.y - 54
    const dist  = this._gateX - this._player.x
    const hits  = dist > 0 && dist <= MAX_DIAMOND_RANGE
    const toX   = hits ? this._gateX : fromX + MAX_DIAMOND_RANGE

    const d = this.add.graphics().setDepth(12)
    d.fillStyle(0xff4466, 1)
    d.fillTriangle(0, -11, 11, 0, 0, 11)
    d.fillTriangle(0, -11, -11, 0, 0, 11)
    d.setPosition(fromX, fromY)

    const pos = { x: fromX }
    this.tweens.add({
      targets: pos, x: toX, duration: 300, ease: 'Linear',
      onUpdate: () => d.setPosition(pos.x, fromY),
      onComplete: () => {
        if (hits) this._hideTimegate()
        this.tweens.add({ targets: d, alpha: 0, duration: 100, onComplete: () => d.destroy() })
      },
    })
  }

  // ── update ─────────────────────────────────────────────────────────────────
  update() {
    if (!this._player || this._transitioning) return

    if (this._dialogVisible) {
      this._player.freeze()
      return
    }

    try {
      this._player.update()
    } catch (err) {
      console.error('[PGS] player update error', err)
      return
    }

    // Hard floor clamp (safety)
    const maxY = Math.round(this._H * PGS_FLOOR_TOP_FRAC) - SPAWN_Y_OFFSET
    if (this._player.sprite.y > maxY + 8) {
      this._player.sprite.setY(maxY)
      this._player.sprite.setVelocityY(0)
    }
  }

  // ── shutdown ───────────────────────────────────────────────────────────────
  shutdown() {
    if (this._player) this._player.destroy()
    this._player = null
    if (this._kHandler)  this.input.keyboard.off('keydown-K', this._kHandler)
    if (this._fKeyFn)    window.removeEventListener('keydown', this._fKeyFn)
    if (this._eDoorFn)   window.removeEventListener('keydown', this._eDoorFn)
    if (this._dialogKeyFn) window.removeEventListener('keydown', this._dialogKeyFn, true)
    if (this._gateTimer) this._gateTimer.remove()
    if (this._videoFrame) { try { this._videoFrame.node.src = '' } catch {} }
    this._clearDecorations()
  }
}
