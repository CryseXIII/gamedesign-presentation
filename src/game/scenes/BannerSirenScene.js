/**
 * BannerSirenScene — Scene 3: Der Fall
 *
 * Beat:
 *   1. Player spawns in the top room. A dark cover-rectangle hides the shaft hole.
 *      Banner Siren is on the right, already waiting.
 *   2. Siren dialog → screenshake → cover removed → player falls.
 *   3. Camera scrolls down. The middle background tiles vertically for illusion of continuous fall.
 *   4. Dodge upward-moving spikes. Hit → teleport to top of camera, fall again.
 *   5. After 20 s without falling on a spike the player lands in bottom room.
 *   6. Siren gloats briefly → transition to WhaleQueenScene.
 *
 * World layout (y = 0 at top):
 *   [0, H]              Top room  (bs_bg_top)
 *   [H, SHAFT_DEPTH+H]  Shaft     (bs_bg_mid tiled)
 *   [SHAFT_DEPTH, SHAFT_DEPTH+2H]  Bottom room (bs_bg_bot)
 */

import Phaser from 'phaser'
import PlayerController, { FLOOR_H, SPAWN_Y_OFFSET } from '../PlayerController.js'
import GameState from '../GameState.js'

// ── Constants ──────────────────────────────────────────────────────────────────
const SHAFT_DEPTH    = 4800          // vertical fall distance (px)
const FALL_GRAVITY   = 550
const TERMINAL_VEL   = 260
const SPIKE_SPEED    = 180
const SPIKE_W        = 28
const SPIKE_H        = 44
const SPIKE_INTERVAL = 2000
const MAX_SPIKES_ON  = 3
const FALL_TIME_MAX  = 20000         // 20 s

