// ─── Sprite constants ──────────────────────────────────────────────────────
export const SPRITE_W = 12
export const SPRITE_H = 20
export const HEAD_H   = 6
export const BODY_H   = 8
export const LEGS_H   = 6

// ─── Color palettes ────────────────────────────────────────────────────────
// colors[0]=transparent, [1]=skin, [2]=primary, [3]=secondary, [4]=dark/outline
export const PALETTES = [
  { name: 'Knight',     colors: ['transparent', '#e8c8a0', '#8a8a9a', '#c8c8e8', '#1a1a2a'] },
  { name: 'Thief',      colors: ['transparent', '#e0b890', '#3a2810', '#6a4820', '#101008'] },
  { name: 'Pyromancer', colors: ['transparent', '#c8906a', '#881010', '#d86010', '#180808'] },
]

// ─── Head variants (6 rows × 12 cols = 72 values) ─────────────────────────
// 0=transparent, 1=skin, 2=primary, 3=secondary, 4=dark
export const HEADS = [
  // 0: Helm
  [
    0,0,0,0,4,4,4,0,0,0,0,0,
    0,0,0,4,2,2,2,4,0,0,0,0,
    0,0,4,2,2,2,2,2,4,0,0,0,
    0,0,4,3,3,3,3,3,4,0,0,0,
    0,0,4,2,1,1,1,2,4,0,0,0,
    0,0,0,4,4,4,4,4,0,0,0,0,
  ],
  // 1: Hood
  [
    0,0,2,2,2,2,2,2,0,0,0,0,
    0,2,2,2,2,2,2,2,2,0,0,0,
    0,2,2,1,1,1,1,2,2,0,0,0,
    0,2,4,1,4,1,4,1,2,0,0,0,
    0,2,2,1,1,1,1,2,2,0,0,0,
    0,0,4,2,2,2,2,4,0,0,0,0,
  ],
  // 2: Bare face
  [
    0,0,0,3,3,3,3,3,0,0,0,0,
    0,0,4,3,1,1,1,3,4,0,0,0,
    0,0,4,1,1,1,1,1,4,0,0,0,
    0,0,4,1,4,1,4,1,4,0,0,0,
    0,0,4,1,1,4,1,1,4,0,0,0,
    0,0,0,4,4,4,4,4,0,0,0,0,
  ],
]

// ─── Body variants (8 rows × 12 cols = 96 values) ─────────────────────────
export const BODIES = [
  // 0: Plate armor
  [
    0,0,4,4,2,2,2,2,4,4,0,0,
    0,0,4,2,2,2,2,2,2,4,0,0,
    0,4,2,2,3,2,2,3,2,2,4,0,
    0,4,2,2,2,3,3,2,2,2,4,0,
    0,4,1,2,2,2,2,2,2,1,4,0,
    0,4,1,3,3,3,3,3,3,1,4,0,
    0,0,4,2,2,2,2,2,4,0,0,0,
    0,0,0,1,0,0,0,1,0,0,0,0,
  ],
  // 1: Light armor
  [
    0,0,4,4,2,2,2,2,4,4,0,0,
    0,0,4,1,2,2,2,2,1,4,0,0,
    0,4,1,2,2,3,3,2,2,1,4,0,
    0,4,1,2,2,2,2,2,2,1,4,0,
    0,4,1,2,3,2,2,3,2,1,4,0,
    0,4,1,3,3,3,3,3,3,1,4,0,
    0,0,4,2,2,2,2,2,4,0,0,0,
    0,0,0,1,0,0,0,1,0,0,0,0,
  ],
  // 2: Robe
  [
    0,0,4,4,2,2,2,2,4,4,0,0,
    0,0,4,2,2,2,2,2,2,4,0,0,
    0,4,1,2,2,2,2,2,2,1,4,0,
    0,3,2,2,3,2,2,3,2,2,3,0,
    0,4,2,2,2,2,2,2,2,2,4,0,
    0,4,2,3,2,3,2,3,2,2,4,0,
    0,0,4,2,2,2,2,2,4,0,0,0,
    0,0,0,1,0,0,0,1,0,0,0,0,
  ],
]

