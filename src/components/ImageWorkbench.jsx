import { useEffect, useMemo, useRef, useState } from 'react'
import '../styles/workbench.css'

const DEFAULT_ORCHESTRATOR_URL = 'https://sd-orchestrator.gamedesign.152.53.117.246.sslip.io'
const DEFAULT_NOTIFICATION_URL = ''
const SAMPLE_BASE_IMAGE = '/assets/gm_bg_training_arena.png'
const SAMPLE_EXCERPT = `The warrior studies the image, then marks one specific region for repair while keeping the rest of the scene's mood, color, and composition intact.`
const SAMPLE_ANALYSIS = `Base image: preserve the full composition and atmosphere. Target 1 should be the visible error area. Use the attachments as strict visual reference, not as loose inspiration.`
const SAMPLE_SD_PROMPT = `sharp high-resolution image, cinematic lighting, coherent anatomy, strong composition, preserve atmosphere, fix only the marked area, no extra limbs, no blur, no text, no watermark`
const COLOR_PALETTE = ['#ff4d4d', '#ff9f43', '#feca57', '#1dd1a1', '#54a0ff', '#5f27cd', '#ff6b81', '#00d2d3', '#2ecc71', '#e056fd', '#7bed9f', '#ff9ff3']
const DEFAULT_GRID_SIZE = 8
const LOCAL_MODELS = [
  { title: 'albedobaseXL_v13.safetensors', name: 'albedobaseXL_v13.safetensors', hash: '', alias: '' },
  { title: 'ponyDiffusionV6XL_v6StartWithThisOne.safetensors', name: 'ponyDiffusionV6XL_v6StartWithThisOne.safetensors', hash: '', alias: '' },
  { title: 'Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors', name: 'Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors', hash: '', alias: '' },
]

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `id_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function safeText(value, fallback = '') {
  const text = value === null || value === undefined ? '' : String(value)
  return text.trim() || fallback
}

function dataUrlToBase64(dataUrl) {
  return safeText(dataUrl).replace(/^data:[^;]+;base64,/, '')
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

async function cropImage(src, rect) {
  if (!src || !rect?.w || !rect?.h) return ''
  const img = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(rect.w))
  canvas.height = Math.max(1, Math.round(rect.h))
  const ctx = canvas.getContext('2d')
  ctx.drawImage(
    img,
    Math.round(rect.x),
    Math.round(rect.y),
    Math.round(rect.w),
    Math.round(rect.h),
    0,
    0,
    canvas.width,
    canvas.height,
  )
  return canvas.toDataURL('image/png')
}

async function mergeImageAtRect(baseSrc, overlaySrc, rect) {
  if (!baseSrc || !overlaySrc || !rect?.w || !rect?.h) return ''
  const [baseImage, overlayImage] = await Promise.all([loadImage(baseSrc), loadImage(overlaySrc)])
  const canvas = document.createElement('canvas')
  canvas.width = baseImage.naturalWidth
  canvas.height = baseImage.naturalHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(baseImage, 0, 0)
  ctx.drawImage(
    overlayImage,
    0,
    0,
    overlayImage.naturalWidth,
    overlayImage.naturalHeight,
    Math.round(rect.x),
    Math.round(rect.y),
    Math.round(rect.w),
    Math.round(rect.h),
  )
  return canvas.toDataURL('image/png')
}

function buildGridLabel(row, col) {
  let n = col + 1
  let label = ''
  while (n > 0) {
    const mod = (n - 1) % 26
    label = String.fromCharCode(65 + mod) + label
    n = Math.floor((n - mod - 1) / 26)
  }
  return `${label}${row + 1}`
}

function createTarget(index, color) {
  return {
    id: makeId(),
    label: `Edit ${index}`,
    color,
    instruction: '',
    note: '',
    enabled: true,
  }
}

function createInitialTargets() {
  return [createTarget(1, COLOR_PALETTE[0])]
}

async function fetchJson(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } finally {
    window.clearTimeout(timer)
  }
}

function useStorageState(key, fallback) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return fallback
    const stored = window.localStorage.getItem(key)
    return stored === null ? fallback : stored
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, value)
  }, [key, value])

  return [value, setValue]
}

function makePromptBundle({
  excerpt,
  analysis,
  sdPrompt,
  selectedModel,
  loras,
  cropRect,
  baseImage,
  cutoutImage,
  targets,
  attachments,
}) {
  const enabledLoras = loras.filter((lora) => lora.enabled)
  const targetLines = targets.map((target, index) => {
    const chunks = [`${index + 1}. ${target.label}`, `color=${target.color}`]
    if (target.instruction) chunks.push(`instruction=${target.instruction}`)
    if (target.note) chunks.push(`note=${target.note}`)
    return chunks.join(' | ')
  })

  const attachmentLines = attachments.map((item, index) => `${index + 1}. ${item.name || `Reference ${index + 1}`}`)

  const modelLine = selectedModel ? `Preferred model: ${selectedModel}` : 'Preferred model: auto (orchestrator chooses from installed checkpoints)'
  const loraLine = enabledLoras.length
    ? enabledLoras.map((lora) => `${lora.name}:${lora.weight.toFixed(2)}`).join(', ')
    : 'none'

  const strictPrompt = [
    'Edit job for a high-fidelity image pipeline.',
    modelLine,
    `LoRAs: ${loraLine}`,
    `Source excerpt: ${excerpt}`,
    `Analysis: ${analysis}`,
    `SD prompt: ${sdPrompt}`,
    `Base image: ${baseImage ? `${baseImage.width}x${baseImage.height}` : 'none'}`,
    cropRect ? `Crop rect: x=${Math.round(cropRect.x)} y=${Math.round(cropRect.y)} w=${Math.round(cropRect.w)} h=${Math.round(cropRect.h)}` : 'Crop rect: none',
    cutoutImage ? `Cutout image: ${cutoutImage.width}x${cutoutImage.height}` : 'Cutout image: none',
    `Edit targets:\n${targetLines.join('\n') || 'none'}`,
    attachmentLines.length ? `Reference attachments:\n${attachmentLines.join('\n')}` : 'Reference attachments: none',
    'Preserve the original art style, themes, color palette, lighting, and atmosphere from the base image.',
    'Edit only the marked areas and keep everything else stable unless a merge checkpoint is explicitly approved.',
    'Return a clean, sharp, approval-ready candidate or a precise edit plan if the workflow is agent-based.',
  ].join('\n\n')

  const naturalPrompt = [
    'You are preparing an image-edit job that must be strict and precise.',
    'Preserve the overall look of the original image.',
    'Only change the marked edit targets and keep all other regions stable.',
    `Source excerpt:\n${excerpt}`,
    `Analysis:\n${analysis}`,
    `Prompt draft:\n${sdPrompt}`,
    `Edit targets:\n${targetLines.join('\n') || 'none'}`,
    attachmentLines.length ? `Reference images:\n${attachmentLines.join('\n')}` : '',
    selectedModel ? `Pinned model: ${selectedModel}` : 'Pinned model: none, orchestrator may choose automatically.',
  ].filter(Boolean).join('\n\n')

  const agentPrompt = [
    'Agent task: build a strict image-edit plan and keep the job non-blocking.',
    `Preferred model: ${selectedModel || 'auto'}`,
    `LoRAs: ${loraLine}`,
    'Stages:',
    '1. Read the excerpt and summarize the image goal.',
    '2. Identify the base image, cutout region, and edit-map targets.',
    '3. Build the edit prompt and any inpaint/merge instructions.',
    '4. Render a preview, wait for approval, then checkpoint the approved version.',
    '5. Merge approved cutouts back into the base image checkpoint.',
    'Progress notifications must continue until the user approves or regenerates.',
    `Crop context: ${cropRect ? JSON.stringify({ x: Math.round(cropRect.x), y: Math.round(cropRect.y), w: Math.round(cropRect.w), h: Math.round(cropRect.h) }) : 'none'}`,
    `Attachment count: ${attachments.length}`,
  ].join('\n')

  const jobSpec = {
    mode: 'image-workbench',
    excerpt,
    analysis,
    selected_model_title: selectedModel || null,
    selected_loras: enabledLoras.map((lora) => ({ name: lora.name, weight: lora.weight })),
    crop_rect: cropRect ? { x: Math.round(cropRect.x), y: Math.round(cropRect.y), w: Math.round(cropRect.w), h: Math.round(cropRect.h) } : null,
    base_image: baseImage ? { width: baseImage.width, height: baseImage.height, name: baseImage.name || 'base' } : null,
    cutout_image: cutoutImage ? { width: cutoutImage.width, height: cutoutImage.height, name: cutoutImage.name || 'cutout' } : null,
    targets: targets.map((target) => ({
      id: target.id,
      label: target.label,
      color: target.color,
      instruction: target.instruction,
      note: target.note,
      enabled: target.enabled,
    })),
    references: attachments.map((item, index) => ({ index: index + 1, name: item.name, kind: item.kind || 'reference' })),
    prompts: {
      sd: sdPrompt,
      natural: naturalPrompt,
      agent: agentPrompt,
      strict: strictPrompt,
    },
  }

  return { strictPrompt, naturalPrompt, agentPrompt, jobSpec }
}

function canvasPointFromEvent(event, canvas) {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  return {
    x: clamp((event.clientX - rect.left) * scaleX, 0, canvas.width),
    y: clamp((event.clientY - rect.top) * scaleY, 0, canvas.height),
  }
}

function copyText(text) {
  if (!navigator.clipboard) return Promise.reject(new Error('Clipboard unavailable'))
  return navigator.clipboard.writeText(text)
}

function CanvasFrame({ children, label, note, actions, tall = false }) {
  return (
    <section className={`wb-panel ${tall ? 'wb-panel--tall' : ''}`}>
      <div className="wb-panel__head">
        <div>
          <p className="wb-panel__title">{label}</p>
          {note ? <p className="wb-panel__note">{note}</p> : null}
        </div>
        {actions ? <div className="wb-panel__actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  )
}

export default function ImageWorkbench({ onBack }) {
  const orchestratorKey = 'workbench.orchestratorUrl'
  const notificationKey = 'workbench.notificationUrl'
  const selectedModelKey = 'workbench.selectedModel'
  const modelLockKey = 'workbench.modelLock'
  const gridSizeKey = 'workbench.gridSize'
  const brushSizeKey = 'workbench.brushSize'
  const zoomKey = 'workbench.zoom'
  const selectedTargetKey = 'workbench.selectedTargetId'

  const [orchestratorUrl, setOrchestratorUrl] = useStorageState(orchestratorKey, DEFAULT_ORCHESTRATOR_URL)
  const [notificationUrl, setNotificationUrl] = useStorageState(notificationKey, DEFAULT_NOTIFICATION_URL)
  const [selectedModelTitle, setSelectedModelTitle] = useStorageState(selectedModelKey, LOCAL_MODELS[0].title)
  const [modelLock, setModelLock] = useStorageState(modelLockKey, 'true')
  const [gridSize, setGridSize] = useStorageState(gridSizeKey, String(DEFAULT_GRID_SIZE))
  const [brushSize, setBrushSize] = useStorageState(brushSizeKey, '18')
  const [zoom, setZoom] = useStorageState(zoomKey, '1')
  const [selectedTargetId, setSelectedTargetId] = useStorageState(selectedTargetKey, '')

  const [models, setModels] = useState([])
  const [loras, setLoras] = useState([])
  const [currentModel, setCurrentModel] = useState('')
  const [inventoryStatus, setInventoryStatus] = useState('Loading inventory...')
  const [jobStatus, setJobStatus] = useState('Idle')
  const [jobProgress, setJobProgress] = useState(0)
  const [jobEta, setJobEta] = useState('0s')
  const [jobLog, setJobLog] = useState([])
  const [jobJsonCopied, setJobJsonCopied] = useState(false)
  const [tab, setTab] = useState('base')

  const [excerpt, setExcerpt] = useState(SAMPLE_EXCERPT)
  const [analysis, setAnalysis] = useState(SAMPLE_ANALYSIS)
  const [sdPrompt, setSdPrompt] = useState(SAMPLE_SD_PROMPT)

  const [baseImageSrc, setBaseImageSrc] = useState('')
  const [baseImage, setBaseImage] = useState(null)
  const [cropRect, setCropRect] = useState(null)
  const [cutoutSrc, setCutoutSrc] = useState('')
  const [cutoutImage, setCutoutImage] = useState(null)
  const [resultSrc, setResultSrc] = useState('')
  const [resultNote, setResultNote] = useState('No generated result yet.')
  const [attachments, setAttachments] = useState([])
  const [maskVersion, setMaskVersion] = useState(0)
  const [baseHistory, setBaseHistory] = useState([])
  const [cutoutHistory, setCutoutHistory] = useState([])
  const [selectedLoras, setSelectedLoras] = useState([])
  const [targets, setTargets] = useState(createInitialTargets)
  const [showGrid, setShowGrid] = useState(true)
  const [editMode, setEditMode] = useState('paint')
  const [notificationEnabled, setNotificationEnabled] = useState(true)
  const [mirrorTelegram, setMirrorTelegram] = useState(false)
  const [gridSelection, setGridSelection] = useState({ row: 0, col: 0 })

  const baseCanvasRef = useRef(null)
  const cutoutCanvasRef = useRef(null)
  const maskCanvasRef = useRef(null)
  const drawingRef = useRef(false)
  const strokeStartedRef = useRef(false)
  const lastPointRef = useRef(null)
  const currentTargetIdRef = useRef(selectedTargetId)
  const baseImageRef = useRef(null)
  const cutoutImageRef = useRef(null)
  const jobTickerRef = useRef(null)
  const latestTargetIdRef = useRef(selectedTargetId)

  useEffect(() => {
    latestTargetIdRef.current = selectedTargetId || ''
  }, [selectedTargetId])

  useEffect(() => {
    const storedTarget = selectedTargetId || targets[0]?.id || ''
    if (!selectedTargetId && storedTarget) {
      setSelectedTargetId(storedTarget)
    }
  }, [selectedTargetId, targets, setSelectedTargetId])

  useEffect(() => {
    currentTargetIdRef.current = selectedTargetId || targets[0]?.id || ''
  }, [selectedTargetId, targets])

  const selectedTarget = useMemo(
    () => targets.find((target) => target.id === (selectedTargetId || targets[0]?.id)) || targets[0] || null,
    [targets, selectedTargetId],
  )

  const selectedModelOption = useMemo(() => models.find((model) => model.title === selectedModelTitle) || null, [models, selectedModelTitle])
  const selectedLoraNames = useMemo(() => selectedLoras.filter((lora) => lora.enabled).map((lora) => lora.name), [selectedLoras])
  const gridNumericSize = clamp(Number(gridSize) || DEFAULT_GRID_SIZE, 2, 16)
  const brushNumericSize = clamp(Number(brushSize) || 18, 4, 64)
  const zoomNumeric = clamp(Number(zoom) || 1, 0.5, 3)

  const promptBundle = useMemo(() => makePromptBundle({
    excerpt,
    analysis,
    sdPrompt,
    selectedModel: selectedModelTitle,
    loras: selectedLoras,
    cropRect,
    baseImage,
    cutoutImage,
    targets,
    attachments,
  }), [excerpt, analysis, sdPrompt, selectedModelTitle, selectedLoras, cropRect, baseImage, cutoutImage, targets, attachments])

  useEffect(() => {
    if (!selectedTargetId && targets[0]?.id) {
      setSelectedTargetId(targets[0].id)
    }
  }, [targets, selectedTargetId, setSelectedTargetId])

  useEffect(() => {
    if (!baseImageSrc) {
      setBaseImage(null)
      baseImageRef.current = null
      return
    }
    let cancelled = false
    loadImage(baseImageSrc)
      .then((img) => {
        if (cancelled) return
        const data = {
          src: baseImageSrc,
          img,
          width: img.naturalWidth,
          height: img.naturalHeight,
          name: baseImageSrc.split('/').pop() || 'base-image',
        }
        baseImageRef.current = data
        setBaseImage(data)
        if (!cropRect) {
          const size = Math.round(Math.min(img.naturalWidth, img.naturalHeight) * 0.6)
          const nextRect = {
            x: Math.max(0, Math.round((img.naturalWidth - size) / 2)),
            y: Math.max(0, Math.round((img.naturalHeight - size) / 2)),
            w: Math.max(64, size),
            h: Math.max(64, size),
          }
          setCropRect(nextRect)
        }
      })
      .catch(() => {
        if (cancelled) return
        setJobStatus('Failed to load base image')
      })
    return () => {
      cancelled = true
    }
  }, [baseImageSrc])

  useEffect(() => {
    const render = async () => {
      const canvas = baseCanvasRef.current
      if (!canvas || !baseImage) return
      canvas.width = baseImage.width
      canvas.height = baseImage.height
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(baseImage.img, 0, 0)

      if (showGrid) {
        const size = gridNumericSize
        ctx.save()
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.72)'
        ctx.lineWidth = Math.max(1, Math.round(canvas.width / 1024))
        for (let row = 0; row < size; row += 1) {
          for (let col = 0; col < size; col += 1) {
            const cellW = canvas.width / size
            const cellH = canvas.height / size
            const x = col * cellW
            const y = row * cellH
            ctx.strokeRect(x, y, cellW, cellH)
            ctx.font = `${Math.max(10, Math.round(canvas.width / 64))}px sans-serif`
            ctx.fillText(buildGridLabel(row, col), x + 4, y + 16)
          }
        }
        ctx.restore()
      }

      if (cropRect) {
        ctx.save()
        ctx.strokeStyle = 'rgba(200, 150, 42, 0.95)'
        ctx.lineWidth = Math.max(3, Math.round(canvas.width / 256))
        ctx.setLineDash([12, 8])
        ctx.strokeRect(Math.round(cropRect.x), Math.round(cropRect.y), Math.round(cropRect.w), Math.round(cropRect.h))
        ctx.fillStyle = 'rgba(200, 150, 42, 0.18)'
        ctx.fillRect(Math.round(cropRect.x), Math.round(cropRect.y), Math.round(cropRect.w), Math.round(cropRect.h))
        ctx.setLineDash([])
        ctx.restore()
      }
    }
    void render()
  }, [baseImage, cropRect, gridNumericSize, showGrid])

  useEffect(() => {
    if (!baseImage || !cropRect) {
      setCutoutSrc('')
      setCutoutImage(null)
      return
    }
    let cancelled = false
    cropImage(baseImage.src, cropRect)
      .then((src) => {
        if (cancelled) return
        setCutoutSrc(src)
        setResultNote('Cutout updated from the selected base region.')
      })
      .catch(() => {
        if (!cancelled) setResultNote('Failed to build cutout preview.')
      })
    return () => {
      cancelled = true
    }
  }, [baseImage, cropRect])

  useEffect(() => {
    if (!cutoutSrc) {
      setCutoutImage(null)
      return
    }
    let cancelled = false
    loadImage(cutoutSrc)
      .then((img) => {
        if (cancelled) return
        const data = {
          src: cutoutSrc,
          img,
          width: img.naturalWidth,
          height: img.naturalHeight,
          name: 'cutout-image',
        }
        cutoutImageRef.current = data
        setCutoutImage(data)
        const maskCanvas = maskCanvasRef.current
        if (maskCanvas) {
          maskCanvas.width = data.width
          maskCanvas.height = data.height
          const ctx = maskCanvas.getContext('2d')
          ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height)
          setMaskVersion((value) => value + 1)
        }
      })
      .catch(() => {
        if (!cancelled) setResultNote('Failed to load cutout preview.')
      })
    return () => {
      cancelled = true
    }
  }, [cutoutSrc])

  useEffect(() => {
    const canvas = cutoutCanvasRef.current
    if (!canvas || !cutoutImage) return
    canvas.width = cutoutImage.width
    canvas.height = cutoutImage.height
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(cutoutImage.img, 0, 0)
  }, [cutoutImage])

  useEffect(() => {
    const canvas = maskCanvasRef.current
    if (!canvas || !cutoutImage) return
    canvas.width = cutoutImage.width
    canvas.height = cutoutImage.height
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, [cutoutImage])

  useEffect(() => {
    setModels(LOCAL_MODELS)
    setLoras([])
    setCurrentModel(LOCAL_MODELS[0].title)
    setInventoryStatus('Using local model list. Click Rescan from Tailscale to load live inventory.')
    if (!selectedModelTitle || !LOCAL_MODELS.some((model) => model.title === selectedModelTitle)) {
      setSelectedModelTitle(LOCAL_MODELS[0].title)
    }
  }, [])

  useEffect(() => {
    if (!selectedModelTitle) return
    const match = models.find((model) => model.title === selectedModelTitle) || LOCAL_MODELS.find((model) => model.title === selectedModelTitle)
    if (match) {
      setJobStatus(`Selected model: ${match.title}`)
    }
  }, [selectedModelTitle, models])

  useEffect(() => {
    if (!cutoutImage || !maskCanvasRef.current) return
    const maskCanvas = maskCanvasRef.current
    const ctx = maskCanvas.getContext('2d')
    ctx.globalCompositeOperation = 'source-over'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = brushNumericSize
  }, [brushNumericSize, cutoutImage, maskVersion])

  useEffect(() => {
    if (selectedTargetId && !targets.find((target) => target.id === selectedTargetId)) {
      setSelectedTargetId(targets[0]?.id || '')
    }
  }, [selectedTargetId, targets, setSelectedTargetId])

  useEffect(() => {
    const tick = jobTickerRef.current
    return () => {
      if (tick) window.clearInterval(tick)
    }
  }, [])

  async function mirrorProgress(payload) {
    if (!notificationEnabled || !notificationUrl) return
    try {
      await fetchJson(notificationUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
      }, 10000)
    } catch {
      // local log is enough if the webhook is unavailable
    }
  }

  function pushLog(message, percent = null, eta = null, extra = {}) {
    const entry = {
      id: makeId(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      message,
      percent,
      eta,
      ...extra,
    }
    setJobLog((previous) => [entry, ...previous].slice(0, 24))
    if (percent !== null) setJobProgress(percent)
    if (eta) setJobEta(eta)
    void mirrorProgress({ type: 'progress', transport: mirrorTelegram ? 'telegram' : 'webhook', ...entry, job: { model: selectedModelTitle || 'auto', cropRect, targetCount: targets.length } })
  }

  function updateTarget(targetId, patch) {
    setTargets((previous) => previous.map((target) => (target.id === targetId ? { ...target, ...patch } : target)))
  }

  function addTarget() {
    const next = createTarget(targets.length + 1, COLOR_PALETTE[targets.length % COLOR_PALETTE.length])
    setTargets((previous) => [...previous, next])
    setSelectedTargetId(next.id)
    pushLog(`Added ${next.label}.`, 5, '0s')
  }

  function removeTarget(targetId) {
    setTargets((previous) => previous.filter((target) => target.id !== targetId))
    if (selectedTargetId === targetId) {
      setSelectedTargetId(targets.find((target) => target.id !== targetId)?.id || '')
    }
  }

  function clearMask() {
    const canvas = maskCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setMaskVersion((value) => value + 1)
    window.__wbMaskUndoStack = []
    window.__wbMaskRedoStack = []
    pushLog('Cleared the edit map.', 12, '0s')
  }

  function undoMask() {
    const canvas = maskCanvasRef.current
    if (!canvas) return
    const stack = window.__wbMaskUndoStack || []
    const redo = window.__wbMaskRedoStack || []
    const previous = stack.pop()
    if (!previous) return
    redo.push(canvas.toDataURL('image/png'))
    window.__wbMaskUndoStack = stack
    window.__wbMaskRedoStack = redo
    loadImage(previous).then((img) => {
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      setMaskVersion((value) => value + 1)
    })
    pushLog('Undid the last mask stroke.', 12, '0s')
  }

  function redoMask() {
    const canvas = maskCanvasRef.current
    if (!canvas) return
    const stack = window.__wbMaskUndoStack || []
    const redo = window.__wbMaskRedoStack || []
    const next = redo.pop()
    if (!next) return
    stack.push(canvas.toDataURL('image/png'))
    window.__wbMaskUndoStack = stack
    window.__wbMaskRedoStack = redo
    loadImage(next).then((img) => {
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      setMaskVersion((value) => value + 1)
    })
    pushLog('Redid the last mask stroke.', 12, '0s')
  }

  function snapshotMaskForUndo() {
    const canvas = maskCanvasRef.current
    if (!canvas) return
    const stack = window.__wbMaskUndoStack || []
    stack.push(canvas.toDataURL('image/png'))
    if (stack.length > 16) stack.shift()
    window.__wbMaskUndoStack = stack
    window.__wbMaskRedoStack = []
  }

  function beginMaskStroke(event) {
    if (!cutoutImage || !maskCanvasRef.current) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    snapshotMaskForUndo()
    drawingRef.current = true
    strokeStartedRef.current = true
    const canvas = maskCanvasRef.current
    const point = canvasPointFromEvent(event, canvas)
    lastPointRef.current = point
    const ctx = canvas.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
    ctx.lineWidth = brushNumericSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.globalCompositeOperation = editMode === 'erase' ? 'destination-out' : 'source-over'
    ctx.strokeStyle = editMode === 'erase' ? 'rgba(0, 0, 0, 1)' : selectedTarget?.color || COLOR_PALETTE[0]
    ctx.fillStyle = editMode === 'erase' ? 'rgba(0, 0, 0, 1)' : selectedTarget?.color || COLOR_PALETTE[0]
    ctx.lineTo(point.x + 0.1, point.y + 0.1)
    ctx.stroke()
  }

  function moveMaskStroke(event) {
    if (!drawingRef.current || !maskCanvasRef.current) return
    const canvas = maskCanvasRef.current
    const point = canvasPointFromEvent(event, canvas)
    const ctx = canvas.getContext('2d')
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    lastPointRef.current = point
  }

  function endMaskStroke(event) {
    if (!drawingRef.current || !maskCanvasRef.current) return
    drawingRef.current = false
    const canvas = maskCanvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.closePath()
    setMaskVersion((value) => value + 1)
    if (event?.currentTarget?.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    pushLog(`Painted ${selectedTarget?.label || 'the active target'} in the edit map.`, 16, '0s')
  }

  async function loadBaseImageFromFile(file) {
    const src = await readFileAsDataUrl(file)
    setBaseImageSrc(src)
    pushLog(`Loaded base image: ${file.name}`, 3, '0s')
  }

  async function loadAttachments(files) {
    const next = []
    for (const file of Array.from(files || [])) {
      next.push({ name: file.name, src: await readFileAsDataUrl(file), kind: 'reference' })
    }
    setAttachments((previous) => [...previous, ...next])
    pushLog(`Added ${next.length} reference attachment(s).`, 8, '0s')
  }

  function setDemoScene() {
    setExcerpt(SAMPLE_EXCERPT)
    setAnalysis(SAMPLE_ANALYSIS)
    setSdPrompt(SAMPLE_SD_PROMPT)
    setBaseImageSrc(SAMPLE_BASE_IMAGE)
    pushLog('Loaded the demo base image and sample instructions.', 2, '0s')
  }

  function selectGridCell(row, col) {
    if (!baseImage) return
    const cellW = baseImage.width / gridNumericSize
    const cellH = baseImage.height / gridNumericSize
    const rect = {
      x: Math.round(col * cellW),
      y: Math.round(row * cellH),
      w: Math.round(cellW),
      h: Math.round(cellH),
    }
    setGridSelection({ row, col })
    setCropRect(rect)
    pushLog(`Selected ${buildGridLabel(row, col)} as the active cutout cell.`, 10, '0s')
  }

  async function ensureSelectedModelActive() {
    if (!selectedModelTitle || modelLock !== 'true') return
    if (currentModel === selectedModelTitle) return
    setJobStatus(`Switching model to ${selectedModelTitle}...`)
    pushLog(`Switching active checkpoint to ${selectedModelTitle}`, 15, 'waiting for reload')
    await fetchJson(`${orchestratorUrl.replace(/\/$/, '')}/models/switch`, {
      method: 'POST',
      body: JSON.stringify({ model_title: selectedModelTitle }),
    }, 120000)
    setCurrentModel(selectedModelTitle)
    pushLog(`Model switch confirmed: ${selectedModelTitle}`, 18, 'reload complete')
  }

  async function buildPreviewResult() {
    if (!cutoutSrc) return resultSrc || baseImageSrc || ''
    const canvas = document.createElement('canvas')
    const cutout = cutoutImage || (await loadImage(cutoutSrc).then((img) => ({ img, width: img.naturalWidth, height: img.naturalHeight })))
    canvas.width = cutout.width
    canvas.height = cutout.height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(cutout.img, 0, 0)
    ctx.fillStyle = 'rgba(200, 150, 42, 0.16)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.lineWidth = Math.max(2, Math.round(canvas.width / 128))
    ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)'
    ctx.fillRect(12, 12, Math.min(canvas.width - 24, 320), 72)
    ctx.fillStyle = '#f7d37b'
    ctx.font = `${Math.max(18, Math.round(canvas.width / 22))}px sans-serif`
    ctx.fillText('Workbench preview', 24, 44)
    ctx.font = `${Math.max(12, Math.round(canvas.width / 40))}px sans-serif`
    ctx.fillText('Approval candidate', 24, 68)
    return canvas.toDataURL('image/png')
  }

  async function refreshInventory() {
    try {
      setInventoryStatus('Loading live inventory...')
      const [modelsResponse, lorasResponse, currentResponse] = await Promise.all([
        fetchJson(`${orchestratorUrl.replace(/\/$/, '')}/models`, {}, 25000),
        fetchJson(`${orchestratorUrl.replace(/\/$/, '')}/loras`, {}, 25000).catch(() => []),
        fetchJson(`${orchestratorUrl.replace(/\/$/, '')}/models/current`, {}, 25000).catch(() => ({ current: '' })),
      ])

      const normalizedModels = Array.isArray(modelsResponse)
        ? modelsResponse.map((item) => ({
            title: item.title || item.model_name || item.name || '',
            name: item.model_name || item.name || item.title || '',
            hash: item.hash || '',
            alias: item.alias || '',
          })).filter((item) => item.title)
        : []

      const normalizedLoras = Array.isArray(lorasResponse)
        ? lorasResponse.map((item) => ({
            name: item.name || item.alias || item.model_name || item.path || '',
            alias: item.alias || '',
            weight: 1,
            enabled: false,
          })).filter((item) => item.name)
        : []

      setModels(normalizedModels.length ? normalizedModels : LOCAL_MODELS)
      setLoras(normalizedLoras)
      setCurrentModel(currentResponse.current || normalizedModels[0]?.title || LOCAL_MODELS[0].title)
      setInventoryStatus(`Loaded ${normalizedModels.length || LOCAL_MODELS.length} checkpoint(s) and ${normalizedLoras.length} LoRA(s).`)

      const nextModel = selectedModelTitle && (normalizedModels.some((model) => model.title === selectedModelTitle) || LOCAL_MODELS.some((model) => model.title === selectedModelTitle))
        ? selectedModelTitle
        : (normalizedModels[0]?.title || LOCAL_MODELS[0].title)
      setSelectedModelTitle(nextModel)

      if (normalizedLoras.length && !selectedLoras.length) {
        setSelectedLoras(normalizedLoras.slice(0, 4))
      }
    } catch {
      setInventoryStatus('Live inventory unavailable; using local model list.')
      setModels(LOCAL_MODELS)
      setLoras([])
      setCurrentModel(LOCAL_MODELS[0].title)
      if (!selectedModelTitle || !LOCAL_MODELS.some((model) => model.title === selectedModelTitle)) {
        setSelectedModelTitle(LOCAL_MODELS[0].title)
      }
    }
  }

  async function generatePreview() {
    try {
      setJobStatus('Preparing job...')
      setJobProgress(1)
      const ticker = window.setInterval(() => {
        setJobProgress((value) => clamp(value + 3, 0, 92))
      }, 1400)
      jobTickerRef.current = ticker

      await ensureSelectedModelActive()
      const previewPrompt = promptBundle.strictPrompt
      const activeModelTitle = selectedModelTitle || currentModel || LOCAL_MODELS[0].title
      const payload = {
        prompt: previewPrompt,
        preferred_model_title: activeModelTitle,
        auto_download_loras: false,
        max_loras: selectedLoras.filter((item) => item.enabled).length || 0,
        dry_run: false,
        style: 'auto',
      }

      let response = null
      if (cutoutImage && maskCanvasRef.current) {
        setJobStatus('Sending inpaint job...')
        pushLog('Sending the marked cutout for inpaint / edit.', 28, 'waiting on render')
        response = await fetchJson(`${orchestratorUrl.replace(/\/$/, '')}/inpaint`, {
          method: 'POST',
          body: JSON.stringify({
            prompt: previewPrompt,
            negative_prompt: 'blurry, malformed, low detail, broken anatomy, text, watermark, extra limbs',
            init_image_b64: dataUrlToBase64(cutoutSrc),
            mask_b64: dataUrlToBase64(maskCanvasRef.current.toDataURL('image/png')),
            denoising_strength: 0.66,
            width: cutoutImage.width,
            height: cutoutImage.height,
            steps: 24,
            cfg_scale: 6.5,
            sampler_name: 'DPM++ 2M Karras',
            seed: -1,
            override_settings: activeModelTitle ? { sd_model_checkpoint: activeModelTitle } : {},
          }),
        }, 240000).catch(async () => {
          const preview = await buildPreviewResult()
          return { image_base64: preview, output: 'local preview fallback', model: activeModelTitle, seed: 0 }
        })
      } else {
        setJobStatus('Sending planned generation job...')
        pushLog('Sending the job to the planned generation endpoint.', 28, 'waiting on render')
        response = await fetchJson(`${orchestratorUrl.replace(/\/$/, '')}/generate/planned`, {
          method: 'POST',
          body: JSON.stringify(payload),
        }, 240000).catch(async () => {
          const preview = await buildPreviewResult()
          return { image_base64: preview, output: 'local preview fallback', model: activeModelTitle, seed: 0 }
        })
      }

      const imageBase64 = Array.isArray(response?.images) && response.images[0]
        ? response.images[0]
        : response?.image_base64 || response?.output_image || ''
      if (imageBase64) {
        const normalized = imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`
        setResultSrc(normalized)
        setResultNote(`Result from ${response.model || activeModelTitle}${response.seed ? ` • seed ${response.seed}` : ''}`)
        setBaseHistory((previous) => [{ kind: 'preview', src: normalized, note: `Preview from ${response.model || activeModelTitle}`, time: new Date().toLocaleString() }, ...previous].slice(0, 12))
      } else {
        const preview = await buildPreviewResult()
        setResultSrc(preview)
        setResultNote(response?.output || 'Generated local preview')
        setBaseHistory((previous) => [{ kind: 'preview', src: preview, note: 'Local preview fallback', time: new Date().toLocaleString() }, ...previous].slice(0, 12))
      }

      setJobStatus('Preview ready')
      setJobProgress(100)
      setJobEta('done')
      pushLog(`Preview ready: ${response?.model || activeModelTitle}`, 100, 'done')
    } catch (error) {
      setJobStatus(`Error: ${error.message}`)
      pushLog(`Job failed: ${error.message}`, 0, 'unknown')
    } finally {
      if (jobTickerRef.current) {
        window.clearInterval(jobTickerRef.current)
        jobTickerRef.current = null
      }
    }
  }

  async function promoteCutoutCheckpoint() {
    if (!resultSrc) return
    setCutoutSrc(resultSrc)
    setCutoutHistory((previous) => [{ kind: 'cutout-checkpoint', src: resultSrc, note: 'Approved cutout checkpoint', time: new Date().toLocaleString() }, ...previous].slice(0, 12))
    pushLog('Approved the cutout checkpoint.', 100, 'done')
  }

  async function promoteBaseCheckpoint() {
    if (!baseImageSrc || !resultSrc || !cropRect) return
    const merged = await mergeImageAtRect(baseImageSrc, resultSrc, cropRect)
    if (!merged) return
    setBaseImageSrc(merged)
    setBaseHistory((previous) => [{ kind: 'base-checkpoint', src: merged, note: 'Approved base checkpoint', time: new Date().toLocaleString() }, ...previous].slice(0, 12))
    pushLog('Merged the approved result back into the base image.', 100, 'done')
  }

  async function saveCheckpoint() {
    if (!resultSrc) return
    const entry = {
      kind: 'saved-checkpoint',
      src: resultSrc,
      note: `Saved checkpoint for ${selectedModelTitle || 'auto'}`,
      time: new Date().toLocaleString(),
    }
    setCutoutHistory((previous) => [entry, ...previous].slice(0, 12))
    pushLog('Saved a checkpoint snapshot.', 100, 'done')
  }

  function renderMaskPainter() {
    const canvas = maskCanvasRef.current
    if (!canvas || !cutoutImage) return null
    return (
      <canvas
        ref={maskCanvasRef}
        className="wb-canvas wb-canvas--mask"
        onPointerDown={beginMaskStroke}
        onPointerMove={moveMaskStroke}
        onPointerUp={endMaskStroke}
        onPointerLeave={endMaskStroke}
        onContextMenu={(event) => event.preventDefault()}
      />
    )
  }

  const gridCells = useMemo(() => {
    const cells = []
    for (let row = 0; row < gridNumericSize; row += 1) {
      for (let col = 0; col < gridNumericSize; col += 1) {
        cells.push({ row, col, label: buildGridLabel(row, col) })
      }
    }
    return cells
  }, [gridNumericSize])

  const jobSpec = promptBundle.jobSpec

  return (
    <div className="workbench-screen">
      <div className="workbench-bg" />
      <div className="workbench-shell">
        <header className="workbench-header">
          <div>
            <p className="workbench-kicker">COMFYUI / SD ORCHESTRATOR / TELEGRAM</p>
            <h1 className="workbench-title">Image Workbench</h1>
            <p className="workbench-subtitle">
              Select the active model, draw a base crop, paint the edit map, and keep progress updates flowing without blocking the main job.
            </p>
          </div>
          <div className="workbench-header__actions">
            <button type="button" className="wb-button" onClick={onBack}>Portal</button>
            <button type="button" className="wb-button" onClick={setDemoScene}>Load Sample</button>
            <button type="button" className="wb-button wb-button--primary" onClick={generatePreview}>Generate</button>
          </div>
        </header>

        <section className="workbench-status-row">
          <div className="workbench-stat">
            <span className="workbench-stat__label">Inventory</span>
            <span className="workbench-stat__value">{inventoryStatus}</span>
          </div>
          <div className="workbench-stat">
            <span className="workbench-stat__label">Current model</span>
            <span className="workbench-stat__value">{currentModel || 'unknown'}</span>
          </div>
          <div className="workbench-stat">
            <span className="workbench-stat__label">Selected model</span>
            <span className="workbench-stat__value">{selectedModelTitle || 'auto'}</span>
          </div>
          <div className="workbench-stat">
            <span className="workbench-stat__label">Progress</span>
            <span className="workbench-stat__value">{jobProgress}% · {jobEta}</span>
          </div>
          <div className="workbench-stat">
            <span className="workbench-stat__label">Targets</span>
            <span className="workbench-stat__value">{targets.length} edit area(s)</span>
          </div>
        </section>

        <section className="workbench-grid">
          <div className="workbench-column workbench-column--left">
            <CanvasFrame
              label="Received Excerpt"
              note="Left side shows the source text that the prompt will be built from."
              actions={<button type="button" className="wb-mini" onClick={() => setExcerpt(SAMPLE_EXCERPT)}>Sample</button>}
            >
              <textarea className="wb-textarea wb-textarea--large" value={excerpt} onChange={(event) => setExcerpt(event.target.value)} />
            </CanvasFrame>

            <CanvasFrame
              label="Prompt Draft"
              note="The right-side prompt output is built from the excerpt, crop, targets, model, and attachments."
              actions={<button type="button" className="wb-mini" onClick={() => copyText(promptBundle.strictPrompt)}>Copy</button>}
            >
              <textarea className="wb-textarea" value={promptBundle.strictPrompt} readOnly />
            </CanvasFrame>

            <CanvasFrame label="Agent Brief" note="Natural-language version for Gemini / ChatGPT / n8n agents.">
              <textarea className="wb-textarea" value={promptBundle.naturalPrompt} readOnly />
            </CanvasFrame>

            <CanvasFrame label="Attachment Stack" note="Reference images 5..256 can be added here as helper material.">
              <label className="wb-upload">
                <span>Upload reference images</span>
                <input type="file" accept="image/*" multiple onChange={(event) => loadAttachments(event.target.files)} />
              </label>
              <div className="wb-thumb-grid">
                {attachments.map((item, index) => (
                  <button key={`${item.name}-${index}`} type="button" className="wb-thumb" onClick={() => setResultSrc(item.src)}>
                    <img src={item.src} alt={item.name} />
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </CanvasFrame>
          </div>

          <div className="workbench-column workbench-column--center">
            <CanvasFrame
              label="Base / Cutout / Mask / Grid"
              note="Draw the crop on the base image, then paint the edit map on the cutout."
              actions={(
                <div className="wb-inline-actions">
                  <button type="button" className={`wb-mini ${tab === 'base' ? 'wb-mini--active' : ''}`} onClick={() => setTab('base')}>Base</button>
                  <button type="button" className={`wb-mini ${tab === 'cutout' ? 'wb-mini--active' : ''}`} onClick={() => setTab('cutout')}>Cutout</button>
                  <button type="button" className={`wb-mini ${tab === 'mask' ? 'wb-mini--active' : ''}`} onClick={() => setTab('mask')}>Mask</button>
                  <button type="button" className={`wb-mini ${tab === 'grid' ? 'wb-mini--active' : ''}`} onClick={() => setTab('grid')}>Grid</button>
                </div>
              )}
            >
              {tab === 'base' ? (
                <div className="wb-editor">
                  <div className="wb-editor__toolbar">
                    <label className="wb-upload wb-upload--inline">
                      <span>Upload base image</span>
                      <input type="file" accept="image/*" onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) void loadBaseImageFromFile(file)
                      }} />
                    </label>
                    <label className="wb-field">
                      <span>Zoom</span>
                      <input type="range" min="0.5" max="3" step="0.05" value={zoomNumeric} onChange={(event) => setZoom(event.target.value)} />
                    </label>
                    <label className="wb-field">
                      <span>Grid</span>
                      <select value={gridSize} onChange={(event) => setGridSize(event.target.value)}>
                        <option value="8">8 x 8</option>
                        <option value="16">16 x 16</option>
                      </select>
                    </label>
                    <label className="wb-field wb-field--check">
                      <input type="checkbox" checked={showGrid} onChange={(event) => setShowGrid(event.target.checked)} />
                      <span>Show grid</span>
                    </label>
                  </div>
                  <div className="wb-canvas-shell wb-canvas-shell--zoom">
                    {baseImage ? (
                      <canvas
                        ref={baseCanvasRef}
                        className="wb-canvas wb-canvas--zoomable"
                        style={{ width: `${zoomNumeric * 100}%` }}
                        onPointerDown={(event) => {
                          if (!baseCanvasRef.current || !baseImage) return
                          const canvas = baseCanvasRef.current
                          event.currentTarget.setPointerCapture(event.pointerId)
                          const point = canvasPointFromEvent(event, canvas)
                          const inside = cropRect
                            && point.x >= cropRect.x
                            && point.x <= cropRect.x + cropRect.w
                            && point.y >= cropRect.y
                            && point.y <= cropRect.y + cropRect.h
                          canvas.__dragMode = inside ? 'move' : 'draw'
                          canvas.__startPoint = point
                          canvas.__startRect = cropRect ? { ...cropRect } : null
                        }}
                        onPointerMove={(event) => {
                          const canvas = baseCanvasRef.current
                          if (!canvas || !baseImage) return
                          const mode = canvas.__dragMode
                          if (!mode) return
                          const point = canvasPointFromEvent(event, canvas)
                          if (mode === 'move' && canvas.__startRect) {
                            const rect = canvas.__startRect
                            const dx = point.x - canvas.__startPoint.x
                            const dy = point.y - canvas.__startPoint.y
                            setCropRect({
                              x: clamp(rect.x + dx, 0, baseImage.width - rect.w),
                              y: clamp(rect.y + dy, 0, baseImage.height - rect.h),
                              w: rect.w,
                              h: rect.h,
                            })
                            return
                          }
                          const start = canvas.__startPoint || point
                          const x = Math.min(start.x, point.x)
                          const y = Math.min(start.y, point.y)
                          const w = Math.max(32, Math.abs(point.x - start.x))
                          const h = Math.max(32, Math.abs(point.y - start.y))
                          setCropRect({
                            x: clamp(x, 0, baseImage.width - 1),
                            y: clamp(y, 0, baseImage.height - 1),
                            w: clamp(w, 32, baseImage.width),
                            h: clamp(h, 32, baseImage.height),
                          })
                        }}
                        onPointerUp={(event) => {
                          if (baseCanvasRef.current) {
                            baseCanvasRef.current.__dragMode = null
                          }
                          pushLog('Updated the base crop rectangle.', 8, '0s')
                          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                            event.currentTarget.releasePointerCapture(event.pointerId)
                          }
                        }}
                        onWheel={(event) => {
                          event.preventDefault()
                          const nextZoom = clamp(zoomNumeric + (event.deltaY < 0 ? 0.05 : -0.05), 0.5, 3)
                          setZoom(String(nextZoom.toFixed(2)))
                        }}
                      />
                    ) : (
                      <div className="wb-empty">Load a base image or use the sample image to start drawing.</div>
                    )}
                  </div>
                  {cropRect ? (
                    <div className="wb-readout">
                      <span>x {Math.round(cropRect.x)}</span>
                      <span>y {Math.round(cropRect.y)}</span>
                      <span>w {Math.round(cropRect.w)}</span>
                      <span>h {Math.round(cropRect.h)}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {tab === 'cutout' ? (
                <div className="wb-editor">
                  <div className="wb-canvas-shell wb-canvas-shell--stacked">
                    {cutoutImage ? (
                      <>
                        <canvas ref={cutoutCanvasRef} className="wb-canvas wb-canvas--base" />
                        <canvas ref={maskCanvasRef} className="wb-canvas wb-canvas--overlay" />
                      </>
                    ) : (
                      <div className="wb-empty">Select a crop on the base image first.</div>
                    )}
                  </div>
                  <div className="wb-readout wb-readout--split">
                    <span>Cutout checkpoint ready</span>
                    <span>{cutoutImage ? `${cutoutImage.width} x ${cutoutImage.height}` : 'none'}</span>
                  </div>
                </div>
              ) : null}

              {tab === 'mask' ? (
                <div className="wb-editor">
                  <div className="wb-editor__toolbar wb-editor__toolbar--wrap">
                    <button type="button" className={`wb-mini ${editMode === 'paint' ? 'wb-mini--active' : ''}`} onClick={() => setEditMode('paint')}>Paint</button>
                    <button type="button" className={`wb-mini ${editMode === 'erase' ? 'wb-mini--active' : ''}`} onClick={() => setEditMode('erase')}>Erase</button>
                    <label className="wb-field wb-field--compact">
                      <span>Brush</span>
                      <input type="range" min="4" max="64" value={brushSize} onChange={(event) => setBrushSize(event.target.value)} />
                    </label>
                    <button type="button" className="wb-mini" onClick={undoMask}>Undo</button>
                    <button type="button" className="wb-mini" onClick={redoMask}>Redo</button>
                    <button type="button" className="wb-mini" onClick={clearMask}>Clear</button>
                  </div>

                  <div className="wb-target-grid">
                    {targets.map((target) => (
                      <button
                        key={target.id}
                        type="button"
                        className={`wb-target ${selectedTargetId === target.id ? 'wb-target--active' : ''}`}
                        onClick={() => setSelectedTargetId(target.id)}
                      >
                        <span className="wb-target__swatch" style={{ background: target.color }} />
                        <span className="wb-target__label">{target.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="wb-canvas-shell wb-canvas-shell--stacked">
                    {cutoutImage ? (
                      <>
                        <canvas ref={cutoutCanvasRef} className="wb-canvas wb-canvas--base" />
                        <canvas
                          ref={maskCanvasRef}
                          className="wb-canvas wb-canvas--overlay"
                          onPointerDown={beginMaskStroke}
                          onPointerMove={moveMaskStroke}
                          onPointerUp={endMaskStroke}
                          onPointerLeave={endMaskStroke}
                          onContextMenu={(event) => event.preventDefault()}
                        />
                      </>
                    ) : (
                      <div className="wb-empty">Paint here after a cutout is selected.</div>
                    )}
                  </div>
                </div>
              ) : null}

              {tab === 'grid' ? (
                <div className="wb-editor">
                  <div className="wb-grid-header">
                    <span>Grid mode</span>
                    <span>{gridNumericSize} x {gridNumericSize}</span>
                  </div>
                  <div className="wb-grid">
                    {gridCells.map((cell) => (
                      <button
                        key={cell.label}
                        type="button"
                        className={`wb-grid__cell ${gridSelection.row === cell.row && gridSelection.col === cell.col ? 'wb-grid__cell--active' : ''}`}
                        onClick={() => selectGridCell(cell.row, cell.col)}
                      >
                        {cell.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </CanvasFrame>

            <CanvasFrame
              label="Edit Targets"
              note="Each target gets a unique color and its own instruction line."
              actions={<button type="button" className="wb-mini" onClick={addTarget}>Add</button>}
            >
              <div className="wb-target-editor-list">
                {targets.map((target) => (
                  <div key={target.id} className="wb-target-editor">
                    <div className="wb-target-editor__head">
                      <button type="button" className="wb-target-editor__pick" onClick={() => setSelectedTargetId(target.id)}>
                        <span className="wb-target__swatch" style={{ background: target.color }} />
                        <strong>{target.label}</strong>
                      </button>
                      <button type="button" className="wb-mini" onClick={() => removeTarget(target.id)}>Remove</button>
                    </div>
                    <input className="wb-input" value={target.label} onChange={(event) => updateTarget(target.id, { label: event.target.value })} />
                    <input className="wb-input" value={target.note} onChange={(event) => updateTarget(target.id, { note: event.target.value })} placeholder="Short visual note" />
                    <textarea className="wb-textarea wb-textarea--compact" value={target.instruction} onChange={(event) => updateTarget(target.id, { instruction: event.target.value })} placeholder="Exact instruction for this target" />
                  </div>
                ))}
              </div>
            </CanvasFrame>
          </div>

          <div className="workbench-column workbench-column--right">
            <CanvasFrame
              label="Model Control"
              note="Choose a checkpoint. The selected one stays pinned until you change it."
              actions={<button type="button" className="wb-mini" onClick={() => setSelectedModelTitle(currentModel || LOCAL_MODELS[0].title)}>Use current</button>}
            >
              <label className="wb-field">
                <span>Orchestrator URL</span>
                <input className="wb-input" value={orchestratorUrl} onChange={(event) => setOrchestratorUrl(event.target.value)} />
              </label>
              <label className="wb-field">
                <span>Pinned checkpoint</span>
                <select className="wb-input" value={selectedModelTitle} onChange={(event) => setSelectedModelTitle(event.target.value)}>
                  {models.map((model) => (
                    <option key={model.title} value={model.title}>{model.title}</option>
                  ))}
                </select>
              </label>
              <label className="wb-field wb-field--check">
                <input type="checkbox" checked={modelLock === 'true'} onChange={(event) => setModelLock(event.target.checked ? 'true' : 'false')} />
                <span>Keep selected model active</span>
              </label>
              <div className="wb-inline-actions">
                <button type="button" className="wb-mini" onClick={() => void ensureSelectedModelActive()}>Sync model</button>
                <button type="button" className="wb-mini" onClick={() => { void refreshInventory().then(() => pushLog('Refreshed model inventory.', 4, 'scan complete')) }}>Rescan</button>
              </div>
              <div className="wb-model-summary">Current: {currentModel || 'unknown'}</div>
            </CanvasFrame>

            <CanvasFrame label="LoRAs" note="Select any available local LoRAs or leave them off for a clean baseline.">
              <div className="wb-lora-list">
                {loras.map((lora, index) => {
                  const selected = selectedLoras[index]
                  const enabled = selected?.enabled || false
                  const weight = selected?.weight ?? lora.weight ?? 1
                  return (
                    <div key={lora.name} className={`wb-lora ${enabled ? 'wb-lora--active' : ''}`}>
                      <label className="wb-field wb-field--check">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(event) => {
                            const checked = event.target.checked
                            setSelectedLoras((previous) => {
                              const next = [...previous]
                              next[index] = { ...lora, enabled: checked, weight: selected?.weight ?? 1 }
                              return next
                            })
                          }}
                        />
                        <span>{lora.name}</span>
                      </label>
                      <label className="wb-field">
                        <span>Weight</span>
                        <input
                          className="wb-input"
                          type="number"
                          step="0.05"
                          min="0"
                          max="2"
                          value={weight}
                          onChange={(event) => {
                            const nextWeight = clamp(Number(event.target.value) || 1, 0, 2)
                            setSelectedLoras((previous) => {
                              const next = [...previous]
                              next[index] = { ...lora, enabled, weight: nextWeight }
                              return next
                            })
                          }}
                        />
                      </label>
                    </div>
                  )
                })}
                {!loras.length ? <div className="wb-empty wb-empty--small">No LoRAs loaded. The workflow still runs without them.</div> : null}
              </div>
            </CanvasFrame>

            <CanvasFrame label="Progress Notifications" note="Mirror progress to a webhook so a Telegram workflow can repeat updates until completion or approval.">
              <label className="wb-field">
                <span>Notification webhook</span>
                <input className="wb-input" value={notificationUrl} onChange={(event) => setNotificationUrl(event.target.value)} placeholder="n8n / Telegram workflow URL" />
              </label>
              <label className="wb-field wb-field--check">
                <input type="checkbox" checked={notificationEnabled} onChange={(event) => setNotificationEnabled(event.target.checked)} />
                <span>Enable progress mirroring</span>
              </label>
              <label className="wb-field wb-field--check">
                <input type="checkbox" checked={mirrorTelegram} onChange={(event) => setMirrorTelegram(event.target.checked)} />
                <span>Telegram handoff mode</span>
              </label>
              <div className="wb-progress">
                <div className="wb-progress__bar">
                  <div className="wb-progress__fill" style={{ width: `${jobProgress}%` }} />
                </div>
                <div className="wb-progress__meta">
                  <span>{jobStatus}</span>
                  <span>{jobProgress}%</span>
                  <span>{jobEta}</span>
                </div>
              </div>
              <div className="wb-log">
                {jobLog.map((entry) => (
                  <div key={entry.id} className="wb-log__item">
                    <span className="wb-log__time">{entry.time}</span>
                    <span className="wb-log__message">{entry.message}</span>
                    <span className="wb-log__meta">{entry.percent !== null ? `${entry.percent}%` : ''} {entry.eta ? `• ${entry.eta}` : ''}</span>
                  </div>
                ))}
              </div>
            </CanvasFrame>

            <CanvasFrame label="Checkpoint History" note="Approved results become reusable checkpoints for cutout and base merges.">
              <div className="wb-history-list">
                {[...cutoutHistory, ...baseHistory].map((item, index) => (
                  <button key={`${item.kind}-${index}`} type="button" className="wb-history" onClick={() => setResultSrc(item.src)}>
                    <strong>{item.kind}</strong>
                    <span>{item.note}</span>
                    <small>{item.time}</small>
                  </button>
                ))}
                {!cutoutHistory.length && !baseHistory.length ? <div className="wb-empty wb-empty--small">No checkpoints saved yet.</div> : null}
              </div>
            </CanvasFrame>
          </div>
        </section>

        <section className="workbench-panel workbench-panel--wide">
          <div className="wb-panel__head">
            <div>
              <p className="wb-panel__title">Output / Approval</p>
              <p className="wb-panel__note">Preview the generated result, then approve it as a cutout checkpoint or merge it back into the base image.</p>
            </div>
            <div className="wb-panel__actions">
              <button type="button" className="wb-mini" onClick={saveCheckpoint}>Save checkpoint</button>
              <button type="button" className="wb-mini" onClick={() => void promoteCutoutCheckpoint()}>Approve cutout</button>
              <button type="button" className="wb-mini" onClick={() => void promoteBaseCheckpoint()}>Merge to base</button>
              <button type="button" className="wb-mini" onClick={() => copyText(JSON.stringify(jobSpec, null, 2)).then(() => setJobJsonCopied(true))}>Copy job JSON</button>
            </div>
          </div>

          <div className="workbench-output-grid">
            <div className="wb-output-card">
              <p className="wb-output-card__label">Generated image</p>
              {resultSrc ? <img className="wb-output-image" src={resultSrc} alt="Generated result" /> : <div className="wb-empty">Run Generate to see a preview.</div>}
              <p className="wb-output-card__note">{resultNote}</p>
            </div>
            <div className="wb-output-card">
              <p className="wb-output-card__label">Prompt / job spec</p>
              <textarea className="wb-textarea wb-textarea--job" value={JSON.stringify(jobSpec, null, 2)} readOnly />
              <p className="wb-output-card__note">{jobJsonCopied ? 'Job JSON copied.' : 'Copy the structured job to hand off to n8n or another agent.'}</p>
            </div>
          </div>

          <div className="wb-approval-actions">
            <button type="button" className="wb-button wb-button--primary" onClick={generatePreview}>Generate preview</button>
            <button type="button" className="wb-button" onClick={() => void promoteCutoutCheckpoint()}>Approve image 3</button>
            <button type="button" className="wb-button" onClick={() => void promoteBaseCheckpoint()}>Approve image 1</button>
            <button type="button" className="wb-button" onClick={() => setResultSrc('')}>Clear output</button>
          </div>
        </section>
      </div>
    </div>
  )
}
