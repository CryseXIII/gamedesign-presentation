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
  const tolerance = 48

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    const isKeyGreen = g > 140 && g > r + 40 && g > b + 40
    const isKeyMatch =
      Math.abs(r - keyR) <= tolerance &&
      Math.abs(g - keyG) <= tolerance &&
      Math.abs(b - keyB) <= tolerance

    if (isKeyMatch || isKeyGreen) {
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
  const texKey = `player_${gender}_run`

  if (scene.textures.exists(texKey) || !scene.textures.exists(sourceKey)) {
    console.info('[GAMERON] run texture skipped', {
      key: texKey,
      exists: scene.textures.exists(texKey),
      sourceExists: scene.textures.exists(sourceKey),
    })
    return
  }

  const sourceImage = getTextureSourceImage(scene.textures.get(sourceKey))
  if (!sourceImage) {
    console.warn('[GAMERON] run texture source missing', { sourceKey })
    return
  }

  const cols  = 4
  const rows  = 2
  const tileW = Math.floor(sourceImage.width  / cols)
  const tileH = Math.floor(sourceImage.height / rows)
  const FRAME = PLAYER_FRAME_SIZE
  const total = cols * rows

  // Build one wide spritesheet canvas — all frames side by side
  const sheet    = document.createElement('canvas')
  sheet.width    = FRAME * total
  sheet.height   = FRAME
  const sheetCtx = sheet.getContext('2d')
  sheetCtx.imageSmoothingEnabled = false

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx         = row * cols + col
      const frameCanvas = makeTrimmedFrameCanvas(sourceImage, col * tileW, row * tileH, tileW, tileH, FRAME)
      sheetCtx.drawImage(frameCanvas, idx * FRAME, 0, FRAME, FRAME)
    }
  }

  scene.textures.addSpriteSheet(texKey, sheet, {
    frameWidth:  FRAME,
    frameHeight: FRAME,
  })

  console.info('[GAMERON] run texture ready', { key: texKey, sourceKey, frames: total })
}

