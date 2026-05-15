import Phaser from 'phaser'
import PreloadScene         from './scenes/PreloadScene.js'
import GameScene            from './scenes/GameScene.js'
import PlayerGuidanceScene  from './scenes/PlayerGuidanceScene.js'
import GalleryScene         from './scenes/GalleryScene.js'
import CreditsScene         from './scenes/CreditsScene.js'

/**
 * Creates and returns a Phaser.Game instance mounted inside `container`.
 *
 * Boot order:
 *   1. PreloadScene (auto-starts) — loads all shared assets (hero spritesheet,
 *      audio).  Shows a minimal loading bar.
 *   2. GameScene — started by PreloadScene on load complete.
 *   3. Remaining scenes — registered but idle; started via scene.start().
 *
 * @param {HTMLElement}  container   React ref element (100 vw × 100 vh div)
 * @param {object|null} _charConfig  Unused — Gameron uses a fixed hero sprite
 * @returns {Phaser.Game}
 */
export function createGame(container, _charConfig) {
  const w = container.clientWidth  || window.innerWidth
  const h = container.clientHeight || window.innerHeight

  const config = {
    type: Phaser.AUTO,
    parent: container,
    width: w,
    height: h,
    backgroundColor: '#000000',
    input: {
      gamepad: true,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 800 },
        debug: false,
      },
    },
    scene: [],
  }

  const game = new Phaser.Game(config)

  game.events.once('ready', () => {
    // Register all scenes so they can start each other freely
    game.scene.add('GameScene',           GameScene,           false)
    game.scene.add('PlayerGuidanceScene', PlayerGuidanceScene, false)
    game.scene.add('GalleryScene',        GalleryScene,        false)
    game.scene.add('CreditsScene',        CreditsScene,        false)
    // PreloadScene auto-starts and kicks off the whole chain
    game.scene.add('PreloadScene',        PreloadScene,        true)
  })

  return game
}
