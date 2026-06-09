/**
 * Player animation configuration.
 *
 * Each state gets its own spritesheet and animation key, namespaced by gender.
 */

export const PLAYER_FRAME_SIZE = 64

export const PLAYER_STATE_DEFS = {
  idle: {
    frameCount: 5,
    frameRate:  8,
    repeat:    -1,
    color:      0x3f6f7a,
  },
  run: {
    frameCount: 8,
    frameRate: 12,
    repeat:    -1,
    color:      0xc9a84c,
    usesFrameTextures: true,
  },
  jump: {
    frameCount: 2,
    frameRate: 10,
    repeat:    -1,
    color:      0x6b7ed6,
  },
  double_jump: {
    frameCount: 4,
    frameRate: 12,
    repeat:     0,
    color:      0x9a6be0,
  },
  attack_up: {
    frameCount: 3,
    frameRate: 12,
    repeat:     0,
    color:      0xd8903c,
  },
  attack_down: {
    frameCount: 3,
    frameRate: 12,
    repeat:     0,
    color:      0xd86b3c,
  },
  attack_left: {
    frameCount: 3,
    frameRate: 12,
    repeat:     0,
    color:      0xd86b8c,
  },
  attack_right: {
    frameCount: 3,
    frameRate: 12,
    repeat:     0,
    color:      0xd88f3c,
  },
  hurt: {
    frameCount: 4,
    frameRate: 10,
    repeat:     0,
    color:      0xf4f4f4,
  },
}

export function getPlayerTextureKey(gender, state) {
  return `player_${gender}_${state}`
}

export function getPlayerAnimationKey(gender, state) {
  return `player_${gender}_${state}`
}

export function getPlayerStateKeys(gender) {
  return Object.keys(PLAYER_STATE_DEFS).map(state => getPlayerTextureKey(gender, state))
}

export function registerPlayerAnimations(scene, gender) {
  for (const [state, def] of Object.entries(PLAYER_STATE_DEFS)) {
    const key = getPlayerAnimationKey(gender, state)
    if (scene.anims.exists(key)) continue

    const frames = def.usesFrameTextures
      ? Array.from({ length: def.frameCount }, (_, frame) => ({
          key: `${getPlayerTextureKey(gender, state)}_${frame}`,
          frame: '__BASE',
        }))
      : Array.from({ length: def.frameCount }, (_, frame) => ({
          key: getPlayerTextureKey(gender, state),
          frame,
        }))

    scene.anims.create({
      key,
      frames,
      frameRate: def.frameRate,
      repeat: def.repeat,
    })
  }
}

export const registerAnimations = registerPlayerAnimations
