import { useEffect, useRef } from 'react'
import '../styles/startscreen.css'

export default function StartScreen({ onStart }) {
  const audioRef = useRef(null)

  function handleStart() {
    // Play transition SFX if available
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }
    setTimeout(onStart, 600)
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Enter' || e.key === ' ') handleStart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="start-screen">
      {/* Background image — replace /assets/bg.jpg when available */}
      <div className="start-bg" />

      <div className="start-content">
        <p className="start-subtitle">A Presentation</p>
        <h1 className="start-title">Game Design<br />as Art</h1>
        <p className="start-meta">Dark Souls vs. Ubisoft</p>

        <button className="start-btn" onClick={handleStart}>
          PRESS START
        </button>
        <p className="start-hint">or press Enter</p>
      </div>

      {/* SFX — src replaced with real file when available */}
      <audio ref={audioRef} src="/assets/menu-sfx.mp3" preload="auto" />
    </div>
  )
}
