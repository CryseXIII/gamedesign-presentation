import Phaser from 'phaser'
import GameScene from './scenes/GameScene.js'

/**
 * Creates and returns a Phaser.Game instance mounted inside `container`.
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
    backgroundColor: '#08080f',
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
    // Scenes registered dynamically after 'ready' so we can pass init data
    scene: [],
  }

  const game = new Phaser.Game(config)

  game.events.once('ready', () => {
    game.scene.add('GameScene', GameScene, true, { charConfig })
  })

  return game
}
