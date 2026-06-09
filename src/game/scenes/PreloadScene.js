/**
 * PreloadScene
 *
 * First scene to run.  Loads all shared game assets, shows a minimal loading
 * bar, then starts WorldBuildingScene once complete.
 *
 * Assets loaded here (available to all subsequent scenes):
 *   player_<gender>_<state> sheets for the selected gender
 *   'endcredits'     — endcredits.mp3
 *
 * WorldBuilding assets are loaded conditionally — missing assets are skipped
 * so the scene can render placeholder rectangles instead.
 * All assets are listed in src/game/assets/manifest.js.
 */

import Phaser from 'phaser'
import GameState from '../GameState.js'
import {
  PLAYER_FRAME_SIZE,
  PLAYER_STATE_DEFS,
  getPlayerTextureKey,
} from '../animConfig.js'
import { MANIFEST } from '../assets/manifest.js'

function shadeColor(hex, factor) {
  const r = Math.max(0, Math.min(255, Math.round(((hex >> 16) & 0xff) * factor)))
  const g = Math.max(0, Math.min(255, Math.round(((hex >> 8) & 0xff) * factor)))
  const b = Math.max(0, Math.min(255, Math.round((hex & 0xff) * factor)))
  return (r << 16) | (g << 8) | b
}

function getTextureSourceImage(texture) {
  return texture?.getSourceImage?.() || texture?.source?.[0]?.image || null
}

function makeTrimmedFrameCanvas(image, sx, sy, sw, sh, targetSize) {
  const sourceCanvas = document.createElement('canvas')
  sourceCanvas.width = sw
  sourceCanvas.height = sh

  const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true })
  sourceCtx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh)

  const pixels = sourceCtx.getImageData(0, 0, sw, sh)
  const data = pixels.data
  const keyR = data[0]
  const keyG = data[1]
  const keyB = data[2]
  const tolerance = 36

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    if (
      Math.abs(r - keyR) <= tolerance &&
      Math.abs(g - keyG) <= tolerance &&
      Math.abs(b - keyB) <= tolerance
    ) {
      data[i + 3] = 0
    }
  }

  sourceCtx.putImageData(pixels, 0, 0)

  let minX = sw
  let minY = sh
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < sh; y += 1) {
    for (let x = 0; x < sw; x += 1) {
      const alpha = data[(y * sw + x) * 4 + 3]
      if (!alpha) continue
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = targetSize
  canvas.height = targetSize
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false

  if (maxX < 0 || maxY < 0) {
    return canvas
  }

  const cropW = maxX - minX + 1
  const cropH = maxY - minY + 1
  const scale = Math.min(targetSize / cropW, targetSize / cropH)
  const drawW = Math.max(1, Math.round(cropW * scale))
  const drawH = Math.max(1, Math.round(cropH * scale))
  const dx = Math.floor((targetSize - drawW) / 2)
  const dy = Math.floor((targetSize - drawH) / 2)

  ctx.clearRect(0, 0, targetSize, targetSize)
  ctx.drawImage(sourceCanvas, minX, minY, cropW, cropH, dx, dy, drawW, drawH)
  return canvas
}

function buildRunFrameTextures(scene, gender, sourceKey) {
  const baseKey = `player_${gender}_run`
  const firstFrameKey = `${baseKey}_0`

  if (scene.textures.exists(firstFrameKey) || !scene.textures.exists(sourceKey)) {
    console.info('[GAMERON] run texture skipped', {
      key: baseKey,
      exists: scene.textures.exists(firstFrameKey),
      sourceExists: scene.textures.exists(sourceKey),
    })
    return
  }

  const sourceImage = getTextureSourceImage(scene.textures.get(sourceKey))
  if (!sourceImage) {
    console.warn('[GAMERON] run texture source missing', { sourceKey })
    return
  }

  const cols = 4
  const rows = 2
  const tileW = Math.floor(sourceImage.width / cols)
  const tileH = Math.floor(sourceImage.height / rows)
  const frames = []

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      frames.push(
        makeTrimmedFrameCanvas(
          sourceImage,
          col * tileW,
          row * tileH,
          tileW,
          tileH,
          PLAYER_FRAME_SIZE,
        )
      )
    }
  }

  frames.forEach((frameCanvas, index) => {
    const frameKey = `${baseKey}_${index}`
    scene.textures.addCanvas(frameKey, frameCanvas)
  })

  console.info('[GAMERON] run texture ready', { key: baseKey, sourceKey, frames: frames.length })
}

