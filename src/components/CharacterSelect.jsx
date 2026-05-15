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
  const [focused, setFocused]   = useState('male')   // keyboard focus
  const [selected, setSelected] = useState(null)     // locked-in choice
  const audioRef = useRef(null)
  const firedRef = useRef(false)

  function choose(gender) {
    if (firedRef.current) return
    firedRef.current = true
    setSelected(gender)
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
      name:   'Der Krieger',
      epithet: '— letzter Sohn von Gameron —',
      lore: [
        'Sein Dorf liegt in Asche.',
        'Seine Klinge kennt keine Gnade.',
        'Er kämpft, damit kein anderer trauern muss.',
      ],
      stat1: 'Stärke ████████░░',
      stat2: 'Tempo  ██████░░░░',
      stat3: 'Wille  █████████░',
    },
    {
      gender: 'female',
      name:   'Die Kriegerin',
      epithet: '— letzte Tochter von Gameron —',
      lore: [
        'Sie hat alles verloren, was sie liebte.',
        'Trauer wurde zu Zorn — Zorn zu Stahl.',
        'Kein Preis ist zu hoch für Rache.',
      ],
      stat1: 'Stärke ███████░░░',
      stat2: 'Tempo  ████████░░',
      stat3: 'Wille  █████████░',
    },
  ]

  return (
    <div className="charsel-screen">
      <div className="charsel-bg" />

      <header className="charsel-header">
        <p className="charsel-world">GAMERON</p>
        <h1 className="charsel-title">Wähle deinen Krieger</h1>
        <p className="charsel-hint">← → oder Klick · Enter zum Bestätigen</p>
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
              {/* Portrait placeholder — replaced by asset once generated */}
              <div className="charsel-portrait">
                <div className="charsel-portrait__placeholder">
                  {card.gender === 'male' ? '⚔' : '⚔'}
                </div>
              </div>

              <div className="charsel-card-body">
                <p className="charsel-card-name">{card.name}</p>
                <p className="charsel-card-epithet">{card.epithet}</p>
                <div className="charsel-card-divider" />
                <div className="charsel-card-lore">
                  {card.lore.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
                <div className="charsel-card-divider" />
                <div className="charsel-card-stats">
                  <p>{card.stat1}</p>
                  <p>{card.stat2}</p>
                  <p>{card.stat3}</p>
                </div>
              </div>

              {isActive && !isChosen && (
                <div className="charsel-card-select-hint">[ AUSWÄHLEN ]</div>
              )}
              {isChosen && (
                <div className="charsel-card-select-hint charsel-card-select-hint--chosen">
                  ✦ GEWÄHLT ✦
                </div>
              )}
            </div>
          )
        })}
      </div>

      <audio ref={audioRef} src="/assets/menu-sfx.mp3" preload="auto" />
    </div>
  )
}