// ── Scene ──────────────────────────────────────────────────────────────────────
export default class BannerSirenScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BannerSirenScene' })
    this._reset()
  }

  _reset() {
    this._player          = null
    this._transitioning   = false
    this._phase           = 'intro'
    this._W               = 0
    this._H               = 0
    this._fallStartTime   = 0
    this._floorTiles      = []
    this._holeCover       = null
    this._sirenSprite     = null
    this._sirenLabel      = null
    this._midBg           = null
    this._spikes          = []
    this._spikeTimer      = null
    this._hitCooldown     = false
    this._fallTimerEvt    = null
    this._dialogVisible   = false
    this._dialogLines     = []
    this._dialogStep      = 0
    this._dialogCb        = null
    this._dialogKeyFn     = null
    this._dialogBg        = null
    this._dialogText      = null
    this._dialogHint      = null
    this._dialogSpeaker   = null
  }

  init() {
    this._reset()
  }

  // ── preload ─────────────────────────────────────────────────────────────────
  preload() {
    const load = (key, path) => { if (!this.textures.exists(key)) this.load.image(key, path) }
    load('bs_bg_top',      '/assets/scenes/bs/bg_top.jpg')
    load('bs_bg_mid',      '/assets/scenes/bs/bg_mid.jpg')
    load('bs_bg_bot',      '/assets/scenes/bs/bg_bot.jpg')
    load('bs_banner_siren','/assets/scenes/bs/banner_siren.png')
  }

  // ── create ──────────────────────────────────────────────────────────────────
  create() {
    const W = this.scale.width
    const H = this.scale.height
    this._W = W
    this._H = H

    const worldH = SHAFT_DEPTH + H * 3
    this.cameras.main.setBounds(0, 0, W, worldH)
    this.physics.world.setBounds(0, 0, W, worldH)

    // ── Backgrounds ─────────────────────────────────────────────────────────
    // Top room
    if (this.textures.exists('bs_bg_top')) {
      this.add.image(W / 2, H / 2, 'bs_bg_top')
        .setDisplaySize(W, H).setDepth(-10)
    } else {
      const g = this.add.graphics().setDepth(-10)
      g.fillStyle(0x0a0616, 1)
      g.fillRect(0, 0, W, H)
    }

    // Shaft middle — tiled sprite
    if (this.textures.exists('bs_bg_mid')) {
      this._midBg = this.add.tileSprite(W / 2, H + SHAFT_DEPTH / 2, W, SHAFT_DEPTH, 'bs_bg_mid')
        .setDepth(-10)
    } else {
      const g = this.add.graphics().setDepth(-10)
      g.fillStyle(0x060410, 1)
      g.fillRect(0, H, W, SHAFT_DEPTH)
    }

    // Bottom room
    const botY = H + SHAFT_DEPTH
    if (this.textures.exists('bs_bg_bot')) {
      this.add.image(W / 2, botY + H / 2, 'bs_bg_bot')
        .setDisplaySize(W, H).setDepth(-10)
    } else {
      const g = this.add.graphics().setDepth(-10)
      g.fillStyle(0x060408, 1)
      g.fillRect(0, botY, W, H * 2)
    }

    // ── Shaft wall vignettes ─────────────────────────────────────────────────
    const vg = this.add.graphics().setDepth(-5)
    const totalH = worldH
    for (let i = 0; i < 4; i++) {
      const alpha = 0.18 - i * 0.035
      vg.fillStyle(0x000000, alpha)
      vg.fillRect(0,     0, 18 - i * 3, totalH)
      vg.fillRect(W - 18 + i * 3, 0, 18 - i * 3, totalH)
    }

    // ── Hole cover: full black overlay hiding the shaft ──────────────────────
    this._holeCover = this.add.graphics().setDepth(15)
    this._holeCover.fillStyle(0x000000, 1)
    this._holeCover.fillRect(0, H - FLOOR_H, W, SHAFT_DEPTH + H * 2)

    // ── Top floor — measured floor at 74.8% of H in bs_bg_top ───────────────
    const floorTopY = Math.round(H * 0.748)
    this._buildBreakableFloor(W, floorTopY)

    // ── Bottom landing floor — measured floor at 80.8% of H in bs_bg_bot ────
    const botFloorTopY = botY + Math.round(H * 0.808)
    const bFloor = this.add.rectangle(W / 2, botFloorTopY + FLOOR_H / 2, W, FLOOR_H, 0x000000, 0)
    this.physics.add.existing(bFloor, true)
    this._botFloorTopY = botFloorTopY

    // ── Shaft walls ──────────────────────────────────────────────────────────
    const wallH = worldH + 200
    const wallL = this.add.rectangle(-20, wallH / 2, 40, wallH, 0, 0)
    const wallR = this.add.rectangle(W + 20, wallH / 2, 40, wallH, 0, 0)
    this.physics.add.existing(wallL, true)
    this.physics.add.existing(wallR, true)

    // ── Player — spawn at siren level (top of scene) ────────────────────────
    const spawnX = Math.round(W * 0.15)
    const spawnY = floorTopY - SPAWN_Y_OFFSET
    this._player = new PlayerController(this, spawnX, spawnY)
    this._player.sprite.setCollideWorldBounds(false)
    this.physics.add.collider(this._player.sprite, wallL)
    this.physics.add.collider(this._player.sprite, wallR)

    // Colliders with breakable floor tiles
    this._floorTiles.forEach(tile => {
      const c = this.physics.add.collider(this._player.sprite, tile)
      tile._collider = c
    })

    // Collider with bottom floor
    this.physics.add.collider(this._player.sprite, bFloor)

    // ── Banner Siren ─────────────────────────────────────────────────────────
    this._buildSiren(W, H, floorTopY)

    // ── Dialog HUD ───────────────────────────────────────────────────────────
    this._buildDialogHUD(W, H)

    // ── Camera ───────────────────────────────────────────────────────────────
    this.cameras.main.fadeIn(600, 0, 0, 0)
    this.cameras.main.startFollow(this._player.sprite, true, 0.08, 0.06)
    // Offset so player appears in lower-center, showing more of the room above
    this.cameras.main.setFollowOffset(0, 160)

    // ── Input ────────────────────────────────────────────────────────────────
    this.input.keyboard.enableGlobalCapture()

    // Kick off intro
    this.time.delayedCall(700, () => this._startIntroDialog())
  }

  // ── Breakable floor ────────────────────────────────────────────────────────
  _buildBreakableFloor(W, floorTopY) {
    const tileW = Math.round(W / 8)
    const tileH = FLOOR_H
    for (let i = 0; i < 8; i++) {
      const cx = i * tileW + tileW / 2
      const cy = floorTopY + tileH / 2
      const slab = this.add.rectangle(cx, cy, tileW - 2, tileH, 0x000000, 0)
      this.physics.add.existing(slab, true)
      slab._idx = i
      this._floorTiles.push(slab)
    }
  }

  // ── Banner Siren sprite ────────────────────────────────────────────────────
  _buildSiren(W, H, floorTopY) {
    const x  = Math.round(W * 0.74)
    const y  = floorTopY
    const ph = 280

    if (this.textures.exists('bs_banner_siren')) {
      const tex  = this.textures.get('bs_banner_siren')
      const srcH = tex.getSourceImage().height
      const srcW = tex.getSourceImage().width
      const rw   = Math.round(srcW * (ph / srcH))
      this._sirenSprite = this.add.image(x, y, 'bs_banner_siren')
        .setOrigin(0.5, 1).setDisplaySize(rw, ph).setDepth(6)
      try { this.textures.get('bs_banner_siren').setFilter(Phaser.Textures.FilterMode.LINEAR) } catch {}
    } else {
      const g = this.add.graphics().setDepth(6)
      g.fillStyle(0x9944cc, 0.85)
      g.fillRect(x - 32, y - ph, 64, ph)
      this._sirenSprite = g
    }

    this._sirenLabel = this.add.text(x, floorTopY - ph - 6, 'BANNER SIREN', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize:   '20px',
      color:      '#cc88ff',
      stroke:     '#200030',
      strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(7)
  }

  // ── Dialog HUD ─────────────────────────────────────────────────────────────
  _buildDialogHUD(W, H) {
    const boxH = 130
    const boxY = H - boxH / 2 - 4
    this._dialogBg = this.add.rectangle(W / 2, boxY, W - 12, boxH, 0x08040f)
      .setScrollFactor(0).setAlpha(0).setDepth(60).setStrokeStyle(2, 0x8833cc)
    this._dialogSpeaker = this.add.text(18, boxY - boxH / 2 + 10, '', {
      fontFamily: '"Cinzel", Georgia, serif', fontSize: '26px', color: '#cc88ff',
    }).setScrollFactor(0).setAlpha(0).setDepth(61)
    this._dialogText = this.add.text(18, boxY - boxH / 2 + 40, '', {
      fontFamily: '"Cinzel", Georgia, serif', fontSize: '22px', color: '#e0c0ff',
      wordWrap: { width: W - 36 },
    }).setScrollFactor(0).setAlpha(0).setDepth(61)
    this._dialogHint = this.add.text(W - 18, H - 10, '', {
      fontFamily: '"Cinzel", Georgia, serif', fontSize: '26px', color: '#7744aa',
    }).setScrollFactor(0).setOrigin(1, 1).setAlpha(0).setDepth(61)
  }

  _showDialog(lines, onComplete, speaker = 'Banner Siren') {
    this._dialogLines   = lines
    this._dialogStep    = 0
    this._dialogCb      = onComplete
    this._dialogVisible = true
    this._dialogBg.setAlpha(0.95)
    this._dialogSpeaker.setAlpha(1).setText(speaker)
    this._dialogText.setAlpha(1)
    this._dialogHint.setAlpha(0.85)
    this._updateDialogLine()
    this._player?.freeze()

    this._dialogKeyFn = (e) => {
      if (e.key !== 'e' && e.key !== 'E') return
      e.preventDefault()
      e.stopImmediatePropagation()
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
    this._dialogHint.setText(`${this._dialogStep + 1}/${this._dialogLines.length}  [E]`)
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

  // ── Intro dialog ────────────────────────────────────────────────────────────
  _startIntroDialog() {
    this._showDialog([
      'Oh... du bist durchgekommen. Wie unerwünscht.',
      'Kein Problem. Ich habe hier besondere Rabatte für dich.',
      'Nur noch kurz — der Boden unter dir?',
      '...ist im Angebot.',
      '[grinst]',
    ], () => {
      this._startFloorCollapse()
    })
  }

  // ── Floor collapse ──────────────────────────────────────────────────────────
  _startFloorCollapse() {
    this.cameras.main.shake(900, 0.014)

    // Siren fades out
    this.time.delayedCall(600, () => {
      const targets = [this._sirenSprite, this._sirenLabel].filter(Boolean)
      if (targets.length) this.tweens.add({ targets, alpha: 0, duration: 400 })
    })

    // Floor tiles collapse after shake
    this.time.delayedCall(900, () => {
      // Remove hole cover first
      this._holeCover?.destroy()
      this._holeCover = null

      this._floorTiles.forEach((tile, i) => {
        const delay = 60 + i * 60 + Phaser.Math.Between(0, 80)
        this.time.delayedCall(delay, () => {
          if (tile._collider) {
            this.physics.world.removeCollider(tile._collider)
            tile._collider = null
          }
          tile.body?.setAllowGravity?.(true)
          tile.body?.setImmovable?.(false)
        })
      })

      this.time.delayedCall(1000, () => this._startFallPhase())
    })
  }

  // ── Fall phase ──────────────────────────────────────────────────────────────
  _startFallPhase() {
    this._phase = 'fall'
    this._fallStartTime = this.time.now

    // Black flash transition: hole cover disappears after a brief blackout
    this.cameras.main.flash(400, 0, 0, 0, true)
    this.time.delayedCall(400, () => {
      // Remove hole cover to reveal the shaft
      this._holeCover?.destroy()
      this._holeCover = null
    })

    this.physics.world.gravity.y = FALL_GRAVITY
    this._player.sprite.body.setMaxVelocityY(TERMINAL_VEL)
    this._player.unfreeze()

    // Camera follows player down, offset keeps player in upper third
    this.cameras.main.setFollowOffset(0, -80)

    this._spikeTimer = this.time.addEvent({
      delay: SPIKE_INTERVAL,
      loop:  true,
      callback: this._spawnSpikeWave,
      callbackScope: this,
    })

    this._fallTimerEvt = this.time.delayedCall(FALL_TIME_MAX + 3000, () => {
      this._onReachBottom()
    })
  }

  // ── Spike wave ──────────────────────────────────────────────────────────────
  _spawnSpikeWave() {
    if (this._phase !== 'fall') return

    // Cull off-screen spikes
    this._spikes = this._spikes.filter(s => {
      if (!s.obj?.active || s.obj.y < this.cameras.main.scrollY - 200) {
        try { if (s.ov) this.physics.world.removeCollider(s.ov) } catch {}
        try { s.obj?.destroy() } catch {}
        try { s.gfx?.destroy() } catch {}
        return false
      }
      return true
    })

    if (this._spikes.length >= MAX_SPIKES_ON) return

    const slots = MAX_SPIKES_ON - this._spikes.length
    const count = Phaser.Math.Between(1, Math.min(3, slots + 1))
    const zones = this._pickSpikeZones(count)
    const spawnY = this.cameras.main.scrollY + this._H + 160

    zones.forEach(zoneX => {
      const gfx = this.add.graphics().setDepth(10)
      gfx.fillStyle(0xcc2244, 1)
      gfx.fillTriangle(SPIKE_W / 2, 0, 0, SPIKE_H, SPIKE_W, SPIKE_H)
      gfx.lineStyle(2, 0xff4466, 0.7)
      gfx.strokeTriangle(SPIKE_W / 2, 0, 0, SPIKE_H, SPIKE_W, SPIKE_H)
      gfx.x = zoneX - SPIKE_W / 2
      gfx.y = spawnY

      const obj = this.add.rectangle(zoneX, spawnY + SPIKE_H / 2, SPIKE_W, SPIKE_H, 0xff0000, 0)
      this.physics.add.existing(obj, false)
      obj.body.setAllowGravity(false)
      obj.body.setVelocityY(-SPIKE_SPEED)
      obj.body.setImmovable(true)
      obj.body.setSize(SPIKE_W - 8, SPIKE_H - 10)
      obj.body.setOffset(4, 8)

      const spike = { obj, gfx, ov: null }
      spike.ov = this.physics.add.overlap(this._player.sprite, obj, () => {
        this._onSpikeHit(spike)
      }, undefined, this)

      this._spikes.push(spike)
    })
  }

  _pickSpikeZones(count) {
    const margin = SPIKE_W * 3
    const usable = this._W - margin * 2
    const positions = []
    for (let i = 0; i < count; i++) {
      let attempts = 0, x
      do {
        x = margin + Phaser.Math.Between(0, usable)
        attempts++
      } while (attempts < 20 && positions.some(px => Math.abs(px - x) < SPIKE_W * 5))
      positions.push(x)
    }
    return positions
  }

  // ── Spike hit ───────────────────────────────────────────────────────────────
  _onSpikeHit(spike) {
    if (this._hitCooldown || this._phase !== 'fall') return
    this._hitCooldown = true

    this.cameras.main.flash(280, 255, 0, 0, false)
    this.cameras.main.shake(200, 0.008)

    try { if (spike.ov) this.physics.world.removeCollider(spike.ov) } catch {}
    try { spike.obj?.destroy() } catch {}
    try { spike.gfx?.destroy() } catch {}
    this._spikes = this._spikes.filter(s => s !== spike)

    this._player.freeze()
    this.time.delayedCall(350, () => {
      // Teleport to top of visible area
      const topY = this.cameras.main.scrollY + this._H * 0.12
      this._player.sprite.setPosition(
        Phaser.Math.Between(Math.round(this._W * 0.15), Math.round(this._W * 0.85)),
        topY,
      )
      this._player.sprite.setVelocity(0, 0)
      this._player.unfreeze()
      this.time.delayedCall(250, () => { this._hitCooldown = false })
    })
  }

  // ── Bottom reached ───────────────────────────────────────────────────────────
  _onReachBottom() {
    if (this._phase !== 'fall') return
    this._phase = 'bottom'

    if (this._spikeTimer)   { this._spikeTimer.remove();   this._spikeTimer = null }
    if (this._fallTimerEvt) { this._fallTimerEvt.remove(); this._fallTimerEvt = null }
    this._clearSpikes()

    // Black flash transition before showing bottom room
    this.cameras.main.flash(500, 0, 0, 0, true)
    this.time.delayedCall(600, () => this._startBottomDialog())
  }

  _clearSpikes() {
    this._spikes.forEach(s => {
      try { if (s.ov) this.physics.world.removeCollider(s.ov) } catch {}
      try { s.obj?.destroy() } catch {}
      try { s.gfx?.destroy() } catch {}
    })
    this._spikes = []
  }

  // ── Bottom dialog ─────────────────────────────────────────────────────────
  _startBottomDialog() {
    // Siren gloats via dialog only — no sprite in bottom section
    this._showDialog([
      '[schaut nach unten und lacht]',
      'Nun ja. Schön, dich... losgeworden zu sein.',
      '[wischt sich die Hände ab]  Auf Wiedersehen.',
      '[verschwindet in einem Banner-Regen aus Angeboten]',
    ], () => {
      this._phase = 'done'
      this._transitioning = true
      this.cameras.main.fadeOut(800, 0, 0, 0)
      this.time.delayedCall(900, () => this.scene.start('WhaleQueenScene'))
    })
  }

  // ── update ─────────────────────────────────────────────────────────────────
  update() {
    if (!this._player || this._transitioning) return
    if (this._dialogVisible) { this._player.freeze(); return }

    // Sync spike gfx to physics positions
    this._spikes.forEach(s => {
      if (s.obj?.active && s.gfx) {
        s.gfx.x = s.obj.x - SPIKE_W / 2
        s.gfx.y = s.obj.y - SPIKE_H / 2
      }
    })

    // Scroll the tiled middle bg slightly for parallax feel
    if (this._midBg && this._phase === 'fall') {
      this._midBg.tilePositionY += 0.3
    }

    try { this._player.update() } catch (err) {
      console.error('[BSS] player update error', err)
    }

    // Bottom detection — player reaches the bottom landing floor
    if (this._phase === 'fall') {
      const bottomTrigger = this._botFloorTopY - 80
      if (this._player.sprite.y >= bottomTrigger) {
        this._onReachBottom()
      }
    }
  }

  // ── shutdown ───────────────────────────────────────────────────────────────
  shutdown() {
    if (this._player) this._player.destroy()
    this._player = null
    if (this._spikeTimer)    { this._spikeTimer.remove();    this._spikeTimer = null }
    if (this._fallTimerEvt)  { this._fallTimerEvt.remove();  this._fallTimerEvt = null }
    if (this._dialogKeyFn)   window.removeEventListener('keydown', this._dialogKeyFn, true)
    this.physics.world.gravity.y = 800
    this._clearSpikes()
  }
}
