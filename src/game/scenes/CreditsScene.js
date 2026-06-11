/**
 * Room 4 — Credits
 *
 * Black screen. Credits scroll upward. End-credits music plays.
 * Press any key (after 1 s) to skip.
 * On complete (or skip) → fires 'game:exit' window event → React returns to title.
 *
 * Ending branch (read from GameState at create() time):
 *   isGachaDemon() === true  (gachaScore >= 5) → BAD  ending: "DU BIST GEFALLEN"
 *   isGachaDemon() === false                   → GOOD ending: "DU HAST WIDERSTANDEN"
 */

import Phaser from 'phaser'
import GameState from '../GameState.js'

const CREDITS_BASE = [
  { text: 'GAME DESIGN AS ART',              size: 34, color: '#d4af37', gap: 18 },
  { text: '',                                 size: 10, color: '',        gap:  8 },
  { text: 'A PRESENTATION',                  size: 18, color: '#8a7040', gap: 60 },

  { text: 'TOPIC',                            size: 13, color: '#3a2a10', gap:  8 },
  { text: 'Environmental Storytelling\n& Player Trust in Game Design',
                                              size: 18, color: '#c8b89a', gap: 60 },

  // ── Games referenced ──────────────────────────────────────────────────────
  { text: 'REFERENCED GAMES',               size: 13, color: '#3a2a10', gap:  8 },
  { text: 'Dark Souls III',                  size: 22, color: '#c0a040', gap:  4 },
  { text: 'FromSoftware  ·  2016',           size: 14, color: '#5a4520', gap: 12 },
  { text: 'Elden Ring',                      size: 22, color: '#c0a040', gap:  4 },
  { text: 'FromSoftware  ·  2022',           size: 14, color: '#5a4520', gap: 12 },
  { text: 'Cuphead',                         size: 22, color: '#608050', gap:  4 },
  { text: 'Studio MDHR  ·  2017',            size: 14, color: '#5a4520', gap: 12 },
  { text: 'Jump King',                       size: 22, color: '#608050', gap:  4 },
  { text: 'Nexile  ·  2019',                 size: 14, color: '#5a4520', gap: 12 },
  { text: 'La-Mulana Remake',                size: 22, color: '#608050', gap:  4 },
  { text: 'Nigoro  ·  2012',                 size: 14, color: '#5a4520', gap: 12 },
  { text: 'Getting Over It with\nBennett Foddy', size: 22, color: '#608050', gap:  4 },
  { text: 'Bennett Foddy  ·  2017',          size: 14, color: '#5a4520', gap: 12 },
  { text: 'Spec Ops: The Line',              size: 22, color: '#8050a0', gap:  4 },
  { text: 'Yager Development  ·  2012',      size: 14, color: '#5a4520', gap: 12 },
  { text: 'Dead Space',                      size: 22, color: '#4080c0', gap:  4 },
  { text: 'EA Redwood Shores  ·  2008',      size: 14, color: '#5a4520', gap: 12 },
  { text: 'Shadow of the Colossus',          size: 22, color: '#4080c0', gap:  4 },
  { text: 'Team Ico / SIE Japan Studio  ·  2005', size: 14, color: '#5a4520', gap: 60 },

  // ── Video sources ──────────────────────────────────────────────────────────
  { text: 'VIDEO QUELLEN',                  size: 13, color: '#3a2a10', gap:  8 },
  { text: 'Half-Life 2: Ep.2 — Developer Commentary',   size: 14, color: '#c8b89a', gap:  4 },
  { text: 'youtube.com/watch?v=OK4koZJcook',             size: 11, color: '#5a4520', gap: 10 },
  { text: 'Dark Souls — Full Prologue',                  size: 14, color: '#c8b89a', gap:  4 },
  { text: 'youtube.com/watch?v=4lmEqpgg3B4',            size: 11, color: '#5a4520', gap: 10 },
  { text: 'Cuphead — Journalist vs. Pigeon Test',        size: 14, color: '#c8b89a', gap:  4 },
  { text: 'youtube.com/watch?v=OOjXaAZHEQE',            size: 11, color: '#5a4520', gap: 10 },
  { text: "Elden Ring — Grace's Guidance",               size: 14, color: '#c8b89a', gap:  4 },
  { text: 'youtube.com/watch?v=glqcvTJYC_0',            size: 11, color: '#5a4520', gap: 10 },
  { text: 'Jump King — No Commentary',                   size: 14, color: '#c8b89a', gap:  4 },
  { text: 'youtube.com/watch?v=qL2cQ0JAb4M',            size: 11, color: '#5a4520', gap: 10 },
  { text: 'La-Mulana Remake — Itemless Loop',            size: 14, color: '#c8b89a', gap:  4 },
  { text: 'youtube.com/watch?v=X1_oNvqm5TM',            size: 11, color: '#5a4520', gap: 10 },
  { text: "Getting Over It — TAS 38 s",                  size: 14, color: '#c8b89a', gap:  4 },
  { text: 'youtube.com/watch?v=rSKOVohamx4',            size: 11, color: '#5a4520', gap: 10 },
  { text: 'Spec Ops: The Line — A Line, Crossed',        size: 14, color: '#c8b89a', gap:  4 },
  { text: 'youtube.com/watch?v=-GwVJJYbVtY',            size: 11, color: '#5a4520', gap: 10 },
  { text: 'Dead Space — Ishimura Medical Ambience',      size: 14, color: '#c8b89a', gap:  4 },
  { text: 'youtube.com/watch?v=YdW16MBsuyU',            size: 11, color: '#5a4520', gap: 10 },
  { text: 'Shadow of the Colossus — Phalanx Boss',       size: 14, color: '#c8b89a', gap:  4 },
  { text: 'youtube.com/watch?v=Qg9scSBi3t8',            size: 11, color: '#5a4520', gap: 60 },

  // ── Tools & Assets ─────────────────────────────────────────────────────────
  { text: 'TOOLS & ASSETS',                 size: 13, color: '#3a2a10', gap:  8 },
  { text: 'ChatGPT Image Generation (OpenAI)', size: 14, color: '#c8b89a', gap:  4 },
  { text: 'React 19  +  Phaser 4',          size: 14, color: '#c8b89a', gap:  4 },
  { text: 'Vite 8  ·  Node.js 22',          size: 14, color: '#c8b89a', gap: 60 },

  { text: 'PRÄSENTIERT VON',               size: 13, color: '#3a2a10', gap:  8 },
  { text: 'Viktor',                         size: 30, color: '#d4af37', gap: 80 },
]