// ─── Female modification ───────────────────────────────────────────────────
// Adds two small skin-coloured pixels outside the chest silhouette as a gag.
// Format: [rowInBody, col, colorIndex]
const CHEST_MOD = [[1,0,1],[1,11,1],[2,0,1],[2,11,1]]
export const FEMALE_MODS = [CHEST_MOD, CHEST_MOD, CHEST_MOD]

// ─── Legs variants (6 rows × 12 cols = 72 values) ─────────────────────────
export const LEGS = [
  // 0: Greaves (plate)
  [
    0,0,0,4,2,4,4,2,4,0,0,0,
    0,0,0,4,2,4,4,2,4,0,0,0,
    0,0,0,4,2,4,4,2,4,0,0,0,
    0,0,0,4,2,4,4,2,4,0,0,0,
    0,0,0,4,3,4,4,3,4,0,0,0,
    0,0,0,4,3,4,4,3,4,0,0,0,
  ],
  // 1: Leather pants
  [
    0,0,0,4,2,4,4,2,4,0,0,0,
    0,0,0,4,2,4,4,2,4,0,0,0,
    0,0,0,4,2,4,4,2,4,0,0,0,
    0,0,0,4,2,4,4,2,4,0,0,0,
    0,0,0,4,3,4,4,3,4,0,0,0,
    0,0,0,0,3,0,0,3,0,0,0,0,
  ],
  // 2: Robe skirt
  [
    0,0,4,2,2,2,2,2,2,4,0,0,
    0,4,2,2,2,2,2,2,2,2,4,0,
    0,4,2,3,2,2,2,3,2,2,4,0,
    0,4,2,2,3,2,2,2,3,2,4,0,
    0,4,3,2,2,3,3,2,2,3,4,0,
    0,0,4,4,4,4,4,4,4,4,0,0,
  ],
]

// ─── UI labels ────────────────────────────────────────────────────────────
export const HEAD_NAMES = ['HELM', 'HOOD', 'BARE']
export const BODY_NAMES = ['PLATE', 'LEATHER', 'ROBE']
export const LEGS_NAMES = ['GREAVES', 'PANTS', 'SKIRT']

// ─── Utilities ────────────────────────────────────────────────────────────

/**
 * Returns a copy of a body array with the female chest modification applied.
 */
export function applyFemaleMod(body, bodyIdx) {
  const out = [...body]
  for (const [row, col, val] of FEMALE_MODS[bodyIdx]) {
    out[row * SPRITE_W + col] = val
  }
  return out
}

/**
 * Draws the assembled character onto a 2D canvas context.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ headIdx, bodyIdx, legsIdx, isFemale, paletteIdx }} charConfig
 * @param {number} scale  pixels per sprite-pixel (default 8)
 */
export function drawSprite(ctx, charConfig, scale = 8) {
  const { headIdx = 0, bodyIdx = 0, legsIdx = 0, isFemale = false, paletteIdx = 0 } = charConfig ?? {}
  const colors = PALETTES[paletteIdx].colors

  const bodyData = isFemale
    ? applyFemaleMod(BODIES[bodyIdx], bodyIdx)
    : BODIES[bodyIdx]

  const parts = [
    { data: HEADS[headIdx], rowOff: 0 },
    { data: bodyData,       rowOff: HEAD_H },
    { data: LEGS[legsIdx],  rowOff: HEAD_H + BODY_H },
  ]

  for (const { data, rowOff } of parts) {
    for (let i = 0; i < data.length; i++) {
      const ci = data[i]
      if (ci === 0) continue
      const row = Math.floor(i / SPRITE_W)
      const col = i % SPRITE_W
      ctx.fillStyle = colors[ci]
      ctx.fillRect(col * scale, (row + rowOff) * scale, scale, scale)
    }
  }
}
