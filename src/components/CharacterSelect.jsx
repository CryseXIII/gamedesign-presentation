import { useState, useEffect, useRef } from 'react'
import '../styles/characterselect.css'

/**
 * CharacterSelect
 *
 * DS3-style character selection screen.
 * Two large vertical cards: male warrior (left) and female warrior (right).
 * Hovering lights up the card with an amber glow.
 * Clicking (or pressing A / D / arrow keys + Enter) selects that gender and
 * calls onStart(gender).
 *
 * @param {{ onStart: (gender: 'male'|'female') => void }} props
 */
export default function CharacterSelect({ onStart }) {
  const [focused, setFocused]         = useState('male')   // keyboard focus
  const [selected, setSelected]       = useState(null)     // locked-in choice
  const [imgFailed, setImgFailed]     = useState({})       // { male: true } if img 404
  const audioRef = useRef(null)
  const firedRef = useRef(false)

  function handleImgError(gender) {
    setImgFailed(prev => prev[gender] ? prev : { ...prev, [gender]: true })
  }

  function choose(gender) {
    if (firedRef.current) return
    firedRef.current = true
    setSelected(gender)
    // Clear any debug scene so CharacterSelect always starts at scene 1
    localStorage.removeItem('gameron:debugScene')
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }
    setTimeout(() => onStart(gender), 700)
  }

  // Keyboard navigation
  useEffect(() => {
    function onKey(e) {
      if (firedRef.current) return
      if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') setFocused('male')
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') setFocused('female')
      if (e.key === 'Enter' || e.key === ' ')  choose(focused)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focused])

  // Gamepad poll
  useEffect(() => {
    const id = setInterval(() => {
      if (firedRef.current) { clearInterval(id); return }
      for (const gp of navigator.getGamepads()) {
        if (!gp) continue
        // D-pad left / axis left → focus male
        if (gp.buttons[14]?.pressed || (gp.axes[0] ?? 0) < -0.4) setFocused('male')
        // D-pad right / axis right → focus female
        if (gp.buttons[15]?.pressed || (gp.axes[0] ?? 0) >  0.4) setFocused('female')
        // A button (0) → confirm
        if (gp.buttons[0]?.pressed) { choose(focused); clearInterval(id); return }
      }
    }, 100)
    return () => clearInterval(id)
  }, [focused])

  const cards = [
    {
      gender: 'male',
      label:  'Männlich',
      portrait: '/assets/charsel_portrait_male.png',
    },
    {
      gender: 'female',
      label:  'Weiblich',
      portrait: '/assets/charsel_portrait_female.png',
    },
  ]

  return (
    <div className="charsel-screen">
      <div className="charsel-bg" />

      <header className="charsel-header">
        <h1 className="charsel-title">Wähle dein Geschlecht</h1>
      </header>

      <div className="charsel-cards">
        {cards.map(card => {
          const isActive = focused === card.gender
          const isChosen = selected === card.gender
          return (
            <div
              key={card.gender}
              className={[
                'charsel-card',
                isActive  ? 'charsel-card--active'  : '',
                isChosen  ? 'charsel-card--chosen'  : '',
              ].join(' ')}
              onMouseEnter={() => setFocused(card.gender)}
              onClick={() => choose(card.gender)}
            >
              {isActive && !isChosen && (
                <div className="charsel-card-select-hint">[ AUSWÄHLEN ]</div>
              )}
              {isChosen && (
                <div className="charsel-card-select-hint charsel-card-select-hint--chosen">
                  ✦ GEWÄHLT ✦
                </div>
              )}

              <div className="charsel-portrait">
                {imgFailed[card.gender] ? (
                  <div className="charsel-portrait__placeholder">⚔</div>
                ) : (
                  <img
                    src={card.portrait}
                    alt={card.label}
                    draggable="false"
                    onError={() => handleImgError(card.gender)}
                  />
                )}
                <div className="charsel-portrait__label">{card.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      <audio ref={audioRef} src="/assets/menu-sfx.mp3" preload="auto" />
    </div>
  )
}
