import { useEffect, useRef, useState, useCallback } from 'react'
import { createGame } from '../game/GameEngine.js'
import GameState      from '../game/GameState.js'
import EncounterOverlay from './EncounterOverlay.jsx'
import ClipboardOverlay from './ClipboardOverlay.jsx'
import '../styles/gallery.css'

const SCENE_LIST = [
  { key: 'WorldBuildingScene',  label: 'S1 World' },
  { key: 'PlayerGuidanceScene', label: 'S2 Castle' },
  { key: 'BannerSirenScene',    label: 'S3 Banner' },
  { key: 'WhaleQueenScene',     label: 'S4 Whale' },
  { key: 'TaskmasterScene',     label: 'S5 Task' },
  { key: 'FomoWidowScene',      label: 'S6 Fomo' },
  { key: 'GalleryScene',        label: 'Gallery' },
  { key: 'CreditsScene',        label: 'Credits' },
]

function ScenePicker() {
  const [open, setOpen] = useState(false)
  const current = new URLSearchParams(window.location.search).get('scene') || 'WorldBuildingScene'
  const pick = (key) => {
    localStorage.setItem('gameron:debugScene', key)
    const u = new URL(window.location.href)
    u.searchParams.set('scene', key)
    window.location.href = u.toString()
  }
  return (
    <div style={{ position: 'fixed', bottom: 8, right: 8, zIndex: 9999, fontFamily: 'monospace', fontSize: 11 }}>
      {open && (
        <div style={{ background: '#12091e', border: '1px solid #4a2880', padding: '6px 8px', marginBottom: 4, borderRadius: 4 }}>
          {SCENE_LIST.map(s => (
            <div key={s.key}
              onClick={() => pick(s.key)}
              style={{
                cursor: 'pointer',
                padding: '2px 6px',
                color: s.key === current ? '#cc88ff' : '#7755aa',
                background: s.key === current ? '#1e0e30' : 'transparent',
                borderRadius: 3,
                marginBottom: 1,
              }}
            >{s.label}</div>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: '#12091e', border: '1px solid #4a2880', color: '#7755aa',
          padding: '2px 8px', cursor: 'pointer', borderRadius: 3, display: 'block', width: '100%',
        }}
      >{open ? '▾ scene' : '▸ scene'}</button>
    </div>
  )
}

export default function GameScreen({ gender = 'male', onExit }) {
  const containerRef = useRef(null)
  const [galleryItem,  setGalleryItem]  = useState(null)
  const [encounter,    setEncounter]    = useState(null)
  const [videoUrl,     setVideoUrl]     = useState(null)
  const [clipboard,    setClipboard]    = useState(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    GameState.reset()
    GameState.gender = gender
    const game = createGame(el, null, gender)
    return () => { game.destroy(true, true) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onError = (event) => { console.error('[GAMERON] window error', event.error || event.message || event) }
    const onRejection = (event) => { console.error('[GAMERON] unhandled rejection', event.reason) }
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

  useEffect(() => {
    const onShow      = (e) => setGalleryItem(e.detail)
    const onEncounter = (e) => setEncounter(e.detail)
    const onGameExit  = () => { if (onExit) onExit() }
    const onVideo     = (e) => setVideoUrl(e.detail?.url)
    const onClipboard = (e) => setClipboard(e.detail)

    window.addEventListener('game:showGalleryItem', onShow)
    window.addEventListener('game:encounterChoice', onEncounter)
    window.addEventListener('game:exit',            onGameExit)
    window.addEventListener('game:showVideo',       onVideo)
    window.addEventListener('game:showClipboard',   onClipboard)
    return () => {
      window.removeEventListener('game:showGalleryItem', onShow)
      window.removeEventListener('game:encounterChoice', onEncounter)
      window.removeEventListener('game:exit',            onGameExit)
      window.removeEventListener('game:showVideo',       onVideo)
      window.removeEventListener('game:showClipboard',   onClipboard)
    }
  }, [onExit])

  const closeGallery   = useCallback(() => { setGalleryItem(null); window.dispatchEvent(new CustomEvent('game:galleryItemClosed')) }, [])
  const closeEncounter = useCallback(() => { setEncounter(null) }, [])
  const closeVideo     = useCallback(() => { setVideoUrl(null); window.dispatchEvent(new CustomEvent('game:videoClosed')) }, [])
  const closeClipboard = useCallback((result) => {
    setClipboard(null)
    window.dispatchEvent(new CustomEvent('game:clipboardResult', { detail: result }))
  }, [])

  useEffect(() => {
    if (!galleryItem) return
    const handler = (e) => { if (e.key === 'Escape') closeGallery() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [galleryItem, closeGallery])

  useEffect(() => {
    if (!videoUrl) return
    const handler = (e) => { if (e.key === 'Escape') closeVideo() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [videoUrl, closeVideo])

  return (
    <>
      <div ref={containerRef} style={{ position: 'fixed', inset: 0, overflow: 'hidden' }} />

      {galleryItem && (
        <div className="gallery-overlay" onClick={closeGallery}>
          <div className="gallery-overlay__panel" onClick={e => e.stopPropagation()}>
            <div className="gallery-overlay__title">{galleryItem.title}</div>
            <div className="gallery-overlay__content">{galleryItem.content}</div>
            <button className="gallery-overlay__close" onClick={closeGallery}>[ESC]  CLOSE</button>
          </div>
        </div>
      )}

      <EncounterOverlay encounter={encounter} onClose={closeEncounter} />

      <ClipboardOverlay data={clipboard} onClose={closeClipboard} />

      {videoUrl && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(0,0,0,0.88)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <iframe
            src={videoUrl}
            width="900" height="506"
            style={{ maxWidth: '96vw', maxHeight: '54vw', border: '2px solid #5a3c12' }}
            allow="autoplay; fullscreen"
            allowFullScreen
            title="Game Design Video"
          />
          <button
            onClick={closeVideo}
            style={{
              marginTop: '1.2rem',
              fontFamily: '"Cinzel", Georgia, serif',
              fontSize: '14px',
              color: '#c9a84c',
              background: 'transparent',
              border: '1px solid #5a3c12',
              padding: '0.5rem 1.5rem',
              cursor: 'pointer',
              letterSpacing: '0.2em',
            }}
          >
            [C] SCHLIEßEN
          </button>
        </div>
      )}

      <ScenePicker />
    </>
  )
}
