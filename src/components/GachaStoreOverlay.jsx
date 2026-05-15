/**
 * GachaStoreOverlay
 *
 * Parody gacha store UI shown when the player chooses to "pay" the FOMO Widow.
 * Displays fake diamond bundles with dark patterns:
 *   - "Best value" badge on the most expensive option
 *   - Fake countdown timer ("Offer ends in...")
 *   - FOMO copy
 *
 * Calls onClose() when the player eventually exits.
 */

import { useState, useEffect } from 'react'
import '../styles/gacha.css'

const BUNDLES = [
  { id: 'xs',  diamonds: 10,   price: '0,99 €',  tag: null,           color: '#1a1a2e' },
  { id: 'sm',  diamonds: 50,   price: '3,99 €',  tag: null,           color: '#1a2030' },
  { id: 'md',  diamonds: 120,  price: '7,99 €',  tag: 'BELIEBT',      color: '#1e2a1e' },
  { id: 'lg',  diamonds: 300,  price: '14,99 €', tag: 'BESTES ANGEBOT', color: '#2a1e10' },
  { id: 'xl',  diamonds: 700,  price: '29,99 €', tag: null,           color: '#2a101e' },
  { id: 'xxl', diamonds: 1500, price: '49,99 €', tag: '🔥 TOP DEAL',  color: '#2a0a0a' },
]

export default function GachaStoreOverlay({ onClose }) {
  const [timeLeft, setTimeLeft] = useState(899)  // fake 15:00 countdown
  const [bought,   setBought]   = useState(null)

  // Countdown timer
  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(t => Math.max(0, t - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const ss = String(timeLeft % 60).padStart(2, '0')

  function buy(bundle) {
    setBought(bundle.id)
    // Auto-close after short delay
    setTimeout(onClose, 1400)
  }

  return (
    <div className="gacha-backdrop" onClick={e => e.stopPropagation()}>
      <div className="gacha-panel">

        {/* Header */}
        <div className="gacha-header">
          <p className="gacha-store-name">💎 DIAMANT-SHOP 💎</p>
          <p className="gacha-tagline">Exklusiv für tapfere Krieger!</p>
          <div className="gacha-timer">
            ⏳ Angebot endet in: <span className="gacha-timer-value">{mm}:{ss}</span>
          </div>
        </div>

        {/* Bundle grid */}
        <div className="gacha-bundles">
          {BUNDLES.map(b => (
            <button
              key={b.id}
              className={[
                'gacha-bundle',
                b.tag            ? 'gacha-bundle--tagged'  : '',
                bought === b.id  ? 'gacha-bundle--bought'  : '',
              ].join(' ')}
              style={{ background: b.color }}
              onClick={() => buy(b)}
              disabled={!!bought}
            >
              {b.tag && <span className="gacha-bundle-tag">{b.tag}</span>}
              <span className="gacha-bundle-icon">💎</span>
              <span className="gacha-bundle-count">{b.diamonds}</span>
              <span className="gacha-bundle-unit">Diamanten</span>
              <span className="gacha-bundle-price">{b.price}</span>
              {bought === b.id && <span className="gacha-bundle-bought-msg">✓ Gekauft!</span>}
            </button>
          ))}
        </div>

        {/* FOMO nudge */}
        <p className="gacha-fomo">
          🔥 Nur noch <strong>3</strong> Spieler in deiner Region haben dieses Paket!
        </p>

        {/* Close */}
        <button
          className="gacha-close"
          onClick={onClose}
          disabled={!!bought}
        >
          {bought ? 'Weiter →' : 'Nein danke — ich verliere lieber'}
        </button>
      </div>
    </div>
  )
}
