/**
 * Room 4 — Credits
 *
 * Black screen. Credits scroll upward. End-credits music plays.
 * Press any key (after 1 s) to skip.
 * On complete (or skip) → fires 'game:exit' window event → React returns to title.
 */

import Phaser from 'phaser'

const CREDITS = [
  { text: 'GAME DESIGN AS ART',              size: 34, color: '#d4af37', gap: 18 },
  { text: '',                                 size: 10, color: '',        gap:  8 },
  { text: 'A PRESENTATION',                  size: 18, color: '#8a7040', gap: 60 },

  { text: 'TOPIC',                            size: 13, color: '#3a2a10', gap:  8 },
  { text: 'Environmental Storytelling\n& Player Trust in Game Design',
                                              size: 18, color: '#c8b89a', gap: 60 },

  { text: 'REFERENCE MATERIAL',              size: 13, color: '#3a2a10', gap:  8 },
  { text: 'Dark Souls III',                  size: 22, color: '#c0a040', gap:  4 },
  { text: 'FromSoftware  ·  2016',           size: 14, color: '#5a4520', gap: 14 },
  { text: "Assassin's Creed Odyssey",        size: 22, color: '#608050', gap:  4 },
  { text: 'Ubisoft  ·  2018',               size: 14, color: '#5a4520', gap: 60 },

  { text: 'BUILT WITH',                      size: 13, color: '#3a2a10', gap:  8 },
  { text: 'React 19  +  Phaser 4',           size: 18, color: '#c8b89a', gap:  4 },
  { text: 'Vite 8  ·  Node.js 22',           size: 18, color: '#c8b89a', gap: 60 },

  { text: 'PRESENTED BY',                    size: 13, color: '#3a2a10', gap:  8 },
  { text: 'Viktor',                          size: 30, color: '#d4af37', gap: 100 },

  { text: 'YOU DIED',                        size: 44, color: '#8b0000', gap: 18 },
  { text: '— and learned something.',        size: 18, color: '#5a4520', gap:  0 },
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

  create() {
    const W = this.scale.width
    const H = this.scale.height

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
      onComplete: () => { this._finish() },
    })

    // ── Skip on any key / button (1 s delay so last key-press doesn't skip)
    this.time.delayedCall(1000, () => {
      this.input.keyboard.once('keydown', () => { this._finish() })
      if (this.input.gamepad) {
        this.input.gamepad.once('down', () => { this._finish() })
      }
    })
  }

  _finish() {
    if (this._exited) return
    this._exited = true
    this.tweens.killAll()
    this.sound.stopAll()
    window.dispatchEvent(new CustomEvent('game:exit'))
  }
}
