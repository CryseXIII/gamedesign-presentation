/**
 * EncounterOverlay
 *
 * React overlay shown when Phaser dispatches 'game:encounterChoice'.
 *
 * Choices:
 *   KAUFEN  → opens GachaStoreOverlay; on close dispatches { decision: 'pay' }
 *   ABBRECHEN → dispatches { decision: 'cancel' }; Phaser then shows a J-prompt
 *               so the player can fight organically or just walk past.
 *
 * Props:
 *   encounter  — { id, hp } from the window event detail, or null
 *   onClose    — called after a decision is dispatched
 */

import { useState } from 'react'
import GachaStoreOverlay from './GachaStoreOverlay.jsx'
import '../styles/encounter.css'

export default function EncounterOverlay({ encounter, onClose }) {
  const [showGacha, setShowGacha] = useState(false)
  const isSpeedup = encounter?.id === 'speedup_succubus'

  if (!encounter) return null

  function decide(decision) {
    if (decision === 'pay') {
      setShowGacha(true)
      return   // wait for gacha store to close before dispatching
    }
    // 'cancel'
    window.dispatchEvent(new CustomEvent('game:encounterDecision', {
      detail: { decision },
    }))
    if (onClose) onClose()
  }

  function onGachaClose() {
    setShowGacha(false)
    window.dispatchEvent(new CustomEvent('game:encounterDecision', {
      detail: { decision: 'pay' },
    }))
    if (onClose) onClose()
  }

  if (showGacha) {
    return <GachaStoreOverlay onClose={onGachaClose} />
  }

  if (isSpeedup) {
    return (
      <div className="encounter-backdrop encounter-backdrop--speedup">
        <div className="encounter-panel encounter-panel--speedup">
          <p className="encounter-who encounter-who--speedup">SPEEDUP SUCCUBUS</p>

          <div className="encounter-hp-bar-wrap encounter-hp-bar-wrap--speedup">
            <div className="encounter-hp-bar encounter-hp-bar--speedup" style={{ width: '100%' }} />
          </div>

          <p className="encounter-speech encounter-speech--speedup">
            „Du kommst weiter als die anderen.
            <br />
            Nimm meinen Diamanten. Ich zeige dir den Riss in der Zeitbarriere.“
          </p>

          <div className="encounter-choices">
            <button
              className="encounter-btn encounter-btn--speedup"
              onClick={() => decide('speedup')}
            >
              <span className="encounter-btn-icon">💠</span>
              <span className="encounter-btn-label">BOOST ANNEHMEN</span>
              <span className="encounter-btn-sub">K öffnet spätere Zeitbarrieren.</span>
            </button>

            <button
              className="encounter-btn encounter-btn--cancel"
              onClick={() => decide('cancel')}
            >
              <span className="encounter-btn-icon">✕</span>
              <span className="encounter-btn-label">SPÄTER</span>
              <span className="encounter-btn-sub">Ich laufe erstmal weiter.</span>
            </button>
          </div>

          <p className="encounter-hint encounter-hint--speedup">Die rechte Seite wartet hinter der Barriere.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="encounter-backdrop">
      <div className="encounter-panel">

        <p className="encounter-who">FOMO WIDOW</p>

        <div className="encounter-hp-bar-wrap">
          <div className="encounter-hp-bar" style={{ width: '100%' }} />
        </div>

        <p className="encounter-speech">
          „Tapferer Krieger… Blut ist so unnötig.
          <br />
          Ein paar Diamanten — und ich öffne dir den Weg."
        </p>

        <div className="encounter-choices">
          <button
            className="encounter-btn encounter-btn--pay"
            onClick={() => decide('pay')}
          >
            <span className="encounter-btn-icon">💎</span>
            <span className="encounter-btn-label">10 DIAMANTEN ZAHLEN</span>
            <span className="encounter-btn-sub">Schnell. Einfach. Nur einmal.</span>
          </button>

          <button
            className="encounter-btn encounter-btn--cancel"
            onClick={() => decide('cancel')}
          >
            <span className="encounter-btn-icon">✕</span>
            <span className="encounter-btn-label">ABBRECHEN</span>
            <span className="encounter-btn-sub">Ich entscheide selbst.</span>
          </button>
        </div>

        <p className="encounter-hint">Du kannst jederzeit zurückkehren.</p>
      </div>
    </div>
  )
}
