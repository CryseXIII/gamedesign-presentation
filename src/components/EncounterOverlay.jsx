/**
 * EncounterOverlay
 *
 * React overlay shown when Phaser dispatches 'game:encounterChoice'.
 * Presents two choices: FIGHT or PAY (gacha).
 * Dispatches 'game:encounterDecision' back to Phaser on choice.
 *
 * Also optionally shows the GachaStoreOverlay if the player pays.
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

  if (!encounter) return null

  function decide(decision) {
    if (decision === 'pay') {
      setShowGacha(true)
      return   // wait for gacha store to close
    }
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

  return (
    <div className="encounter-backdrop">
      <div className="encounter-panel">

        <p className="encounter-who">FOMO WIDOW</p>

        <div className="encounter-hp-bar-wrap">
          <div className="encounter-hp-bar" style={{ width: '100%' }} />
        </div>

        <p className="encounter-speech">
          „Tapferer Krieger… wieso kämpfen?
          <br />
          Ein paar Diamanten genügen, und ich lasse dich gehen."
        </p>

        <div className="encounter-choices">
          <button
            className="encounter-btn encounter-btn--fight"
            onClick={() => decide('fight')}
          >
            <span className="encounter-btn-icon">⚔</span>
            <span className="encounter-btn-label">KÄMPFEN</span>
            <span className="encounter-btn-sub">Kein Preis. Nur Stahl.</span>
          </button>

          <button
            className="encounter-btn encounter-btn--pay"
            onClick={() => decide('pay')}
          >
            <span className="encounter-btn-icon">💎</span>
            <span className="encounter-btn-label">10 DIAMANTEN ZAHLEN</span>
            <span className="encounter-btn-sub">Zeit sparen. Einfacher Weg.</span>
          </button>
        </div>

        <p className="encounter-hint">Wähle sorgfältig — jede Entscheidung zählt.</p>
      </div>
    </div>
  )
}
