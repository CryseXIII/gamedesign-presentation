import { useEffect, useRef, useState, useCallback } from 'react'
import { createGame } from '../game/GameEngine.js'
import GameState      from '../game/GameState.js'
import EncounterOverlay from './EncounterOverlay.jsx'
import '../styles/gallery.css'

export default function GameScreen({ gender = 'male', onExit }) {
  const containerRef = useRef(null)
  const [galleryItem,  setGalleryItem]  = useState(null)
  const [encounter,    setEncounter]    = useState(null)
  const [videoUrl,     setVideoUrl]     = useState(null)

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

    window.addEventListener('game:showGalleryItem', onShow)
    window.addEventListener('game:encounterChoice', onEncounter)
    window.addEventListener('game:exit',            onGameExit)
    window.addEventListener('game:showVideo',       onVideo)
    return () => {
      window.removeEventListener('game:showGalleryItem', onShow)
      window.removeEventListener('game:encounterChoice', onEncounter)
      window.removeEventListener('game:exit',            onGameExit)
      window.removeEventListener('game:showVideo',       onVideo)
    }
  }, [onExit])

  const closeGallery   = useCallback(() => { setGalleryItem(null); window.dispatchEvent(new CustomEvent('game:galleryItemClosed')) }, [])
  const closeEncounter = useCallback(() => { setEncounter(null) }, [])
  const closeVideo     = useCallback(() => { setVideoUrl(null); window.dispatchEvent(new CustomEvent('game:videoClosed')) }, [])

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
            title="Half-Life"
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
            [ESC] SCHLIEßEN
          </button>
        </div>
      )}
    </>
  )
}
