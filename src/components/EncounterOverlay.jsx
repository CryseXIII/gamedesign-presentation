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

import { useEffect, useState } from 'react'
import GachaStoreOverlay from './GachaStoreOverlay.jsx'
import '../styles/encounter.css'

export default function EncounterOverlay({ encounter, onClose }) {
  const [showGacha, setShowGacha] = useState(false)
  const [speedupStep, setSpeedupStep] = useState(0)
  const isSpeedup = encounter?.id === 'speedup_succubus'

  useEffect(() => {
    setShowGacha(false)
    setSpeedupStep(0)
  }, [encounter?.id])

  useEffect(() => {
    if (!isSpeedup) return undefined

    const onKeyDown = (event) => {
      if (event.key !== 'e' && event.key !== 'E') return
      event.preventDefault()

      if (speedupStep < SPEEDUP_LINES.length - 1) {
        setSpeedupStep((value) => Math.min(value + 1, SPEEDUP_LINES.length - 1))
        return
      }

      window.dispatchEvent(new CustomEvent('game:encounterDecision', {
        detail: { decision: 'speedup' },
      }))
      if (onClose) onClose()
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [isSpeedup, speedupStep, onClose])

  const SPEEDUP_LINES = [
    'Du hast meinen Angriff ueberlebt. Interessant.',
    'Ich will sehen, wie weit du kommst.',
    'Hier. Nimm meinen Speedup-Diamanten.',
    'Viel Glueck.',
  ]

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
      <div className="encounter-backdrop encounter-backdrop--speedup encounter-backdrop--dialog">
        <div className="encounter-dialog-box encounter-dialog-box--speedup">
          <div className="encounter-dialog-text">{SPEEDUP_LINES[speedupStep]}</div>
          <div className="encounter-dialog-footer">
            <span className="encounter-dialog-step">{speedupStep + 1}/{SPEEDUP_LINES.length}</span>
            <span className="encounter-dialog-advance">E WEITER</span>
          </div>
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