function buildPlaceholderPlayerTexture(scene, textureKey, state, def) {
  const canvas = document.createElement('canvas')
  canvas.width  = PLAYER_FRAME_SIZE * def.frameCount
  canvas.height = PLAYER_FRAME_SIZE

  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false

  const S = PLAYER_FRAME_SIZE
  const isRun    = state === 'run'
  const isJump   = state === 'jump' || state === 'double_jump'
  const isAttack = state.startsWith('attack')
  const isHurt   = state === 'hurt'

  for (let frame = 0; frame < def.frameCount; frame += 1) {
    const ox = frame * S
    // animate: alternate slight shifts per frame for a sense of motion
    const bob = (frame % 2 === 0) ? 0 : (isRun ? 2 : 0)

    // transparent background
    ctx.clearRect(ox, 0, S, S)

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)'
    ctx.fillEllipse ? ctx.fillEllipse(ox + S/2, S - 6 + bob, 26, 8)
      : (() => { ctx.beginPath(); ctx.ellipse(ox + S/2, S - 6 + bob, 13, 4, 0, 0, Math.PI * 2); ctx.fill() })()

    // legs
    const legColor = isHurt ? '#555' : '#1c1a24'
    ctx.fillStyle = legColor
    ctx.fillRect(ox + 18, 38 + bob, 10, 18)  // left leg
    ctx.fillRect(ox + 36, 38 + bob, 10, 18)  // right leg

    // torso
    const torsoColor = isHurt ? '#888' : (isAttack ? '#4a1a2a' : '#2a2636')
    ctx.fillStyle = torsoColor
    ctx.fillRect(ox + 14, 18 + bob, 36, 22)

    // arms
    const armOff = isAttack ? (state.includes('right') ? 12 : (state.includes('left') ? -12 : 0)) : 0
    ctx.fillStyle = '#1e1c28'
    ctx.fillRect(ox + 4 + armOff,  22 + bob, 12, 14)  // left arm
    ctx.fillRect(ox + 48 - armOff, 22 + bob, 12, 14)  // right arm

    // head
    const headY = isJump ? (8 + bob - 6) : (8 + bob)
    ctx.fillStyle = '#28243a'
    ctx.fillRect(ox + 22, headY, 20, 18)

    // eyes
    ctx.fillStyle = isHurt ? '#ff4444' : (isAttack ? '#ffaa00' : '#c8a8ff')
    ctx.fillRect(ox + 24, headY + 5, 5, 4)
    ctx.fillRect(ox + 34, headY + 5, 5, 4)

    // weapon hint for attack states
    if (isAttack) {
      ctx.fillStyle = '#c8a84c'
      if (state.includes('right')) ctx.fillRect(ox + 52, 16 + bob, 8, 28)
      else if (state.includes('left'))  ctx.fillRect(ox + 4,  16 + bob, 8, 28)
      else if (state.includes('up'))    ctx.fillRect(ox + 28, 0,        8, 22)
      else                              ctx.fillRect(ox + 28, 36 + bob, 8, 22)
    }
  }

  const canvasKey     = `${textureKey}_canvas`
  scene.textures.addSpriteSheet(textureKey, canvas, {
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

    if (!this.textures.exists('gm_main_male_run')) {
      this.load.image('gm_main_male_run', '/assets/gm_main_male_run.png')
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

    // ── All other 'loaded' image assets (pgs_, gm_, etc.) ───────────────────
    const SKIP_PREFIXES = ['wb_', 'player_', 'charsel_', 'gm_main_male_run']
    const otherAssets = Object.values(MANIFEST).filter(a =>
      a.status === 'loaded' &&
      a.type   === 'image'  &&
      a.key    !== null     &&
      !SKIP_PREFIXES.some(p => a.id.startsWith(p))
    )
    for (const asset of otherAssets) {
      if (!this.textures.exists(asset.key)) {
        this.load.image(asset.key, asset.path)
      }
    }
  }

  create() {
    const gender = GameState.gender || 'male'
    console.info('[GAMERON] preload create -> build player placeholders', { gender })

    buildRunFrameTextures(this, 'male', 'gm_main_male_run')
    buildRunFrameTextures(this, 'female', 'gm_main_male_run')

    for (const [state, def] of Object.entries(PLAYER_STATE_DEFS)) {
      const textureKey = getPlayerTextureKey(gender, state)
      if (this.textures.exists(textureKey)) continue
      buildPlaceholderPlayerTexture(this, textureKey, state, def)
    }

    // Apply bilinear filter to all photorealistic scene images
    // (pixelArt: true sets global NEAREST; scene images need LINEAR)
    const PHOTO_PREFIXES = ['pgs_', 'bs_bg', 'wq_', 'tm_', 'fw_', 'credits_', 'wb_bg', 'wb_speedup', 'wb_fomo', 'wb_portrait']
    Object.values(MANIFEST).forEach(a => {
      if (a.key && a.status === 'loaded' && a.type === 'image') {
        if (PHOTO_PREFIXES.some(p => a.id.startsWith(p))) {
          try {
            if (this.textures.exists(a.key)) {
              this.textures.get(a.key).setFilter(Phaser.Textures.FilterMode.LINEAR)
            }
          } catch {}
        }
      }
    })

    const debugScene = getDebugScene()
    this.scene.start(debugScene || 'WorldBuildingScene')
  }
}

/** Returns the debug start scene from URL param ?scene=X or localStorage. */
export function getDebugScene() {
  const VALID = [
    'WorldBuildingScene', 'PlayerGuidanceScene', 'BannerSirenScene',
    'WhaleQueenScene', 'TaskmasterScene', 'FomoWidowScene',
    'GalleryScene', 'CreditsScene',
  ]
  const urlParam = new URLSearchParams(window.location.search).get('scene')
  const stored   = localStorage.getItem('gameron:debugScene')
  const candidate = urlParam || stored
  return VALID.includes(candidate) ? candidate : null
}
