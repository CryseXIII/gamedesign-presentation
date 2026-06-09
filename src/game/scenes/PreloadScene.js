/**
 * PreloadScene
 *
 * First scene to run.  Loads all shared game assets, shows a minimal loading
 * bar, then starts WorldBuildingScene once complete.
 *
 * Assets loaded here (available to all subsequent scenes):
 *   'hero'           — dark_fantasy_hero_sprite_sheet.png  (128 × 128 frames)
 *   'endcredits'     — endcredits.mp3
 *
 * WorldBuilding assets are loaded conditionally — missing assets are skipped
 * so the scene can render placeholder rectangles instead.
 * All assets are listed in src/game/assets/manifest.js.
 */

import Phaser from 'phaser'
import { HERO_ATLAS, RUN_ATLAS } from '../animConfig.js'
import { MANIFEST } from '../assets/manifest.js'

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

function buildRunTexture(scene) {
  if (scene.textures.exists(RUN_ATLAS.key) || !scene.textures.exists(RUN_ATLAS.sourceKey)) {
    console.info('[GAMERON] run texture skipped', {
      exists: scene.textures.exists(RUN_ATLAS.key),
      sourceExists: scene.textures.exists(RUN_ATLAS.sourceKey),
    })
    return
  }

  const sourceImage = getTextureSourceImage(scene.textures.get(RUN_ATLAS.sourceKey))
  if (!sourceImage) {
    console.warn('[GAMERON] run texture source missing')
    return
  }

  console.info('[GAMERON] building run texture', {
    sourceWidth: sourceImage.width,
    sourceHeight: sourceImage.height,
    frames: RUN_ATLAS.frameCount,
  })

  const halfWidth = Math.round(sourceImage.width / RUN_ATLAS.frameCount)
  const frames = [
    makeTrimmedFrameCanvas(sourceImage, 0, 0, halfWidth, sourceImage.height, RUN_ATLAS.frameW),
    makeTrimmedFrameCanvas(sourceImage, halfWidth, 0, halfWidth, sourceImage.height, RUN_ATLAS.frameW),
  ]

  const stripCanvas = document.createElement('canvas')
  stripCanvas.width = RUN_ATLAS.frameW * RUN_ATLAS.frameCount
  stripCanvas.height = RUN_ATLAS.frameH
  const stripCtx = stripCanvas.getContext('2d')
  stripCtx.imageSmoothingEnabled = false
  stripCtx.drawImage(frames[0], 0, 0)
  stripCtx.drawImage(frames[1], RUN_ATLAS.frameW, 0)

  const canvasTexture = scene.textures.addCanvas(RUN_ATLAS.canvasKey, stripCanvas)
  scene.textures.addSpriteSheet(RUN_ATLAS.key, canvasTexture, {
    frameWidth:  RUN_ATLAS.frameW,
    frameHeight: RUN_ATLAS.frameH,
  })

  console.info('[GAMERON] run texture ready', {
    key: RUN_ATLAS.key,
    frameWidth: RUN_ATLAS.frameW,
    frameHeight: RUN_ATLAS.frameH,
  })
}

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' })
  }

  preload() {
    const W = this.scale.width
    const H = this.scale.height

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

    // ── Shared assets (always load) ──────────────────────────────────────────
    if (!this.textures.exists('hero')) {
      this.load.spritesheet('hero', HERO_ATLAS.path, {
        frameWidth:  HERO_ATLAS.frameW,
        frameHeight: HERO_ATLAS.frameH,
      })
    }

    if (!this.cache.audio.has('endcredits')) {
      this.load.audio('endcredits', '/assets/endcredits.mp3')
    }

    if (!this.textures.exists(RUN_ATLAS.sourceKey)) {
      this.load.image(RUN_ATLAS.sourceKey, RUN_ATLAS.path)
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
    console.info('[GAMERON] preload create -> build run texture')
    buildRunTexture(this)
    this.scene.start('WorldBuildingScene')
  }
}
