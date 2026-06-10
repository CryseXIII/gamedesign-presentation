/**
 * FomoWidowScene — Scene 6: Der lange Gang
 *
 * Beat:
 *   1. Fomo Widow introduces herself and asks why the player is here.
 *   2. Long horizontal corridor with 5 video stations, each with [E] to open, [F] fullscreen, [C] close.
 *   3. After reaching the far right end, Widow reappears with final question.
 *   4. "Weils Spaß macht" → Widow says farewell and disappears.
 *   5. Player walks to exit → CreditsScene.
 *
 * Video station URLs are defined as constants — swap them as needed.
 */

import Phaser from 'phaser'
import PlayerController, { FLOOR_H, SPAWN_Y_OFFSET } from '../PlayerController.js'
import GameState from '../GameState.js'

// ── Video URLs (swap as needed) ───────────────────────────────────────────────
const VIDEO_STATIONS = [
  {
    label: '① Dark Souls — Level Design',
    url:   'https://www.youtube.com/embed/OK4koZJcook?autoplay=1&start=1240',
  },
  {
    label: '② Gacha Psychology',
    url:   'https://www.youtube.com/embed/xNjI03CGkb4?autoplay=1',
  },
  {
    label: '③ Game Feel',
    url:   'https://www.youtube.com/embed/AJdEqssNZ-U?autoplay=1',
  },
  {
    label: '④ Risk vs Reward',
    url:   'https://www.youtube.com/embed/2X3LoNp2TEA?autoplay=1',
  },
  {
    label: '⑤ Manipulation in Games',
    url:   'https://www.youtube.com/embed/E7NXVA6oRJo?autoplay=1',
  },
]

// World width: 5 stations + padding
const CORRIDOR_W_MULTIPLIER = 6   // world W = canvas W × this
const STATION_SPACING_FRAC  = 0.16  // fraction of world W between stations

