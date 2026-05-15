import { useEffect, useRef } from 'react'
import { createGame } from '../game/GameEngine.js'

/**
 * Full-screen wrapper that mounts a Phaser game into a React-managed div.
 * Destroys the game instance cleanly on unmount.
 */
export default function GameScreen({ charConfig }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const game = createGame(el, charConfig)

    return () => {
      game.destroy(true, true)
    }
  }, []) // mount/unmount only — charConfig is stable at this point

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
      }}
    />
  )
}
