import { useState, useEffect, useRef } from 'react'
import '../styles/charcreate.css'
import {
  PALETTES,
  HEAD_NAMES, BODY_NAMES, LEGS_NAMES,
  SPRITE_W, SPRITE_H,
  drawSprite,
} from '../game/spriteData.js'

const PREVIEW_SCALE = 8
const ROW_COUNT = 6 // head, body, legs, palette, gender, confirm

export default function CharacterCreate({ onConfirm }) {
  const [headIdx,    setHeadIdx]    = useState(0)
  const [bodyIdx,    setBodyIdx]    = useState(0)
  const [legsIdx,    setLegsIdx]    = useState(0)
  const [isFemale,   setIsFemale]   = useState(false)
  const [paletteIdx, setPaletteIdx] = useState(0)
  const [activeRow,  setActiveRow]  = useState(0)

  const canvasRef = useRef(null)

  // Refs so event-handler closures (set up once) always read fresh values
  const activeRowRef = useRef(0)
  const configRef    = useRef({ headIdx: 0, bodyIdx: 0, legsIdx: 0, isFemale: false, paletteIdx: 0 })

  useEffect(() => { activeRowRef.current = activeRow }, [activeRow])
  useEffect(() => {
    configRef.current = { headIdx, bodyIdx, legsIdx, isFemale, paletteIdx }
  }, [headIdx, bodyIdx, legsIdx, isFemale, paletteIdx])

  // Redraw canvas whenever appearance changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawSprite(ctx, { headIdx, bodyIdx, legsIdx, isFemale, paletteIdx }, PREVIEW_SCALE)
  }, [headIdx, bodyIdx, legsIdx, isFemale, paletteIdx])

  // Cycle an option for the given row (wraps around, 3 variants for most)
  function changeOption(delta, row) {
    if (row === 0) setHeadIdx(v    => (v + delta + 3) % 3)
    if (row === 1) setBodyIdx(v    => (v + delta + 3) % 3)
    if (row === 2) setLegsIdx(v    => (v + delta + 3) % 3)
    if (row === 3) setPaletteIdx(v => (v + delta + 3) % 3)
    if (row === 4) setIsFemale(v   => !v)
    if (row === 5) onConfirm(configRef.current)
  }

  // Keyboard navigation — empty deps, reads state via refs
  useEffect(() => {
    function onKey(e) {
      const row = activeRowRef.current
      switch (e.key) {
        case 'ArrowUp':
        case 'w': case 'W':
          e.preventDefault()
          setActiveRow(r => Math.max(0, r - 1))
          break
        case 'ArrowDown':
        case 's': case 'S':
          e.preventDefault()
          setActiveRow(r => Math.min(ROW_COUNT - 1, r + 1))
          break
        case 'ArrowLeft':
        case 'a': case 'A':
          e.preventDefault()
          changeOption(-1, row)
          break
        case 'ArrowRight':
        case 'd': case 'D':
          e.preventDefault()
          changeOption(1, row)
          break
        case 'Enter':
          e.preventDefault()
          if (row === ROW_COUNT - 1) onConfirm(configRef.current)
          else setActiveRow(r => Math.min(ROW_COUNT - 1, r + 1))
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Gamepad polling — empty deps, reads state via refs
  useEffect(() => {
    let animId
    let lastTime = 0
    const COOLDOWN = 180

    function poll() {
      animId = requestAnimationFrame(poll)
      const now = performance.now()
      if (now - lastTime < COOLDOWN) return

      const pads = navigator.getGamepads?.()
      if (!pads) return

      for (const pad of pads) {
        if (!pad) continue
        const ax = pad.axes[0] ?? 0
        const ay = pad.axes[1] ?? 0
        const row = activeRowRef.current

        const up    = pad.buttons[12]?.pressed || ay < -0.5
        const down  = pad.buttons[13]?.pressed || ay > 0.5
        const left  = pad.buttons[14]?.pressed || ax < -0.5
        const right = pad.buttons[15]?.pressed || ax > 0.5
        const aBtn  = pad.buttons[0]?.pressed

        if (!(up || down || left || right || aBtn)) break

        lastTime = now
        if (up)    setActiveRow(r => Math.max(0, r - 1))
        if (down)  setActiveRow(r => Math.min(ROW_COUNT - 1, r + 1))
        if (left)  changeOption(-1, row)
        if (right) changeOption(1, row)
        if (aBtn) {
          if (row === ROW_COUNT - 1) onConfirm(configRef.current)
          else setActiveRow(r => Math.min(ROW_COUNT - 1, r + 1))
        }
        break // use only first connected pad
      }
    }

    animId = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(animId)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const rows = [
    { label: 'HEAD',    value: HEAD_NAMES[headIdx]                    },
    { label: 'BODY',    value: BODY_NAMES[bodyIdx]                    },
    { label: 'LEGS',    value: LEGS_NAMES[legsIdx]                    },
    { label: 'PALETTE', value: PALETTES[paletteIdx].name.toUpperCase() },
    { label: 'GENDER',  value: isFemale ? 'FEMALE' : 'MALE'          },
  ]

  return (
    <div className="charcreate">
      <h2 className="charcreate__title">Character Creation</h2>

      <div className="charcreate__layout">
        {/* Pixel-art preview */}
        <canvas
          ref={canvasRef}
          width={SPRITE_W * PREVIEW_SCALE}
          height={SPRITE_H * PREVIEW_SCALE}
          className="charcreate__canvas"
        />

        {/* Selection rows */}
        <div className="charcreate__rows">
          {rows.map(({ label, value }, idx) => (
            <div
              key={idx}
              className={`charcreate__row${activeRow === idx ? ' charcreate__row--active' : ''}`}
              onClick={() => setActiveRow(idx)}
            >
              <span className="charcreate__label">{label}</span>
              <div className="charcreate__selector">
                <button
                  className="charcreate__arrow"
                  tabIndex={-1}
                  onClick={e => { e.stopPropagation(); changeOption(-1, idx) }}
                >‹</button>
                <span className="charcreate__value">{value}</span>
                <button
                  className="charcreate__arrow"
                  tabIndex={-1}
                  onClick={e => { e.stopPropagation(); changeOption(1, idx) }}
                >›</button>
              </div>
            </div>
          ))}

          {/* Confirm */}
          <div
            className={`charcreate__row charcreate__row--confirm${activeRow === 5 ? ' charcreate__row--active' : ''}`}
            onClick={() => onConfirm(configRef.current)}
          >
            <span className="charcreate__confirm-text">Confirm  ›</span>
          </div>
        </div>
      </div>

      <p className="charcreate__hint">
        Arrow keys / D-pad to navigate &nbsp;·&nbsp; Enter / A to confirm
      </p>
    </div>
  )
}
