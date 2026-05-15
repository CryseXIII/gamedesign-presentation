import Phaser from 'phaser'
import GameScene            from './scenes/GameScene.js'
import PlayerGuidanceScene  from './scenes/PlayerGuidanceScene.js'
import GalleryScene         from './scenes/GalleryScene.js'
import CreditsScene         from './scenes/CreditsScene.js'

/**
 * Creates and returns a Phaser.Game instance mounted inside `container`.
 *
 * All scenes are pre-registered so they can transition to each other freely.
 * Only GameScene is auto-started; the rest wait for scene.start() calls.
 *
 * @param {HTMLElement} container  The React ref element (100 vw × 100 vh div)
 * @param {object|null} charConfig Character config from CharacterCreate
 * @returns {Phaser.Game}
 */
export function createGame(container, charConfig) {
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
    // Register non-auto-start scenes first
    game.scene.add('PlayerGuidanceScene', PlayerGuidanceScene, false)
    game.scene.add('GalleryScene',        GalleryScene,        false)
    game.scene.add('CreditsScene',        CreditsScene,        false)
    // Start Room 1
    game.scene.add('GameScene', GameScene, true, { charConfig })
  })

  return game
}