export default class FomoWidowScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FomoWidowScene' })
  }

  _reset() {
    this._player          = null
    this._transitioning   = false
    this._endReached      = false
    this._dialogVisible   = false
    this._dialogLines     = []
    this._dialogStep      = 0
    this._dialogCb        = null
    this._dialogKeyFn     = null
    this._dialogBg        = null
    this._dialogText      = null
    this._dialogHint      = null
    this._dialogSpeaker   = null
    this._videoFrames     = []
    this._activeFrame     = null
    this._W = this._H = this._worldW = 0
    this._widowSprite     = null
    this._widowLabel      = null
    this._fKeyFn          = null
    this._cKeyFn          = null
    this._nearStation     = null
    this._eKeyFn          = null
  }

  init() { this._reset() }

  create() {
    const W = this.scale.width
    const H = this.scale.height
    const worldW = W * CORRIDOR_W_MULTIPLIER
    this._W = W
    this._H = H
    this._worldW = worldW

    this.cameras.main.setBounds(0, 0, worldW, H)
    this.physics.world.setBounds(0, 0, worldW, H + 200)

    // ── Background: tile the corridor image ───────────────────────────────────
    if (this.textures.exists('fw_bg')) {
      this.add.tileSprite(worldW / 2, H / 2, worldW, H, 'fw_bg')
        .setDepth(-10)
    } else {
      const g = this.add.graphics().setDepth(-10)
      g.fillStyle(0x060410, 1); g.fillRect(0, 0, worldW, H)
      // simple repeating stone lines
      g.lineStyle(1, 0x0f0a1a, 0.7)
      for (let x = 0; x < worldW; x += 64) g.lineBetween(x, 0, x, H)
    }

    // ── Floor ─────────────────────────────────────────────────────────────────
    const floorTopY = H - FLOOR_H
    const floorRect = this.add.rectangle(worldW / 2, H - FLOOR_H / 2, worldW, FLOOR_H * 2, 0, 0)
    this.physics.add.existing(floorRect, true)

    // ── Right boundary wall ───────────────────────────────────────────────────
    const wallR = this.add.rectangle(worldW + 20, H / 2, 40, H + 200, 0, 0)
    this.physics.add.existing(wallR, true)

    // ── Player ────────────────────────────────────────────────────────────────
    this._player = new PlayerController(this, Math.round(W * 0.08), floorTopY - SPAWN_Y_OFFSET)
    this.physics.add.collider(this._player.sprite, floorRect)
    this.physics.add.collider(this._player.sprite, wallR)

    // ── Fomo Widow (intro) ────────────────────────────────────────────────────
    this._buildWidow(Math.round(W * 0.32), floorTopY, 'intro')

    // ── Video stations ────────────────────────────────────────────────────────
    this._buildVideoStations(W, H, worldW, floorTopY)

    // ── End zone ──────────────────────────────────────────────────────────────
    const endX = worldW - Math.round(W * 0.1)
    const endZone = this.add.rectangle(endX, H / 2, W * 0.2, H + 200, 0, 0)
    this.physics.add.existing(endZone, true)
    this.physics.add.overlap(this._player.sprite, endZone, () => {
      if (!this._endReached && !this._transitioning) this._onEndReached(endX, floorTopY)
    }, undefined, this)

    // ── Dialog HUD ────────────────────────────────────────────────────────────
    this._buildDialogHUD(W, H)

    // ── Camera follows player ─────────────────────────────────────────────────
    this.cameras.main.fadeIn(700, 0, 0, 0)
    this.cameras.main.startFollow(this._player.sprite, true, 0.1, 0.1)
    this.cameras.main.setFollowOffset(-W * 0.2, 0)
    this.input.keyboard.enableGlobalCapture()

    // F key — fullscreen current video
    this._fKeyFn = (e) => {
      if ((e.key === 'f' || e.key === 'F') && this._activeFrame) {
        try { this._activeFrame.node.requestFullscreen?.() } catch {}
      }
    }
    window.addEventListener('keydown', this._fKeyFn)

    // C key — close video
    this._cKeyFn = (e) => {
      if ((e.key === 'c' || e.key === 'C') && this._activeFrame) {
        this._closeActiveVideo()
      }
    }
    window.addEventListener('keydown', this._cKeyFn)

    // E key handled in update via _nearStation
    this._eKeyFn = (e) => {
      if ((e.key === 'e' || e.key === 'E') && this._nearStation !== null && !this._activeFrame && !this._dialogVisible) {
        this._openVideo(this._nearStation)
      }
    }
    window.addEventListener('keydown', this._eKeyFn)

    // Intro dialog
    this.time.delayedCall(900, () => this._startIntroDialog())
  }

  _buildWidow(x, floorTopY, _phase) {
    const ph = 160
    if (this.textures.exists('wb_fomo_widow')) {
      const tex  = this.textures.get('wb_fomo_widow')
      const srcH = tex.getSourceImage().height
      const srcW = tex.getSourceImage().width
      const rw   = Math.round(srcW * (ph / srcH))
      this._widowSprite = this.add.image(x, floorTopY, 'wb_fomo_widow')
        .setOrigin(0.5, 1).setDisplaySize(rw, ph).setDepth(6)
    } else {
      const g = this.add.graphics().setDepth(6)
      g.fillStyle(0x660033, 0.85)
      g.fillRect(x - 32, floorTopY - ph, 64, ph)
      this._widowSprite = g
    }
    this._widowLabel = this.add.text(x, floorTopY - ph - 6, 'FOMO WIDOW', {
      fontFamily: '"Cinzel", Georgia, serif', fontSize: '13px', color: '#ff88aa',
      stroke: '#200010', strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(7)
  }

  _buildVideoStations(W, H, worldW, floorTopY) {
    // Evenly space stations across the corridor
    const stationXs = VIDEO_STATIONS.map((_, i) => {
      const frac = 0.25 + i * STATION_SPACING_FRAC
      return Math.round(worldW * frac)
    })

    stationXs.forEach((sx, i) => {
      // Pedestal visual
      const g = this.add.graphics().setDepth(3)
      g.fillStyle(0x1a1020, 1)
      g.fillRect(sx - 5, floorTopY - 80, 10, 80)
      g.fillStyle(0x3a2060, 1)
      g.fillRoundedRect(sx - 34, floorTopY - 120, 68, 46, 5)
      g.lineStyle(2, 0x7755cc, 0.8)
      g.strokeRoundedRect(sx - 34, floorTopY - 120, 68, 46, 5)
      // Play icon
      g.fillStyle(0xcc88ff, 1)
      g.fillTriangle(sx - 12, floorTopY - 104, sx - 12, floorTopY - 82, sx + 16, floorTopY - 93)

      // Label
      this.add.text(sx, floorTopY - 130, VIDEO_STATIONS[i].label, {
        fontFamily: '"Cinzel", Georgia, serif', fontSize: '9px', color: '#9966cc',
        stroke: '#0a0810', strokeThickness: 2, wordWrap: { width: 160 },
      }).setOrigin(0.5, 1).setDepth(4)

      // [E] prompt
      this.add.text(sx, floorTopY - 144, '[E] ABSPIELEN', {
        fontFamily: '"Cinzel", Georgia, serif', fontSize: '10px', color: '#7755aa',
        stroke: '#08060e', strokeThickness: 2,
      }).setOrigin(0.5, 1).setDepth(4)

      // Proximity zone
      const zone = this.add.rectangle(sx, floorTopY - 60, 90, 120, 0, 0)
      this.physics.add.existing(zone, true)
      this.physics.add.overlap(this._player.sprite, zone, () => {
        this._nearStation = i
      }, undefined, this)

      // Build iframe (hidden)
      try {
        const iw = Math.round(W * 0.65)
        const ih = Math.round(iw * 9 / 16)
        const style = `width:${iw}px;height:${ih}px;border:none;background:#000;display:block;`
        const frame = this.add.dom(sx, H / 2 - 40, 'iframe', style)
        frame.node.setAttribute('allowfullscreen', '')
        frame.node.setAttribute('allow', 'autoplay; fullscreen')
        frame.node.src = ''
        frame.setVisible(false).setDepth(30)
        this._videoFrames.push({ frame, stationIdx: i, sx, sy: H / 2 - 40 })
      } catch {}
    })
  }

  _openVideo(idx) {
    if (this._activeFrame) this._closeActiveVideo()
    const entry = this._videoFrames[idx]
    if (!entry) return

    // Temporarily stop camera follow to keep video on screen
    this.cameras.main.stopFollow()

    entry.frame.node.src = VIDEO_STATIONS[idx].url
    entry.frame.setVisible(true)
    this._activeFrame = entry.frame

    // [F] fullscreen hint + [C] close hint (drawn in screen space)
    const W = this._W
    const H = this._H
    if (!this._videoHint) {
      this._videoHint = this.add.text(W / 2, H - 14, '[F] Vollbild    [C] Schließen', {
        fontFamily: '"Cinzel", Georgia, serif', fontSize: '11px', color: '#7744aa',
        stroke: '#08060e', strokeThickness: 2,
      }).setScrollFactor(0).setOrigin(0.5, 1).setDepth(31)
    }
    this._videoHint.setVisible(true)
  }

  _closeActiveVideo() {
    if (!this._activeFrame) return
    this._activeFrame.node.src = ''
    this._activeFrame.setVisible(false)
    this._activeFrame = null
    this._videoHint?.setVisible(false)
    // Resume camera follow
    if (this._player) this.cameras.main.startFollow(this._player.sprite, true, 0.1, 0.1)
  }

  _buildDialogHUD(W, H) {
    const boxH = 90
    const boxY = H - boxH / 2 - 4
    this._dialogBg = this.add.rectangle(W / 2, boxY, W - 12, boxH, 0x08040f)
      .setScrollFactor(0).setAlpha(0).setDepth(60).setStrokeStyle(2, 0xcc2244)
    this._dialogSpeaker = this.add.text(18, boxY - boxH / 2 + 8, '', {
      fontFamily: '"Cinzel", Georgia, serif', fontSize: '11px', color: '#ff88aa',
    }).setScrollFactor(0).setAlpha(0).setDepth(61)
    this._dialogText = this.add.text(18, boxY - boxH / 2 + 22, '', {
      fontFamily: '"Cinzel", Georgia, serif', fontSize: '14px', color: '#f0b0c0',
      wordWrap: { width: W - 36 },
    }).setScrollFactor(0).setAlpha(0).setDepth(61)
    this._dialogHint = this.add.text(W - 18, H - 10, '', {
      fontFamily: '"Cinzel", Georgia, serif', fontSize: '11px', color: '#aa5566',
    }).setScrollFactor(0).setOrigin(1, 1).setAlpha(0).setDepth(61)
  }

  _showDialog(lines, onComplete, speaker = 'Fomo Widow') {
    this._dialogLines = lines; this._dialogStep = 0; this._dialogCb = onComplete
    this._dialogVisible = true
    this._dialogBg.setAlpha(0.95)
    this._dialogSpeaker.setAlpha(1).setText(speaker)
    this._dialogText.setAlpha(1); this._dialogHint.setAlpha(0.85)
    this._updateDialogLine()
    this._player?.freeze()
    this._dialogKeyFn = (e) => {
      if (e.key !== 'e' && e.key !== 'E') return
      e.preventDefault(); e.stopImmediatePropagation()
      if (this._dialogStep < this._dialogLines.length - 1) {
        this._dialogStep++; this._updateDialogLine()
      } else { this._closeDialog() }
    }
    window.addEventListener('keydown', this._dialogKeyFn, true)
  }

  _updateDialogLine() {
    this._dialogText.setText(this._dialogLines[this._dialogStep])
    this._dialogHint.setText(`${this._dialogStep + 1}/${this._dialogLines.length}  [E]`)
  }

  _closeDialog() {
    this._dialogVisible = false
    this._dialogBg.setAlpha(0); this._dialogSpeaker.setAlpha(0)
    this._dialogText.setAlpha(0); this._dialogHint.setAlpha(0)
    if (this._dialogKeyFn) { window.removeEventListener('keydown', this._dialogKeyFn, true); this._dialogKeyFn = null }
    this._player?.unfreeze()
    if (this._dialogCb) { const cb = this._dialogCb; this._dialogCb = null; cb() }
  }

  _startIntroDialog() {
    this._showDialog([
      '...du bist hier.',
      'Ich hatte dich nicht erwartet. Oder doch?',
      'Ich bin die Fomo Widow. Diese Galerie gehört mir.',
      'Und ich habe eine Frage für dich:',
      'Warum bist du hier?',
      '[sie lächelt und verschwindet im Schatten]',
      'Du wirst es wissen, wenn du am Ende ankommst.',
    ], () => {
      // Widow fades and player can now explore
      const targets = [this._widowSprite, this._widowLabel].filter(Boolean)
      if (targets.length) this.tweens.add({ targets, alpha: 0, duration: 600 })
    })
  }

  _onEndReached(endX, floorTopY) {
    this._endReached = true
    // Respawn widow at the end
    const targets = [this._widowSprite, this._widowLabel]
    targets.forEach(t => { try { t?.destroy() } catch {} })
    this._widowSprite = null
    this._widowLabel = null
    this._buildWidow(endX - Math.round(this._W * 0.15), floorTopY, 'end')
    if (this._widowSprite) {
      this._widowSprite.setAlpha(0)
      this.tweens.add({ targets: this._widowSprite, alpha: 1, duration: 600 })
    }

    this.time.delayedCall(800, () => {
      this._showDialog([
        'Du bist bis hierher gekommen.',
        '[dreht sich zu dir]',
        'Also. Warum bist du wirklich hier?',
      ], () => {
        this._showFinalChoice()
      })
    })
  }

  _showFinalChoice() {
    // Only one answer — "Weils Spaß macht"
    const W = this._W
    const H = this._H

    const bg = this.add.rectangle(W / 2, H / 2, 400, 100, 0x08040f)
      .setScrollFactor(0).setDepth(65).setStrokeStyle(2, 0xcc2244)

    const btn = this.add.text(W / 2, H / 2, '"Weils Spaß macht."', {
      fontFamily: '"Cinzel", Georgia, serif', fontSize: '15px', color: '#ff88aa',
      backgroundColor: '#200020', padding: { x: 20, y: 10 },
    }).setScrollFactor(0).setOrigin(0.5).setDepth(66).setInteractive({ useHandCursor: true })

    btn.on('pointerdown', () => {
      try { bg.destroy(); btn.destroy() } catch {}
      this._startFarewellDialog()
    })
    // Also E to confirm
    const efn = (e) => {
      if (e.key !== 'e' && e.key !== 'E') return
      e.preventDefault()
      window.removeEventListener('keydown', efn, true)
      try { bg.destroy(); btn.destroy() } catch {}
      this._startFarewellDialog()
    }
    window.addEventListener('keydown', efn, true)
  }

  _startFarewellDialog() {
    this._showDialog([
      '"Fufufu... was für eine offensichtliche Antwort."',
      '"Und doch — die richtige."',
      '"Vielleicht sehen wir uns wieder, Krieger."',
      '[sie lächelt, dreht sich um und verschwindet]',
    ], () => {
      const targets = [this._widowSprite, this._widowLabel].filter(Boolean)
      if (targets.length) this.tweens.add({ targets, alpha: 0, duration: 700 })
      this._transitioning = true
      this.cameras.main.fadeOut(800, 0, 0, 0)
      this.time.delayedCall(900, () => this.scene.start('CreditsScene'))
    })
  }

  update() {
    if (!this._player || this._transitioning) return

    this._nearStation = null

    if (this._dialogVisible) { this._player.freeze(); return }
    try { this._player.update() } catch {}
  }

  shutdown() {
    if (this._player) this._player.destroy()
    this._player = null
    if (this._dialogKeyFn) window.removeEventListener('keydown', this._dialogKeyFn, true)
    if (this._fKeyFn) window.removeEventListener('keydown', this._fKeyFn)
    if (this._cKeyFn) window.removeEventListener('keydown', this._cKeyFn)
    if (this._eKeyFn) window.removeEventListener('keydown', this._eKeyFn)
    this._videoFrames.forEach(v => { try { v.frame.node.src = ''; v.frame.destroy() } catch {} })
    this._videoFrames = []
  }
}
