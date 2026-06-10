/**
 * FomoWidowScene — Scene 6: Die Galerie
 *
 * Long horizontal corridor with 11 video "paintings" organized in 5 themed sections.
 * [E] opens video, [F] toggles fullscreen, [C] closes.
 * Background tiles horizontally. Fomo Widow appears only at the very end.
 *
 * Video URLs: replace null with actual YouTube embed URL when available.
 */

import Phaser from 'phaser'
import PlayerController, { FLOOR_H, SPAWN_Y_OFFSET } from '../PlayerController.js'
import GameState from '../GameState.js'

// ── Themed sections + videos ───────────────────────────────────────────────────
const SECTIONS = [
  {
    heading: 'Worldbuilding & Motivation',
    videos: [
      { title: 'Dark Souls',       subtitle: 'Signposting & Player Guidance', url: null },
    ],
  },
  {
    heading: 'Signposting & Player Guidance',
    videos: [
      { title: 'Cuphead',          subtitle: 'Journalist vs. Taube',           url: null },
      { title: 'Uncharted 4',      subtitle: 'Highlighting & Kameraführung',   url: null },
      { title: "Uncharted 4 —\nA Thief's End", subtitle: 'Kamerafokus',        url: null },
    ],
  },
  {
    heading: 'Spielmechaniken',
    videos: [
      { title: 'Elden Ring',       subtitle: 'Sites of Grace',                 url: null },
      { title: 'La-Mulana',        subtitle: 'Sprungverhalten',                url: null },
      { title: 'Getting Over It',  subtitle: 'Player Choice',                  url: null },
    ],
  },
  {
    heading: 'Player Choice',
    videos: [
      { title: 'Spec Ops: The Line', subtitle: 'Moralische Entscheidungen',     url: null },
    ],
  },
  {
    heading: 'Diegetisches Game Design',
    videos: [
      { title: 'Dead Space &\nDemon\'s Souls', subtitle: 'Sound Design',        url: null },
      { title: 'Shadow of the\nColossus',      subtitle: 'Drachen-Kletterszene',url: null },
      { title: 'Silent Hill',      subtitle: 'Nebel als technische Lösung',     url: null },
    ],
  },
]

// Flatten videos with section info
const ALL_VIDEOS = []
SECTIONS.forEach(sec => sec.videos.forEach(v => ALL_VIDEOS.push({ ...v, section: sec.heading })))

