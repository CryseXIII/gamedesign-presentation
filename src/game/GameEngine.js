import Phaser from 'phaser'
import PreloadScene         from './scenes/PreloadScene.js'
import WorldBuildingScene   from './scenes/WorldBuildingScene.js'
import GameScene            from './scenes/GameScene.js'
import PlayerGuidanceScene  from './scenes/PlayerGuidanceScene.js'
import GalleryScene         from './scenes/GalleryScene.js'
import CreditsScene         from './scenes/CreditsScene.js'
import GameState            from './GameState.js'

/**
 * Creates and returns a Phaser.Game instance mounted inside `container`.
 *
 * Boot order:
 *   1. PreloadScene (auto-starts) — loads all shared assets.
 *      Shows a minimal loading bar.
 *   2. WorldBuildingScene — started by PreloadScene. Scene 1.
 *   3. Remaining scenes — registered but idle; started via scene.start().
 *
 * @param {HTMLElement}  container   React ref element (100 vw × 100 vh div)
 * @param {object|null} _charConfig  Unused — kept for API compat
 * @param {'male'|'female'} gender   Player gender, stored in GameState before
 *                                   Phaser starts so scenes can read it freely.
 * @returns {Phaser.Game}
 */
export function createGame(container, _charConfig, gender = 'male') {
  // Write gender into singleton BEFORE any scene runs.
  GameState.gender = gender
  console.info('[GAMERON] createGame', { gender, width: container.clientWidth, height: container.clientHeight })

  const w = container.clientWidth  || window.innerWidth
  const h = container.clientHeight || window.innerHeight

  const config = {
    type: Phaser.AUTO,
    parent: container,
    width: w,
    height: h,
    backgroundColor: '#000000',
    render: {
      pixelArt: true,
      antialias: false,
    },
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
    game.scene.add('WorldBuildingScene', WorldBuildingScene, false)
    game.scene.add('GameScene',           GameScene,           false)
    game.scene.add('PlayerGuidanceScene', PlayerGuidanceScene, false)
    game.scene.add('GalleryScene',        GalleryScene,        false)
    game.scene.add('CreditsScene',        CreditsScene,        false)
    // PreloadScene auto-starts → WorldBuildingScene
    game.scene.add('PreloadScene',        PreloadScene,        true)
  })

  return game
}
