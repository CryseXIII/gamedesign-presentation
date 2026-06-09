import { useEffect, useRef, useState, useCallback } from 'react'
import { createGame } from '../game/GameEngine.js'
import GameState      from '../game/GameState.js'
import EncounterOverlay from './EncounterOverlay.jsx'
import '../styles/gallery.css'

/**
 * Full-screen wrapper that mounts a Phaser game into a React-managed div.
 *
 * Handles cross-boundary events from Phaser scenes:
 *   game:showGalleryItem   → opens the gallery text overlay
 *   game:encounterChoice   → opens the encounter choice overlay (EncounterOverlay)
 *   game:exit              → calls onExit (returns to title screen)
 *
 * When overlays close, dispatches the corresponding response events back to Phaser.
 */
export default function GameScreen({ gender = 'male', onExit }) {
  const containerRef = useRef(null)
  const [galleryItem,  setGalleryItem]  = useState(null)
  const [encounter,    setEncounter]    = useState(null)

  // ── Mount Phaser ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    console.info('[GAMERON] mount game screen', { gender })
    // Reset GameState so a fresh playthrough starts clean
    GameState.reset()
    GameState.gender = gender
    const game = createGame(el, null, gender)
    return () => { game.destroy(true, true) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onError = (event) => {
      console.error('[GAMERON] window error', event.error || event.message || event)
    }
    const onRejection = (event) => {
      console.error('[GAMERON] unhandled rejection', event.reason)
    }
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

  // ── Window event listeners ────────────────────────────────────────────────
  useEffect(() => {
    const onShow     = (e) => setGalleryItem(e.detail)
    const onEncounter = (e) => setEncounter(e.detail)
    const onGameExit  = () => { if (onExit) onExit() }

    window.addEventListener('game:showGalleryItem', onShow)
    window.addEventListener('game:encounterChoice', onEncounter)
    window.addEventListener('game:exit',            onGameExit)
    return () => {
      window.removeEventListener('game:showGalleryItem', onShow)
      window.removeEventListener('game:encounterChoice', onEncounter)
      window.removeEventListener('game:exit',            onGameExit)
    }
  }, [onExit])

  // ── Close gallery overlay ─────────────────────────────────────────────────
  const closeGallery = useCallback(() => {
    setGalleryItem(null)
    window.dispatchEvent(new CustomEvent('game:galleryItemClosed'))
  }, [])

  // ── Close encounter overlay ───────────────────────────────────────────────
  const closeEncounter = useCallback(() => {
    setEncounter(null)
  }, [])

  // ── Keyboard: Escape to close gallery ────────────────────────────────────
  useEffect(() => {
    if (!galleryItem) return
    const handler = (e) => { if (e.key === 'Escape') closeGallery() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [galleryItem, closeGallery])

  return (
    <>
      {/* Phaser canvas container */}
      <div ref={containerRef} style={{ position: 'fixed', inset: 0, overflow: 'hidden' }} />

      {/* Gallery overlay */}
      {galleryItem && (
        <div className="gallery-overlay" onClick={closeGallery}>
          <div className="gallery-overlay__panel" onClick={e => e.stopPropagation()}>
            <div className="gallery-overlay__title">{galleryItem.title}</div>
            <div className="gallery-overlay__content">{galleryItem.content}</div>
            <button className="gallery-overlay__close" onClick={closeGallery}>
              [ESC]  CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Encounter overlay (FOMO Widow + Gacha Store) */}
      <EncounterOverlay encounter={encounter} onClose={closeEncounter} />
    </>
  )
}
