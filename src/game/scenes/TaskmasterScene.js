/**
 * TaskmasterScene — Scene 5: Die Wächterin
 *
 * Beat:
 *   1. Taskmaster awaits the player and introduces 3 mandatory daily tasks.
 *   2. Tasks:
 *      A. Jump 3 times.
 *      B. Run from one side to the other 3 times (full width).
 *      C. Click the clipboard (dispatches React ClipboardOverlay).
 *   3. Tasks A and B are tracked internally. Task C requires React interaction.
 *   4. When all tasks done: victory screen 5 s → Taskmaster death rattle → fade to FomoWidowScene.
 */

import Phaser from 'phaser'
import PlayerController, { FLOOR_H, SPAWN_Y_OFFSET } from '../PlayerController.js'
import GameState from '../GameState.js'

const JUMP_GOAL    = 3
const RUN_GOAL     = 3    // full-width traversals
const RUN_EDGE_PCT = 0.12 // within 12% of edge counts as "reached side"

export default class TaskmasterScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TaskmasterScene' })
  }

  _reset() {
    this._player        = null
    this._transitioning = false
    this._tasksComplete = false
    this._W = this._H   = 0
    this._jumpCount     = 0
    this._runCount      = 0
    this._lastSide      = null   // 'left' | 'right'
    this._clipDone      = false
    this._taskBoardObjs = []
    this._dialogVisible = false
    this._dialogLines   = []
    this._dialogStep    = 0
    this._dialogCb      = null
    this._dialogKeyFn   = null
    this._dialogBg      = null
    this._dialogText    = null
    this._dialogHint    = null
    this._dialogSpeaker = null
    this._taskHUD       = null
    this._mastSprite    = null
    this._clipboardZone = null
    this._clipKeyFn     = null
    this._clipboardResult = null
  }

  init() { this._reset() }

  create() {
    const W = this.scale.width
    const H = this.scale.height
    this._W = W
    this._H = H

    this.cameras.main.setBounds(0, 0, W, H)
    this.physics.world.setBounds(0, 0, W, H + 200)

    // ── Background ────────────────────────────────────────────────────────────
    if (this.textures.exists('tm_bg')) {
      this.add.image(W / 2, H / 2, 'tm_bg').setDisplaySize(W, H).setDepth(-10)
    } else {
      const g = this.add.graphics().setDepth(-10)
      g.fillStyle(0x08060e, 1); g.fillRect(0, 0, W, H)
    }

    // ── Floor ────────────────────────────────────────────────────────────────
    const floorTopY = H - FLOOR_H
    const floorRect = this.add.rectangle(W / 2, H - FLOOR_H / 2, W, FLOOR_H * 2, 0, 0)
    this.physics.add.existing(floorRect, true)

    // ── Player ────────────────────────────────────────────────────────────────
    this._player = new PlayerController(this, Math.round(W * 0.08), floorTopY - SPAWN_Y_OFFSET)
    this.physics.add.collider(this._player.sprite, floorRect)

    // ── Taskmaster ───────────────────────────────────────────────────────────
    this._buildTaskmaster(W, H, floorTopY)

    // ── Clipboard stand (interactable zone) ──────────────────────────────────
    const clipX = Math.round(W * 0.52)
    this._buildClipboardStand(clipX, floorTopY)

    // ── Dialog HUD ────────────────────────────────────────────────────────────
    this._buildDialogHUD(W, H)

    // ── Task HUD ──────────────────────────────────────────────────────────────
    this._buildTaskHUD(W)

    // ── Jump counter ─────────────────────────────────────────────────────────
    this.input.keyboard.on('keydown-SPACE', this._onJumpKey, this)
    this.input.keyboard.on('keydown-UP', this._onJumpKey, this)

    // ── Clipboard result listener ─────────────────────────────────────────────
    this._clipboardResult = (e) => {
      if (e.detail?.completedAll) {
        this._clipDone = true
        this._updateTaskHUD()
        this._checkAllDone()
      }
    }
    window.addEventListener('game:clipboardResult', this._clipboardResult)

    this.cameras.main.fadeIn(700, 0, 0, 0)
    this.input.keyboard.enableGlobalCapture()

    this.time.delayedCall(900, () => this._startIntroDialog())
  }

  _buildTaskmaster(W, H, floorTopY) {
    const x  = Math.round(W * 0.72)
    const ph = 160
    if (this.textures.exists('tm_taskmaster')) {
      const tex  = this.textures.get('tm_taskmaster')
      const srcH = tex.getSourceImage().height
      const srcW = tex.getSourceImage().width
      const rw   = Math.round(srcW * (ph / srcH))
      this._mastSprite = this.add.image(x, floorTopY, 'tm_taskmaster')
        .setOrigin(0.5, 1).setDisplaySize(rw, ph).setDepth(5)
    } else {
      const g = this.add.graphics().setDepth(5)
      g.fillStyle(0x663322, 0.85)
      g.fillRect(x - 32, floorTopY - ph, 64, ph)
      this._mastSprite = g
    }
    this.add.text(x, floorTopY - ph - 6, 'TASKMASTER', {
      fontFamily: '"Cinzel", Georgia, serif', fontSize: '13px', color: '#ffbb88',
      stroke: '#200800', strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(6)
  }

  _buildClipboardStand(clipX, floorTopY) {
    // Draw a simple clipboard stand with [E] prompt
    const g = this.add.graphics().setDepth(4)
    g.fillStyle(0x2a1a08, 1)
    g.fillRect(clipX - 5, floorTopY - 80, 10, 80)
    g.fillStyle(0x5c3c18, 1)
    g.fillRoundedRect(clipX - 32, floorTopY - 120, 64, 46, 5)
    g.lineStyle(2, 0x8b6b3e, 0.9)
    g.strokeRoundedRect(clipX - 32, floorTopY - 120, 64, 46, 5)
    g.fillStyle(0xf5f0e0, 0.9)
    g.fillRoundedRect(clipX - 26, floorTopY - 114, 52, 34, 3)

    this.add.text(clipX, floorTopY - 130, '[E] AUFGABEN', {
      fontFamily: '"Cinzel", Georgia, serif', fontSize: '10px', color: '#cc8844',
      stroke: '#0a0806', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(5)

    // Physics trigger
    const zone = this.add.rectangle(clipX, floorTopY - 60, 90, 120, 0, 0)
    this.physics.add.existing(zone, true)
    this._clipboardZone = zone
    this.physics.add.overlap(this._player.sprite, zone, () => {
      this._nearClipboard = true
    }, undefined, this)
  }

  _buildDialogHUD(W, H) {
    const boxH = 90
    const boxY = H - boxH / 2 - 4
    this._dialogBg = this.add.rectangle(W / 2, boxY, W - 12, boxH, 0x07050a)
      .setScrollFactor(0).setAlpha(0).setDepth(60).setStrokeStyle(2, 0x8b4a22)
    this._dialogSpeaker = this.add.text(18, boxY - boxH / 2 + 8, '', {
      fontFamily: '"Cinzel", Georgia, serif', fontSize: '11px', color: '#ffbb88',
    }).setScrollFactor(0).setAlpha(0).setDepth(61)
    this._dialogText = this.add.text(18, boxY - boxH / 2 + 22, '', {
      fontFamily: '"Cinzel", Georgia, serif', fontSize: '14px', color: '#ffe0c0',
      wordWrap: { width: W - 36 },
    }).setScrollFactor(0).setAlpha(0).setDepth(61)
    this._dialogHint = this.add.text(W - 18, H - 10, '', {
      fontFamily: '"Cinzel", Georgia, serif', fontSize: '11px', color: '#886644',
    }).setScrollFactor(0).setOrigin(1, 1).setAlpha(0).setDepth(61)
  }

  _showDialog(lines, onComplete, speaker = 'Taskmaster') {
    this._dialogLines = lines; this._dialogStep = 0; this._dialogCb = onComplete
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
    this._dialogBg.setAlpha(0); this._dialogSpeaker.setAlpha(0)
    this._dialogText.setAlpha(0); this._dialogHint.setAlpha(0)
    if (this._dialogKeyFn) { window.removeEventListener('keydown', this._dialogKeyFn, true); this._dialogKeyFn = null }
    this._player?.unfreeze()
    if (this._dialogCb) { const cb = this._dialogCb; this._dialogCb = null; cb() }
  }

  _buildTaskHUD(W) {
    this._taskHUD = this.add.text(W - 18, 12, '', {
      fontFamily: '"Cinzel", Georgia, serif', fontSize: '11px',
      color: '#cc9966', stroke: '#0a0806', strokeThickness: 2,
      align: 'right',
    }).setScrollFactor(0).setOrigin(1, 0).setDepth(20)
    this._updateTaskHUD()
  }

  _updateTaskHUD() {
    if (!this._taskHUD) return
    const j = Math.min(this._jumpCount, JUMP_GOAL)
    const r = Math.min(this._runCount, RUN_GOAL)
    const c = this._clipDone ? '✓' : '—'
    this._taskHUD.setText(
      `Springen ${j}/${JUMP_GOAL}  Laufen ${r}/${RUN_GOAL}  Aufgaben ${c}`
    )
  }

  _startIntroDialog() {
    this._showDialog([
      'Du. Steh gerade.',
      'Ich bin Taskmaster. Du bist hier in meinem Bereich.',
      'Und hier gibt es Regeln. Pflichtaufgaben. Tägliche Tasks.',
      'Aufgabe 1: Spring 3 Mal.',
      'Aufgabe 2: Lauf 3 Mal von einer Seite zur anderen.',
      'Aufgabe 3: Geh zum Clipboard und erledige die Aufgaben.',
      'Diese Aufgaben sind unmöglich zu scheitern.',
      'Los.',
    ], () => { /* Tasks now active */ })
  }

  _onJumpKey() {
    if (this._transitioning || this._dialogVisible) return
    if (this._jumpCount < JUMP_GOAL) {
      this._jumpCount++
      this._updateTaskHUD()
      this._checkAllDone()
    }
  }

  _checkAllDone() {
    if (this._tasksComplete) return
    if (this._jumpCount >= JUMP_GOAL && this._runCount >= RUN_GOAL && this._clipDone) {
      this._tasksComplete = true
      this.time.delayedCall(300, () => this._showVictory())
    }
  }

  _openClipboard() {
    window.dispatchEvent(new CustomEvent('game:showClipboard', {
      detail: {
        tasks: [
          { id: 'task1', label: 'Complete menial Task 1', claimed: false },
          { id: 'task2', label: 'Complete menial Task 2', claimed: false },
          { id: 'task3', label: 'Complete all other tasks', claimed: false },
        ],
      },
    }))
  }

  _showVictory() {
    const W = this._W
    const H = this._H

    if (this.textures.exists('tm_victory')) {
      const img = this.add.image(W / 2, H / 2, 'tm_victory')
        .setDisplaySize(W, H).setDepth(70).setAlpha(0)
      this.tweens.add({ targets: img, alpha: 1, duration: 500 })

      this.time.delayedCall(5000, () => {
        this.tweens.add({ targets: img, alpha: 0, duration: 400, onComplete: () => {
          try { img.destroy() } catch {}
          this._taskMasterDeathRattle()
        }})
      })
    } else {
      this._taskMasterDeathRattle()
    }
  }

  _taskMasterDeathRattle() {
    this._showDialog([
      'Was... DAS KANN NICHT SEIN.',
      'Diese Aufgaben... sollten unmöglich sein!',
      'ICH... ICH...',
      '[explodiert in einem schrillen Aufschrei]',
    ], () => {
      // Fade out Taskmaster
      const targets = [this._mastSprite].filter(Boolean)
      if (targets.length) this.tweens.add({ targets, alpha: 0, duration: 600 })

      this._transitioning = true
      this.cameras.main.fadeOut(700, 0, 0, 0)
      this.time.delayedCall(760, () => this.scene.start('FomoWidowScene'))
    })
  }

  update() {
    if (!this._player || this._transitioning) return
    if (this._dialogVisible) { this._player.freeze(); return }

    this._nearClipboard = false

    try { this._player.update() } catch {}

    // Run side detection
    if (!this._tasksComplete) {
      const px = this._player.sprite.x
      if (px < this._W * RUN_EDGE_PCT) {
        if (this._lastSide !== 'left') {
          this._lastSide = 'left'
          if (this._runCount < RUN_GOAL) {
            this._runCount++
            this._updateTaskHUD()
            this._checkAllDone()
          }
        }
      } else if (px > this._W * (1 - RUN_EDGE_PCT)) {
        if (this._lastSide !== 'right') {
          this._lastSide = 'right'
          if (this._runCount < RUN_GOAL) {
            this._runCount++
            this._updateTaskHUD()
            this._checkAllDone()
          }
        }
      }
    }

    // E near clipboard
    if (this._nearClipboard && !this._clipDone && !this._tasksComplete) {
      const eJust = Phaser.Input.Keyboard.JustDown(
        this.input.keyboard.addKey('E')
      )
      if (eJust) this._openClipboard()
    }
  }

  shutdown() {
    if (this._player) this._player.destroy()
    this._player = null
    if (this._dialogKeyFn) window.removeEventListener('keydown', this._dialogKeyFn, true)
    if (this._clipboardResult) window.removeEventListener('game:clipboardResult', this._clipboardResult)
    this.input.keyboard.off('keydown-SPACE', this._onJumpKey, this)
    this.input.keyboard.off('keydown-UP', this._onJumpKey, this)
  }
}