const THANK_YOU = [
  { text: '',                                  size: 10, color: '', gap: 20 },
  { text: 'Thank you for playing.',            size: 38, color: '#d4af37', gap: 16 },
  { text: '',                                  size: 10, color: '', gap: 40 },
]

const ENDING_BAD = [
  { text: 'DU BIST GEFALLEN',                          size: 44, color: '#8b0000', gap: 18 },
  { text: '— und wurdest, was du bekämpfst.',           size: 18, color: '#5a4520', gap: 24 },
  { text: `Gacha-Score: ${0}`,                          size: 13, color: '#3a1010', gap:  0 },
]

const ENDING_GOOD = [
  { text: 'DU HAST WIDERSTANDEN',                      size: 44, color: '#c9a84c', gap: 18 },
  { text: '— und die Lektion verstanden.',              size: 18, color: '#5a4520', gap:  0 },
]

const SCROLL_SPEED = 48   // px per second

export default class CreditsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CreditsScene' })
    this._exited = false
  }

  init() {
    this._exited = false
  }

  // preload() removed — 'endcredits' is loaded by PreloadScene

  preload() {
    const load = (key, path) => { if (!this.textures.exists(key)) this.load.image(key, path) }
    load('credits_endscreen',       '/assets/scenes/credits/endscreen.jpg')
    load('credits_endscreen_f_wqv', '/assets/scenes/credits/endscreen_f_wqv.jpg')
    load('credits_endscreen_f_wqd', '/assets/scenes/credits/endscreen_f_wqd.jpg')
    load('credits_endscreen_m_wqd', '/assets/scenes/credits/endscreen_m_wqd.jpg')
  }

  create() {
    const W = this.scale.width
    const H = this.scale.height

    // ── Build ending-specific credits array ────────────────────────────────
    const isBad  = GameState.isGachaDemon()
    const ending = isBad
      ? ENDING_BAD.map(l =>
          l.text.startsWith('Gacha-Score:')
            ? { ...l, text: `Gacha-Score: ${GameState.gachaScore}` }
            : l
        )
      : ENDING_GOOD
    const CREDITS = [...CREDITS_BASE, ...ending, ...THANK_YOU]

    this.cameras.main.setBackgroundColor(0x000000)
    this.cameras.main.fadeIn(1200, 0, 0, 0)

    // ── Music ──────────────────────────────────────────────────────────────
    try {
      this.sound.add('endcredits', { loop: false, volume: 0.55 }).play()
    } catch (_) { /* audio context may not be ready — silent fallback */ }

    // ── Build credits container ────────────────────────────────────────────
    const container = this.add.container(W / 2, H + 60)
    let yOff = 0

    for (const line of CREDITS) {
      if (line.text === '') {
        yOff += line.size + line.gap
        continue
      }
      const t = this.add.text(0, yOff, line.text, {
        fontFamily: '"Cinzel", Georgia, serif',
        fontSize:   `${line.size}px`,
        color:      line.color || '#c8b89a',
        align:      'center',
        wordWrap:   { width: W * 0.72, useAdvancedWrap: true },
      }).setOrigin(0.5, 0)
      container.add(t)
      yOff += t.height + line.gap
    }

    // ── Scroll tween ──────────────────────────────────────────────────────
    const totalH    = yOff
    const duration  = ((H + totalH + 200) / SCROLL_SPEED) * 1000

    this.tweens.add({
      targets:  container,
      y:        -totalH - 80,
      duration,
      ease:     'Linear',
      onComplete: () => { this._showEndScreen() },
    })

    // ── Skip on any key / button (1 s delay so last key-press doesn't skip)
    this.time.delayedCall(1000, () => {
      this.input.keyboard.once('keydown', () => { this._showEndScreen() })
      if (this.input.gamepad) {
        this.input.gamepad.once('down', () => { this._showEndScreen() })
      }
    })
  }

  _showEndScreen() {
    if (this._exited) return
    this._exited = true
    this.tweens.killAll()

    const W = this.scale.width
    const H = this.scale.height

    // Pick end screen based on gender + whale queen outcome
    const gender = GameState.gender
    const wqo    = GameState.whaleQueenOutcome   // 'victory' | 'defeat' | null
    let texKey = 'credits_endscreen'   // default: male + WQ victory or no WQ

    if (gender === 'female' && wqo === 'victory') {
      texKey = 'credits_endscreen_f_wqv'
    } else if (gender === 'female' && wqo === 'defeat') {
      texKey = 'credits_endscreen_f_wqd'
    } else if (gender === 'male' && wqo === 'defeat') {
      texKey = 'credits_endscreen_m_wqd'
    }
    // Fallback to default if specific texture not loaded
    if (!this.textures.exists(texKey)) texKey = 'credits_endscreen'

    if (this.textures.exists(texKey)) {
      this.cameras.main.fadeIn(0, 0, 0, 0)
      const img = this.add.image(W / 2, H / 2, texKey)
        .setDisplaySize(W, H).setDepth(100).setAlpha(0)
      this.tweens.add({ targets: img, alpha: 1, duration: 1200, ease: 'Quad.easeIn' })

      this.time.delayedCall(1500, () => {
        this.input.keyboard.once('keydown', () => { this._finish() })
        if (this.input.gamepad) this.input.gamepad.once('down', () => { this._finish() })
        this.add.text(W / 2, H - 24, '[beliebige Taste]  Beenden', {
          fontFamily: '"Cinzel", Georgia, serif',
          fontSize:   '12px',
          color:      '#5a4520',
          stroke:     '#000000',
          strokeThickness: 2,
        }).setOrigin(0.5, 1).setDepth(101)
      })
    } else {
      this._finish()
    }
  }

  _finish() {
    this.tweens.killAll()
    this.sound.stopAll()
    window.dispatchEvent(new CustomEvent('game:exit'))
  }
}
