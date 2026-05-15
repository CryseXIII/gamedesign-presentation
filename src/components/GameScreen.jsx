import { useEffect, useRef, useState, useCallback } from 'react'
import { createGame } from '../game/GameEngine.js'
import '../styles/gallery.css'

/**
 * Full-screen wrapper that mounts a Phaser game into a React-managed div.
 *
 * Handles two cross-boundary events from Phaser scenes:
 *   game:showGalleryItem  → opens the gallery text overlay
 *   game:exit             → calls onExit (returns to title screen)
 *
 * When the overlay is closed, dispatches 'game:galleryItemClosed' back to Phaser.
 */
export default function GameScreen({ charConfig, onExit }) {
  const containerRef = useRef(null)
  const [galleryItem, setGalleryItem] = useState(null)

  // ── Mount Phaser ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const game = createGame(el, charConfig)
    return () => { game.destroy(true, true) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Window event listeners ────────────────────────────────────────────────
  useEffect(() => {
    const onShow    = (e) => setGalleryItem(e.detail)
    const onGameExit = () => { if (onExit) onExit() }

    window.addEventListener('game:showGalleryItem', onShow)
    window.addEventListener('game:exit',            onGameExit)
    return () => {
      window.removeEventListener('game:showGalleryItem', onShow)
      window.removeEventListener('game:exit',            onGameExit)
    }
  }, [onExit])

  // ── Close gallery overlay ─────────────────────────────────────────────────
  const closeGallery = useCallback(() => {
    setGalleryItem(null)
    window.dispatchEvent(new CustomEvent('game:galleryItemClosed'))
  }, [])

  // ── Keyboard: Escape to close ─────────────────────────────────────────────
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
    </>
  )
}