function buildPlaceholderPlayerTexture(scene, textureKey, state, def) {
  const canvas = document.createElement('canvas')
  canvas.width = PLAYER_FRAME_SIZE * def.frameCount
  canvas.height = PLAYER_FRAME_SIZE

  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false

  for (let frame = 0; frame < def.frameCount; frame += 1) {
    const x = frame * PLAYER_FRAME_SIZE
    const fillColor = shadeColor(def.color, 0.82 + (frame * 0.08))
    const accentColor = shadeColor(def.color, 1.12 - (frame * 0.04))

    ctx.fillStyle = `#${fillColor.toString(16).padStart(6, '0')}`
    ctx.fillRect(x, 0, PLAYER_FRAME_SIZE, PLAYER_FRAME_SIZE)

    ctx.strokeStyle = `#${accentColor.toString(16).padStart(6, '0')}`
    ctx.lineWidth = 2
    ctx.strokeRect(x + 2, 2, PLAYER_FRAME_SIZE - 4, PLAYER_FRAME_SIZE - 4)

    ctx.fillStyle = '#00000055'
    ctx.fillRect(x + 10, 18, PLAYER_FRAME_SIZE - 20, 28)

    ctx.fillStyle = '#ffffffcc'
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(state, x + PLAYER_FRAME_SIZE / 2, 39)
  }

  const canvasKey = `${textureKey}_canvas`
  const canvasTexture = scene.textures.addCanvas(canvasKey, canvas)
  scene.textures.addSpriteSheet(textureKey, canvasTexture, {
    frameWidth:  PLAYER_FRAME_SIZE,
    frameHeight: PLAYER_FRAME_SIZE,
  })
}

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' })
  }

  preload() {
    const W = this.scale.width
    const H = this.scale.height
    const gender = GameState.gender || 'male'

    // ── Loading bar ──────────────────────────────────────────────────────────
    const barW = Math.min(W * 0.5, 400)
    const barH = 4
    const barX = (W - barW) / 2
    const barY = H / 2

    this.add
      .text(W / 2, barY - 28, 'LOADING', {
        fontFamily: '"Cinzel", Georgia, serif',
        fontSize:   '13px',
        color:      '#5a4520',
      })
      .setOrigin(0.5)

    // Track background
    this.add
      .rectangle(W / 2, barY, barW, barH, 0x1a1612)
      .setOrigin(0.5)

    // Progress fill (grows left → right)
    const fill = this.add
      .rectangle(barX, barY, 0, barH, 0xc9a84c)
      .setOrigin(0, 0.5)

    this.load.on('progress', (v) => {
      fill.width = barW * v
    })

    if (!this.cache.audio.has('endcredits')) {
      this.load.audio('endcredits', '/assets/endcredits.mp3')
    }

    // ── Player sheets for the selected gender ───────────────────────────────
    const playerAssets = Object.values(MANIFEST).filter(
      asset => asset.id.startsWith(`player_${gender}_`) && asset.status === 'loaded'
    )

    for (const asset of playerAssets) {
      if (asset.id === `player_${gender}_run`) {
        const sourceKey = `${asset.key}_source`
        if (!this.textures.exists(sourceKey)) {
          this.load.image(sourceKey, asset.path)
        }
        continue
      }

      if (!this.textures.exists(asset.key)) {
        this.load.spritesheet(asset.key, asset.path, {
          frameWidth:  asset.frameConfig?.frameWidth  || PLAYER_FRAME_SIZE,
          frameHeight: asset.frameConfig?.frameHeight || PLAYER_FRAME_SIZE,
        })
      }
    }

    // ── WorldBuilding assets (load only if status === 'loaded') ──────────────
    // New assets start as 'missing' in the manifest.  Once the PNG/MP3 files
    // are placed in public/assets/scenes/wb/ and the manifest is updated to
    // 'loaded', they will be loaded automatically here.
    const wbAssets = Object.values(MANIFEST).filter(
      a => a.status === 'loaded' && a.id.startsWith('wb_')
    )
    for (const asset of wbAssets) {
      if (asset.type === 'image' && !this.textures.exists(asset.key)) {
        this.load.image(asset.key, asset.path)
      }
      if (asset.type === 'spritesheet' && !this.textures.exists(asset.key)) {
        this.load.spritesheet(asset.key, asset.path, asset.frameConfig)
      }
      if (asset.type === 'audio' && !this.cache.audio.has(asset.key)) {
        this.load.audio(asset.key, asset.path)
      }
    }
  }

  create() {
    const gender = GameState.gender || 'male'
    console.info('[GAMERON] preload create -> build player placeholders', { gender })

    if (gender === 'male') {
      buildRunFrameTextures(this, gender, `player_${gender}_run_source`)
    }

    for (const [state, def] of Object.entries(PLAYER_STATE_DEFS)) {
      const textureKey = getPlayerTextureKey(gender, state)
      if (state === 'run' && this.textures.exists(`${textureKey}_0`)) continue
      if (this.textures.exists(textureKey)) continue
      buildPlaceholderPlayerTexture(this, textureKey, state, def)
    }

    this.scene.start('WorldBuildingScene')
  }
}