// Layout constants
const FRAME_W         = 220
const FRAME_H         = 140
const SECTION_MARGIN  = 80    // space before each section heading
const VIDEO_SPACING   = 260   // horizontal space per video frame
const LEFT_MARGIN     = 200   // before first video
const BG_REPEAT_W     = 1280  // width of one bg tile repeat

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
    this._activeFrame     = null
    this._videoFrames     = []
    this._W = this._H = this._worldW = 0
    this._widowSprite     = null
    this._widowLabel      = null
    this._fKeyFn          = null
    this._cKeyFn          = null
    this._eKeyFn          = null
    this._videoHint       = null
    this._stationZones    = []   // { x, idx } proximity zones
  }

  init() { this._reset() }

  preload() {
    const load = (key, path) => { if (!this.textures.exists(key)) this.load.image(key, path) }
    load('fw_bg',        '/assets/scenes/fw/bg.jpg')
    load('wb_fomo_widow','/assets/scenes/wb/fomo_widow.png')
  }

  create() {
    const W = this.scale.width
    const H = this.scale.height
    this._W = W
    this._H = H

    // ── Compute world width ───────────────────────────────────────────────────
    // Build station positions first
    const stationXs = this._computeStationXs()
    const totalContentW = stationXs[stationXs.length - 1] + VIDEO_SPACING + 200
    const worldW = Math.max(totalContentW, W * 4)
    this._worldW = worldW

    this.cameras.main.setBounds(0, 0, worldW, H)
    this.physics.world.setBounds(0, 0, worldW, H + 200)

    // ── Background (tiled horizontally) ───────────────────────────────────────
    if (this.textures.exists('fw_bg')) {
      this.add.tileSprite(worldW / 2, H / 2, worldW, H, 'fw_bg').setDepth(-10)
    } else {
      const g = this.add.graphics().setDepth(-10)
      g.fillStyle(0x060410, 1); g.fillRect(0, 0, worldW, H)
    }

    // ── Floor ─────────────────────────────────────────────────────────────────
    const floorTopY = H - FLOOR_H
    const floorRect = this.add.rectangle(worldW / 2, H - FLOOR_H / 2, worldW, FLOOR_H, 0, 0)
    this.physics.add.existing(floorRect, true)

    // Right wall
    const wallR = this.add.rectangle(worldW + 20, H / 2, 40, H + 200, 0, 0)
    this.physics.add.existing(wallR, true)

    // ── Player ────────────────────────────────────────────────────────────────
    this._player = new PlayerController(this, Math.round(W * 0.08), floorTopY - SPAWN_Y_OFFSET)
    this.physics.add.collider(this._player.sprite, floorRect)
    this.physics.add.collider(this._player.sprite, wallR)

    // ── Section headings + video stations ─────────────────────────────────────
    this._buildGallery(stationXs, H, floorTopY)

    // ── Fomo Widow at the very end ─────────────────────────────────────────────
    const widowX = worldW - Math.round(W * 0.18)
    this._buildWidow(widowX, floorTopY)

    // ── End zone ─────────────────────────────────────────────────────────────
    const endZone = this.add.rectangle(worldW - Math.round(W * 0.12), H / 2, W * 0.15, H + 200, 0, 0)
    this.physics.add.existing(endZone, true)
    this.physics.add.overlap(this._player.sprite, endZone, () => {
      if (!this._endReached && !this._transitioning) this._onEndReached(widowX, floorTopY)
    }, undefined, this)

    // ── Dialog HUD ────────────────────────────────────────────────────────────
    this._buildDialogHUD(W, H)

    // ── Camera ───────────────────────────────────────────────────────────────
    this.cameras.main.fadeIn(700, 0, 0, 0)
    this.cameras.main.startFollow(this._player.sprite, true, 0.1, 0.1)
    this.cameras.main.setFollowOffset(-W * 0.2, 0)

    // ── Keys ─────────────────────────────────────────────────────────────────
    this.input.keyboard.enableGlobalCapture()

    this._fKeyFn = (e) => {
      if ((e.key === 'f' || e.key === 'F') && this._activeFrame) {
        const doc = document
        if (doc.fullscreenElement) { doc.exitFullscreen?.().catch(() => {}) }
        else { this._activeFrame.node.requestFullscreen?.().catch(() => {}) }
      }
    }
    window.addEventListener('keydown', this._fKeyFn)

    this._cKeyFn = (e) => {
      if ((e.key === 'c' || e.key === 'C') && this._activeFrame) this._closeActiveVideo()
    }
    window.addEventListener('keydown', this._cKeyFn)

    this._eKeyFn = (e) => {
      if (e.key !== 'e' && e.key !== 'E') return
      if (this._activeFrame || this._dialogVisible) return
      // Find nearest station
      const near = this._nearestStation()
      if (near >= 0) this._openVideo(near)
    }
    window.addEventListener('keydown', this._eKeyFn)

    // Intro dialog
    this.time.delayedCall(900, () => this._startIntroDialog())
  }

  // ── Compute X positions for each video station ─────────────────────────────
  _computeStationXs() {
    const xs = []
    let x = LEFT_MARGIN
    SECTIONS.forEach(sec => {
      x += SECTION_MARGIN
      sec.videos.forEach(() => {
        xs.push(x)
        x += VIDEO_SPACING
      })
    })
    return xs
  }

  // ── Build gallery paintings ────────────────────────────────────────────────
  _buildGallery(stationXs, H, floorTopY) {
    const frameY = floorTopY - FRAME_H / 2 - 60   // paintings hang above floor
    let vidIdx = 0
    let sectionX = LEFT_MARGIN

    SECTIONS.forEach((sec, si) => {
      sectionX += SECTION_MARGIN

      // Section heading
      const secCenterX = sectionX + ((sec.videos.length - 1) * VIDEO_SPACING) / 2
      this.add.text(secCenterX, frameY - FRAME_H / 2 - 48, sec.heading, {
        fontFamily: '"Cinzel", Georgia, serif',
        fontSize: '20px', color: '#9966cc', stroke: '#0a0810', strokeThickness: 3,
        align: 'center',
      }).setOrigin(0.5, 1).setDepth(4)

      // Divider line under section heading
      const lineG = this.add.graphics().setDepth(3)
      lineG.lineStyle(1, 0x4a2880, 0.5)
      lineG.lineBetween(sectionX - 40, frameY - FRAME_H / 2 - 50, secCenterX * 2 - sectionX + sec.videos.length * VIDEO_SPACING - 200, frameY - FRAME_H / 2 - 50)

      sec.videos.forEach((vid, vi) => {
        const sx = stationXs[vidIdx]
        this._buildPainting(sx, frameY, vid, vidIdx)

        // Proximity zone for E interaction
        const zone = this.add.rectangle(sx, floorTopY - 60, FRAME_W + 40, 180, 0, 0)
        this.physics.add.existing(zone, true)
        this._stationZones.push({ x: sx, idx: vidIdx, zone })

        vidIdx++
        sectionX += VIDEO_SPACING
      })
    })
  }

  _buildPainting(sx, frameY, vid, idx) {
    // Outer ornate frame
    const g = this.add.graphics().setDepth(3)
    // Shadow
    g.fillStyle(0x000000, 0.4)
    g.fillRect(sx - FRAME_W / 2 + 4, frameY - FRAME_H / 2 + 4, FRAME_W, FRAME_H)
    // Frame border
    g.fillStyle(0x3a2010, 1)
    g.fillRect(sx - FRAME_W / 2 - 8, frameY - FRAME_H / 2 - 8, FRAME_W + 16, FRAME_H + 16)
    g.fillStyle(0x6a4020, 1)
    g.fillRoundedRect(sx - FRAME_W / 2 - 6, frameY - FRAME_H / 2 - 6, FRAME_W + 12, FRAME_H + 12, 3)
    // Inner dark area (canvas / play button)
    g.fillStyle(0x0a0810, 1)
    g.fillRect(sx - FRAME_W / 2, frameY - FRAME_H / 2, FRAME_W, FRAME_H)
    // Play icon
    g.fillStyle(0x5533aa, 0.7)
    g.fillTriangle(sx - 20, frameY - 20, sx - 20, frameY + 20, sx + 24, frameY)
    g.lineStyle(2, 0x8855cc, 0.8)
    g.strokeTriangle(sx - 20, frameY - 20, sx - 20, frameY + 20, sx + 24, frameY)
    // Hanging wire
    g.lineStyle(1, 0x5a3a10, 0.6)
    g.lineBetween(sx - 30, frameY - FRAME_H / 2 - 6, sx - 30, frameY - FRAME_H / 2 - 32)
    g.lineBetween(sx + 30, frameY - FRAME_H / 2 - 6, sx + 30, frameY - FRAME_H / 2 - 32)

    // Title (game name)
    const lineCount = vid.title.split('\n').length
    this.add.text(sx, frameY + FRAME_H / 2 + 12, vid.title, {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize: '16px', color: '#c8b89a', stroke: '#0a0810', strokeThickness: 2,
      align: 'center',
    }).setOrigin(0.5, 0).setDepth(4)

    // [E] prompt
    this.add.text(sx, frameY - FRAME_H / 2 - 14, '[E]', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize: '16px', color: '#7755aa', stroke: '#08060e', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(4)

    // Build hidden iframe for this station
    try {
      const iw = Math.round(this._W * 0.68)
      const ih = Math.round(iw * 9 / 16)
      const style = `width:${iw}px;height:${ih}px;border:none;background:#000;display:block;`
      const frame = this.add.dom(this._W / 2, this._H / 2 - 40, 'iframe', style)
      frame.node.setAttribute('allowfullscreen', '')
      frame.node.setAttribute('allow', 'autoplay; fullscreen')
      frame.node.src = ''
      frame.setScrollFactor(0).setVisible(false).setDepth(50)
      this._videoFrames.push({ frame, idx, url: vid.url })
    } catch {}
  }

  _nearestStation() {
    if (!this._player) return -1
    const px = this._player.sprite.x
    const py = this._player.sprite.y
    let best = -1, bestDist = 120
    this._stationZones.forEach(({ x, idx }) => {
      const dx = Math.abs(px - x)
      if (dx < bestDist) { bestDist = dx; best = idx }
    })
    return best
  }

  _openVideo(idx) {
    if (this._activeFrame) this._closeActiveVideo()
    const entry = this._videoFrames[idx]
    if (!entry) return

    this.cameras.main.stopFollow()

    const url = entry.url || `https://www.youtube.com/results?search_query=${encodeURIComponent(ALL_VIDEOS[idx]?.title || 'game design')}`
    entry.frame.node.src = entry.url || ''
    entry.frame.setVisible(true)
    this._activeFrame = entry.frame

    if (!this._videoHint) {
      this._videoHint = this.add.text(this._W / 2, this._H - 14, '[F] Vollbild Ein/Aus    [C] Schließen', {
        fontFamily: '"Cinzel", Georgia, serif', fontSize: '18px', color: '#7744aa',
        stroke: '#08060e', strokeThickness: 2,
      }).setScrollFactor(0).setOrigin(0.5, 1).setDepth(51)
    }
    this._videoHint.setVisible(true)

    // If no URL configured, show placeholder
    if (!entry.url) {
      if (!this._urlPlaceholder) {
        this._urlPlaceholder = this.add.text(this._W / 2, this._H / 2 - 40, '', {
          fontFamily: '"Cinzel", Georgia, serif', fontSize: '20px', color: '#7755aa',
          stroke: '#0a0810', strokeThickness: 3, align: 'center',
        }).setScrollFactor(0).setOrigin(0.5).setDepth(52)
      }
      const vid = ALL_VIDEOS[idx]
      this._urlPlaceholder
        .setText(`▶  ${vid?.title || '?'}\n\n[URL not configured — edit VIDEO_STATIONS in FomoWidowScene.js]`)
        .setVisible(true)
    }
  }

  _closeActiveVideo() {
    if (!this._activeFrame) return
    this._activeFrame.node.src = ''
    this._activeFrame.setVisible(false)
    this._activeFrame = null
    this._videoHint?.setVisible(false)
    this._urlPlaceholder?.setVisible(false)
    if (this._player) this.cameras.main.startFollow(this._player.sprite, true, 0.1, 0.1)
  }

  // ── Fomo Widow ─────────────────────────────────────────────────────────────
  _buildWidow(x, floorTopY) {
    const ph = 280
    if (this.textures.exists('wb_fomo_widow')) {
      const tex = this.textures.get('wb_fomo_widow')
      const rw  = Math.round(tex.getSourceImage().width * (ph / tex.getSourceImage().height))
      this._widowSprite = this.add.image(x, floorTopY, 'wb_fomo_widow')
        .setOrigin(0.5, 1).setDisplaySize(rw, ph).setDepth(6)
      try { this.textures.get('wb_fomo_widow').setFilter(Phaser.Textures.FilterMode.LINEAR) } catch {}
    } else {
      const g = this.add.graphics().setDepth(6)
      g.fillStyle(0x660033, 0.85)
      g.fillRect(x - 40, floorTopY - ph, 80, ph)
      this._widowSprite = g
    }
    this._widowLabel = this.add.text(x, floorTopY - ph - 6, 'FOMO WIDOW', {
      fontFamily: '"Cinzel", Georgia, serif', fontSize: '20px', color: '#ff88aa',
      stroke: '#200010', strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(7)
    // Start hidden — will appear when player reaches end
    this._widowSprite.setAlpha(0)
    this._widowLabel.setAlpha(0)
  }

  // ── Dialog HUD ─────────────────────────────────────────────────────────────
  _buildDialogHUD(W, H) {
    const boxH = 130
    const boxY = H - boxH / 2 - 4
    this._dialogBg = this.add.rectangle(W / 2, boxY, W - 12, boxH, 0x08040f)
      .setScrollFactor(0).setAlpha(0).setDepth(60).setStrokeStyle(2, 0xcc2244)
    this._dialogSpeaker = this.add.text(18, boxY - boxH / 2 + 10, '', {
      fontFamily: '"Cinzel", Georgia, serif', fontSize: '18px', color: '#ff88aa',
    }).setScrollFactor(0).setAlpha(0).setDepth(61)
    this._dialogText = this.add.text(18, boxY - boxH / 2 + 40, '', {
      fontFamily: '"Cinzel", Georgia, serif', fontSize: '22px', color: '#f0b0c0',
      wordWrap: { width: W - 36 },
    }).setScrollFactor(0).setAlpha(0).setDepth(61)
    this._dialogHint = this.add.text(W - 18, H - 10, '', {
      fontFamily: '"Cinzel", Georgia, serif', fontSize: '18px', color: '#aa5566',
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
      'Diese Galerie gehört mir. Jedes Bild ist eine Lektion.',
      'Und ich habe eine Frage für dich — aber nicht jetzt.',
      'Schau dich um. Wenn du am Ende ankommst... dann.',
    ], () => {
      const targets = [this._widowSprite, this._widowLabel].filter(Boolean)
      if (targets.length) this.tweens.add({ targets, alpha: 0, duration: 600 })
    })
  }

  _onEndReached(endX, floorTopY) {
    this._endReached = true

    // Reveal widow
    const targets = [this._widowSprite, this._widowLabel].filter(Boolean)
    if (targets.length) this.tweens.add({ targets, alpha: 1, duration: 600 })

    this.time.delayedCall(800, () => {
      this._showDialog([
        '[dreht sich zu dir]',
        'Du bist bis hierher gekommen.',
        'Also. Warum bist du wirklich hier?',
      ], () => this._showFinalChoice())
    })
  }

  _showFinalChoice() {
    const W = this._W
    const H = this._H

    const bg = this.add.rectangle(W / 2, H / 2, 500, 120, 0x08040f)
      .setScrollFactor(0).setDepth(65).setStrokeStyle(2, 0xcc2244)

    const btn = this.add.text(W / 2, H / 2, '"Weils Spaß macht."', {
      fontFamily: '"Cinzel", Georgia, serif', fontSize: '24px', color: '#ff88aa',
      backgroundColor: '#200020', padding: { x: 22, y: 12 },
    }).setScrollFactor(0).setOrigin(0.5).setDepth(66).setInteractive({ useHandCursor: true })

    const dismiss = () => {
      try { bg.destroy(); btn.destroy() } catch {}
      if (efn) { window.removeEventListener('keydown', efn, true); efn = null }
      this._startFarewellDialog()
    }
    btn.on('pointerdown', dismiss)

    let efn = null
    efn = (e) => { if (e.key === 'e' || e.key === 'E') { e.preventDefault(); dismiss() } }
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
    if (this._activeFrame) { try { this._activeFrame.node.src = ''; this._activeFrame.destroy() } catch {} }
    this._videoFrames.forEach(v => { try { v.frame.node.src = ''; v.frame.destroy() } catch {} })
    this._videoFrames = []
  }
}
