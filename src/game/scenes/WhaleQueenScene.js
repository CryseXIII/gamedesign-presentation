/**
 * WhaleQueenScene — Scene 4: Der Thronsaal
 *
 * Beat:
 *   1. Player enters throne room. Whale Queen speaks.
 *   2. She offers to spare the player for 5000 diamonds.
 *   3. Pay → DEFEAT screen 5 s → she leaves → exit opens.
 *   4. Refuse → VICTORY screen 5 s → she leaves → exit opens.
 *   5. Player walks right to exit → TaskmasterScene.
 */

import Phaser from 'phaser'
import PlayerController, { FLOOR_H, SPAWN_Y_OFFSET } from '../PlayerController.js'
import GameState from '../GameState.js'

export default class WhaleQueenScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WhaleQueenScene' })
  }

  _reset() {
    this._player        = null
    this._transitioning = false
    this._queenDone     = false
    this._dialogVisible = false
    this._dialogLines   = []
    this._dialogStep    = 0
    this._dialogCb      = null
    this._dialogKeyFn   = null
    this._dialogBg      = null
    this._dialogText    = null
    this._dialogHint    = null
    this._dialogSpeaker = null
    this._choiceShown   = false
    this._W = this._H = 0
    this._exitZone      = null
    this._queenSprite   = null
    this._queenLabel    = null
  }

  init() { this._reset() }

  preload() {
    const load = (key, path) => { if (!this.textures.exists(key)) this.load.image(key, path) }
    load('wq_bg',         '/assets/scenes/wq/bg.jpg')
    load('wq_whale_queen','/assets/scenes/wq/whale_queen.png')
    load('wq_victory',    '/assets/scenes/wq/victory.jpg')
    load('wq_victory_f',  '/assets/scenes/wq/victory_f.jpg')
    load('wq_defeat',     '/assets/scenes/wq/defeat.jpg')
    load('wq_defeat_f',   '/assets/scenes/wq/defeat_f.jpg')
  }

  create() {
    const W = this.scale.width
    const H = this.scale.height
    this._W = W
    this._H = H

    this.cameras.main.setBounds(0, 0, W, H)
    this.physics.world.setBounds(0, 0, W, H + 200)

    // ── Background ────────────────────────────────────────────────────────────
    if (this.textures.exists('wq_bg')) {
      this.add.image(W / 2, H / 2, 'wq_bg').setDisplaySize(W, H).setDepth(-10)
    } else {
      const g = this.add.graphics().setDepth(-10)
      g.fillStyle(0x03020a, 1)
      g.fillRect(0, 0, W, H)
    }

    // ── Floor — measured at 82.5% of H in wq_bg.jpg ──────────────────────────
    const floorTopY = Math.round(H * 0.825)
    const floorRect = this.add.rectangle(W / 2, floorTopY + FLOOR_H / 2, W, FLOOR_H, 0x000000, 0)
    this.physics.add.existing(floorRect, true)

    // ── Player ────────────────────────────────────────────────────────────────
    const player = new PlayerController(this, Math.round(W * 0.08), floorTopY - SPAWN_Y_OFFSET)
    this._player = player
    this.physics.add.collider(player.sprite, floorRect)

    // ── Whale Queen ───────────────────────────────────────────────────────────
    this._buildQueen(W, H, floorTopY)

    // ── Exit gate ─────────────────────────────────────────────────────────────
    const gateH = H - floorTopY + 200   // only reach below the floor line
    const exitGate = this.add.rectangle(W - 40, floorTopY - gateH/2 + 100, 80, gateH, 0x000000, 0)
    this.physics.add.existing(exitGate, true)
    this._exitGateBody = exitGate
    this.physics.add.collider(player.sprite, exitGate)

    const exitOverlay = this.add.rectangle(W - 30, H / 2, 5, H, 0x224466, 0.4).setDepth(3)
    this._exitOverlay = exitOverlay

    const exitZone = this.add.rectangle(W - 30, H / 2, 80, H + 200, 0, 0)
    this.physics.add.existing(exitZone, true)
    this.physics.add.overlap(player.sprite, exitZone, () => {
      if (!this._transitioning && this._queenDone) this._exitScene()
    }, undefined, this)
    this._exitZone = exitZone

    // ── Dialog HUD ────────────────────────────────────────────────────────────
    this._buildDialogHUD(W, H)

    this.cameras.main.fadeIn(700, 0, 0, 0)
    this.input.keyboard.enableGlobalCapture()

    this.time.delayedCall(900, () => this._startIntroDialog())
  }

  _buildQueen(W, H, floorTopY) {
    // Centre the queen on the throne visible in wq_bg — throne at ~57% x, seats at floorTopY
    const x  = Math.round(W * 0.57)
    const throneY = floorTopY   // sit right at the floor level
    const ph = 320   // taller so she looks imposing on the throne
    if (this.textures.exists('wq_whale_queen')) {
      const tex  = this.textures.get('wq_whale_queen')
      const srcH = tex.getSourceImage().height
      const srcW = tex.getSourceImage().width
      const rw   = Math.round(srcW * (ph / srcH))
      this._queenSprite = this.add.image(x, throneY, 'wq_whale_queen')
        .setOrigin(0.5, 1).setDisplaySize(rw, ph).setDepth(5)
      try { this.textures.get('wq_whale_queen').setFilter(Phaser.Textures.FilterMode.LINEAR) } catch {}
    } else {
      const g = this.add.graphics().setDepth(5)
      g.fillStyle(0x2244aa, 0.85)
      g.fillRect(x - 36, throneY - ph, 72, ph)
      this._queenSprite = g
    }
    this._queenLabel = this.add.text(x, throneY - ph - 6, 'WHALE QUEEN', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize:   '20px',
      color:      '#aaddff',
      stroke:     '#001030',
      strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(6)
  }

  _buildDialogHUD(W, H) {
    const boxH = 130
    const boxY = H - boxH / 2 - 4
    this._dialogBg = this.add.rectangle(W / 2, boxY, W - 12, boxH, 0x030616)
      .setScrollFactor(0).setAlpha(0).setDepth(80).setStrokeStyle(2, 0x2244aa)
    this._dialogSpeaker = this.add.text(18, boxY - boxH / 2 + 10, '', {
      fontFamily: '"Cinzel", Georgia, serif', fontSize: '16px', color: '#aaddff',
    }).setScrollFactor(0).setAlpha(0).setDepth(81)
    this._dialogText = this.add.text(18, boxY - boxH / 2 + 40, '', {
      fontFamily: '"Cinzel", Georgia, serif', fontSize: '20px', color: '#c8e8ff',
      wordWrap: { width: W - 36 },
    }).setScrollFactor(0).setAlpha(0).setDepth(81)
    this._dialogHint = this.add.text(W - 18, H - 10, '', {
      fontFamily: '"Cinzel", Georgia, serif', fontSize: '16px', color: '#446688',
    }).setScrollFactor(0).setOrigin(1, 1).setAlpha(0).setDepth(81)
  }

  _showDialog(lines, onComplete, speaker = 'Whale Queen') {
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
    this._dialogBg.setAlpha(0)
    this._dialogSpeaker.setAlpha(0)
    this._dialogText.setAlpha(0)
    this._dialogHint.setAlpha(0)
    if (this._dialogKeyFn) {
      window.removeEventListener('keydown', this._dialogKeyFn, true)
      this._dialogKeyFn = null
    }
    this._player?.unfreeze()
    if (this._dialogCb) { const cb = this._dialogCb; this._dialogCb = null; cb() }
  }

  _startIntroDialog() {
    this._showDialog([
      'Mmm... ein Gast. In meinem Thronsaal.',
      'Du siehst erschöpft aus, Krieger. Verständlich.',
      'Weißt du was? Ich bin gnädig heute.',
      'Ich verschone dich — für nur 5.000 Diamanten.',
      '...oder du versuchst dein Glück gegen mich.',
      '[lächelt kalt]  Q = zahlen.   E = kämpfen.',
    ], () => this._showPaymentChoice())
  }

  _showPaymentChoice() {
    if (this._choiceShown) return
    this._choiceShown = true
    const W = this._W
    const H = this._H

    const panelBg = this.add.rectangle(W / 2, H / 2, 580, 200, 0x030616)
      .setDepth(65).setStrokeStyle(2, 0x2244aa)

    const titleTxt = this.add.text(W / 2, H / 2 - 70, '— 5.000 DIAMANTEN ZAHLEN? —', {
      fontFamily: '"Cinzel", Georgia, serif', fontSize: '22px', color: '#aaddff',
    }).setOrigin(0.5).setDepth(66)

    const payBtn = this.add.text(W / 2 - 130, H / 2 + 4, '[Q]  💎 ZAHLEN', {
      fontFamily: '"Cinzel", Georgia, serif', fontSize: '20px', color: '#ffdd44',
      backgroundColor: '#1a3060', padding: { x: 18, y: 10 },
    }).setOrigin(0.5).setDepth(66).setInteractive({ useHandCursor: true })

    const refuseBtn = this.add.text(W / 2 + 130, H / 2 + 4, '[E]  ✕ ABLEHNEN', {
      fontFamily: '"Cinzel", Georgia, serif', fontSize: '20px', color: '#ccddff',
      backgroundColor: '#1a1040', padding: { x: 18, y: 10 },
    }).setOrigin(0.5).setDepth(66).setInteractive({ useHandCursor: true })

    const hintTxt = this.add.text(W / 2, H / 2 + 64, 'Q = Zahlen   •   E = Ablehnen', {
      fontFamily: '"Cinzel", Georgia, serif', fontSize: '22px', color: '#446688',
    }).setOrigin(0.5).setDepth(66)

    let choiceKeyFn = null
    const dismiss = (choice) => {
      try { payBtn.removeAllListeners(); refuseBtn.removeAllListeners() } catch {}
      try { panelBg.destroy(); titleTxt.destroy(); payBtn.destroy(); refuseBtn.destroy(); hintTxt.destroy() } catch {}
      if (choiceKeyFn) { window.removeEventListener('keydown', choiceKeyFn, true); choiceKeyFn = null }
      this._onPaymentChoice(choice)
    }

    payBtn.on('pointerdown', () => dismiss('pay'))
    refuseBtn.on('pointerdown', () => dismiss('refuse'))

    choiceKeyFn = (e) => {
      if (e.key === 'q' || e.key === 'Q') { e.preventDefault(); dismiss('pay') }
      if (e.key === 'e' || e.key === 'E') { e.preventDefault(); dismiss('refuse') }
    }
    window.addEventListener('keydown', choiceKeyFn, true)
  }

  _onPaymentChoice(choice) {
    const W = this._W
    const H = this._H
    const isFemale = GameState.gender === 'female'
    const isDefeat = choice === 'pay'

    // Track outcome in GameState
    GameState.whaleQueenOutcome = isDefeat ? 'defeat' : 'victory'
    if (isDefeat) GameState.recordChoice?.('gacha')

    // Pick the right image key
    let texKey
    if (isDefeat) {
      texKey = isFemale && this.textures.exists('wq_defeat_f') ? 'wq_defeat_f' : 'wq_defeat'
    } else {
      texKey = isFemale && this.textures.exists('wq_victory_f') ? 'wq_victory_f' : 'wq_victory'
    }

    // Dialog lines for each outcome
    const victoryLines = [
      '[Klinge trifft — die Whale Queen taumelt]',
      'Du... du wagst es, mich anzugreifen?!',
      'Ich bin eine GÖTTIN. Niemand schlägt mich!',
      '[fällt zu Boden]',
      '...niemand hat mir je so Widerstand geleistet.',
      'Vielleicht... hast du etwas, das ich nicht kaufen kann.',
      '[flüstert]  Lass es dir nicht wegnehmen.',
    ]
    const defeatLines = [
      '[streckt die Hand aus]  5.000 Diamanten. Klug von dir.',
      'Ich schätze Weisheit. Und Großzügigkeit.',
      'Dein Beutel ist leichter. Dein Herz auch.',
      '[lächelt süffisant]  Bis zum nächsten Mal, Krieger.',
    ]

    const showScreen = () => {
      if (this.textures.exists(texKey)) {
        const img = this.add.image(W / 2, H / 2, texKey)
          .setDisplaySize(W, H).setDepth(70).setAlpha(0)
        this.tweens.add({ targets: img, alpha: 1, duration: 600 })

        // Show dialog on top of the image
        this.time.delayedCall(800, () => {
          this._showDialog(isDefeat ? defeatLines : victoryLines, () => {
            this.tweens.add({ targets: img, alpha: 0, duration: 500, onComplete: () => {
              try { img.destroy() } catch {}
              this._dismissQueen()
            }})
          })
        })
      } else {
        this._dismissQueen()
      }
    }

    showScreen()
  }

  _dismissQueen() {
    const targets = [this._queenSprite, this._queenLabel].filter(Boolean)
    if (targets.length) this.tweens.add({ targets, alpha: 0, duration: 600 })

    // Unlock exit
    if (this._exitGateBody?.body) this._exitGateBody.body.enable = false
    if (this._exitOverlay) this.tweens.add({ targets: this._exitOverlay, alpha: 0, duration: 400 })
    this._queenDone = true

    // Hint
    this.add.text(this._W - 80, this._H - FLOOR_H - 30, '→ WEITER', {
      fontFamily: '"Cinzel", Georgia, serif', fontSize: '20px', color: '#aaddff',
      stroke: '#001030', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(10)
  }

  _exitScene() {
    if (this._transitioning) return
    this._transitioning = true
    this.cameras.main.fadeOut(700, 0, 0, 0)
    this.time.delayedCall(760, () => this.scene.start('TaskmasterScene'))
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
  }
}
