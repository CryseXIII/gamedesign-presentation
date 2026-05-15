import { useEffect, useRef, useState } from 'react'
import '../styles/startscreen.css'

export default function StartScreen({ onStart }) {
  const audioRef = useRef(null)
  const firedRef = useRef(false)
  const [hovered, setHovered] = useState(false)

  function handleStart() {
    if (firedRef.current) return
    firedRef.current = true

    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }
    setTimeout(onStart, 700)
  }

  // Keyboard: any non-modifier key
  useEffect(() => {
    function onKey(e) {
      const ignored = ['Shift', 'Control', 'Alt', 'Meta', 'Tab', 'CapsLock']
      if (!ignored.includes(e.key)) handleStart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Gamepad: poll for any button press
  useEffect(() => {
    const id = setInterval(() => {
      for (const gp of navigator.getGamepads()) {
        if (gp && gp.buttons.some(b => b.pressed)) {
          handleStart()
          clearInterval(id)
          return
        }
      }
    }, 100)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="start-screen" onClick={handleStart}>
      <div className="start-bg" />

      <div className="start-content">
        {/* Logo */}
        <div className="start-logo-wrap">
          <img
            className="start-logo"
            src="/assets/logo.png"
            alt="Gameron"
            draggable={false}
          />
        </div>

        {/* Gameron world subtitle */}
        <p className="start-world-title">GAMERON</p>
        <p className="start-world-subtitle">
          Wie Spiele Freiheit geben — oder sie nehmen
        </p>

        {/* DS3-style CTA with oval glow */}
        <button
          className={`start-btn${hovered ? ' start-btn--lit' : ''}`}
          onClick={e => { e.stopPropagation(); handleStart() }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <span className="start-btn-oval" />
          <span className="start-btn-text">RACHE BEGINNEN</span>
        </button>

        <p className="start-hint">Beliebige Taste · Klick · oder Gamepad-Taste</p>
      </div>

      {/* DS3 menu SFX */}
      <audio ref={audioRef} src="/assets/menu-sfx.mp3" preload="auto" />
    </div>
  )
}
