import { useEffect, useMemo, useRef, useState } from 'react'
import JSZip from 'jszip'
import '../styles/workbench.css'

const DEFAULT_ORCHESTRATOR_URL = 'https://sd-orchestrator.gamedesign.152.53.117.246.sslip.io'
const DEFAULT_NOTIFICATION_URL = ''
const SAMPLE_BASE_IMAGE = '/assets/scenes/pgs/bg_castle.png'
const SAMPLE_EXCERPT = `The warrior studies the image, then marks one specific region for repair while keeping the rest of the scene's mood, color, and composition intact.`
const SAMPLE_ANALYSIS = `Base image: preserve the full composition and atmosphere. Target 1 should be the visible error area. Use the attachments as strict visual reference, not as loose inspiration.`
const SAMPLE_SD_PROMPT = `sharp high-resolution image, cinematic lighting, coherent anatomy, strong composition, preserve atmosphere, fix only the marked area, no extra limbs, no blur, no text, no watermark`
const COLOR_PALETTE = ['#ff4d4d', '#ff9f43', '#feca57', '#1dd1a1', '#54a0ff', '#5f27cd', '#ff6b81', '#00d2d3', '#2ecc71', '#e056fd', '#7bed9f', '#ff9ff3']
const LOCAL_MODELS = [
  { title: 'albedobaseXL_v13.safetensors', name: 'albedobaseXL_v13.safetensors' },
  { title: 'ponyDiffusionV6XL_v6StartWithThisOne.safetensors', name: 'ponyDiffusionV6XL_v6StartWithThisOne.safetensors' },
  { title: 'Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors', name: 'Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors' },
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

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function dataUrlToBase64(dataUrl) {
  return safeText(dataUrl).replace(/^data:[^;]+;base64,/, '')
}

function base64ToDataUrl(base64) {
  return base64 ? `data:image/png;base64,${base64}` : ''
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

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
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

function distancePointToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  if (dx === 0 && dy === 0) {
    return Math.hypot(px - x1, py - y1)
  }
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy), 0, 1)
  const nx = x1 + t * dx
  const ny = y1 + t * dy
  return Math.hypot(px - nx, py - ny)
}

function strokeIntersectsStroke(eraser, paint, threshold = 12) {
  if (!eraser?.points?.length || !paint?.points?.length) return false
  for (const paintPoint of paint.points) {
    for (let i = 0; i < eraser.points.length - 1; i += 1) {
      const a = eraser.points[i]
      const b = eraser.points[i + 1]
      if (distancePointToSegment(paintPoint.x, paintPoint.y, a.x, a.y, b.x, b.y) <= threshold) return true
    }
  }
  return false
}

function cloneStrokes(strokes) {
  return clone(strokes || [])
}

function strokeBounds(stroke) {
  const xs = stroke.points.map((point) => point.x)
  const ys = stroke.points.map((point) => point.y)
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  }
}

function defaultInstruction(color, index) {
  return `Target ${index + 1} (${color}): edit only the region marked with this color, preserve surrounding composition, keep lighting and texture consistent, and keep the rest of the image unchanged.`
}

function deriveEditTargets(strokes, previousTargets = []) {
  const paintColors = [...new Set((strokes || []).filter((stroke) => stroke.tool === 'paint').map((stroke) => stroke.color))]
  const previousByColor = new Map(previousTargets.map((target) => [target.color, target]))
  return paintColors.map((color, index) => {
    const previous = previousByColor.get(color)
    return {
      id: previous?.id || makeId(),
      label: previous?.label || `Target ${index + 1}`,
      color,
      instruction: previous?.instruction || defaultInstruction(color, index),
      note: previous?.note || '',
    }
  })
}

function makePromptBundle({ excerpt, analysis, sdPrompt, selectedModel, baseImage, cutoutRect, cutoutImage, editMapImage, editTargets }) {
  const targetLines = editTargets.map((target, index) => `${index + 1}. ${target.label} | ${target.color} | ${target.instruction}`)
  const targetSummary = targetLines.length ? targetLines.join('\n') : 'none'
  const modelLine = selectedModel ? `Preferred model: ${selectedModel}` : 'Preferred model: auto'

  const strictPrompt = [
    'Image edit job.',
    modelLine,
    baseImage ? `Base image: ${baseImage.width}x${baseImage.height}` : 'Base image: none',
    cutoutRect ? `Cutout rect: x=${Math.round(cutoutRect.x)} y=${Math.round(cutoutRect.y)} w=${Math.round(cutoutRect.w)} h=${Math.round(cutoutRect.h)}` : 'Cutout rect: none',
    cutoutImage ? `Stamped cutout: ${cutoutImage.width}x${cutoutImage.height}` : 'Stamped cutout: none',
    editMapImage ? `Edit map: ${editMapImage.width}x${editMapImage.height}` : 'Edit map: none',
    `Source excerpt:\n${excerpt}`,
    `Scene analysis:\n${analysis}`,
    `SD prompt:\n${sdPrompt}`,
    `Edit targets:\n${targetSummary}`,
    'Preserve all unmarked areas.',
    'Only modify the colored targets.',
  ].join('\n\n')

  const naturalPrompt = [
    'Prepare an image edit prompt from the current workbench state.',
    `Base image present: ${baseImage ? 'yes' : 'no'}`,
    `Cutout present: ${cutoutImage ? 'yes' : 'no'}`,
    `Edit map present: ${editMapImage ? 'yes' : 'no'}`,
    `Targets:\n${targetSummary}`,
    `Excerpt:\n${excerpt}`,
    `Analysis:\n${analysis}`,
    `Prompt draft:\n${sdPrompt}`,
  ].join('\n\n')

  const jobSpec = {
    mode: 'image-workbench',
    selected_model_title: selectedModel || null,
    base_image: baseImage ? { width: baseImage.width, height: baseImage.height, name: baseImage.name } : null,
    crop_rect: cutoutRect ? { x: Math.round(cutoutRect.x), y: Math.round(cutoutRect.y), w: Math.round(cutoutRect.w), h: Math.round(cutoutRect.h) } : null,
    cutout_image: cutoutImage ? { width: cutoutImage.width, height: cutoutImage.height, name: cutoutImage.name } : null,
    edit_map_image: editMapImage ? { width: editMapImage.width, height: editMapImage.height, name: editMapImage.name } : null,
    edit_targets: editTargets.map((target) => ({
      id: target.id,
      label: target.label,
      color: target.color,
      instruction: target.instruction,
      note: target.note,
    })),
    prompts: { excerpt, analysis, sdPrompt, strictPrompt, naturalPrompt },
  }

  return { strictPrompt, naturalPrompt, jobSpec }
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

function Panel({ title, note, actions, children, className = '' }) {
  return (
    <section className={`wbx-panel ${className}`.trim()}>
      <div className="wbx-panel__head">
        <div>
          <p className="wbx-panel__title">{title}</p>
          {note ? <p className="wbx-panel__note">{note}</p> : null}
        </div>
        {actions ? <div className="wbx-panel__actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  )
}

function renderToCanvas(imageSrc, strokes, width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, width)
  canvas.height = Math.max(1, height)
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  for (const stroke of strokes) {
    if (stroke.tool !== 'paint' || stroke.points.length < 1) continue
    ctx.save()
    ctx.strokeStyle = stroke.color
    ctx.lineWidth = stroke.size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
    for (let i = 1; i < stroke.points.length; i += 1) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
    }
    ctx.stroke()
    ctx.restore()
  }
  return canvas
}

export default function ImageWorkbench({ onBack }) {
  const orchestratorKey = 'workbench.orchestratorUrl'
  const selectedModelKey = 'workbench.selectedModel'
  const modelLockKey = 'workbench.modelLock'
  const brushSizeKey = 'workbench.brushSize'
  const activeTabKey = 'workbench.activeTab'

  const [activeTab, setActiveTab] = useStorageState(activeTabKey, 'main')
  const [orchestratorUrl, setOrchestratorUrl] = useStorageState(orchestratorKey, DEFAULT_ORCHESTRATOR_URL)
  const [selectedModelTitle, setSelectedModelTitle] = useStorageState(selectedModelKey, LOCAL_MODELS[0].title)
  const [modelLock, setModelLock] = useStorageState(modelLockKey, 'true')
  const [brushSize, setBrushSize] = useStorageState(brushSizeKey, '18')

  const [models, setModels] = useState(LOCAL_MODELS)
  const [currentModel, setCurrentModel] = useState(LOCAL_MODELS[0].title)
  const [inventoryStatus, setInventoryStatus] = useState('Using local model list.')
  const [jobStatus, setJobStatus] = useState('Idle')
  const [jobProgress, setJobProgress] = useState(0)
  const [jobEta, setJobEta] = useState('0s')
  const [jobLog, setJobLog] = useState([])
  const [jobJsonCopied, setJobJsonCopied] = useState(false)

  const [excerpt, setExcerpt] = useState(SAMPLE_EXCERPT)
  const [analysis, setAnalysis] = useState(SAMPLE_ANALYSIS)
  const [sdPrompt, setSdPrompt] = useState(SAMPLE_SD_PROMPT)

  const [baseImageSrc, setBaseImageSrc] = useState('')
  const [baseImage, setBaseImage] = useState(null)
  const [cutoutRect, setCutoutRect] = useState(null)
  const [cutoutSrc, setCutoutSrc] = useState('')
  const [cutoutImage, setCutoutImage] = useState(null)
  const [editMapSrc, setEditMapSrc] = useState('')
  const [editMapImage, setEditMapImage] = useState(null)

  const [editTargets, setEditTargets] = useState([])
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorTool, setEditorTool] = useState('paint')
  const [editorBrush, setEditorBrush] = useState(brushSize)
  const [editorPaletteIndex, setEditorPaletteIndex] = useState(0)
  const [editorStrokes, setEditorStrokes] = useState([])
  const [editorDraftStroke, setEditorDraftStroke] = useState(null)
  const [selectedTargetId, setSelectedTargetId] = useState('')

  const [generationItems, setGenerationItems] = useState([])
  const [selectedGenerationId, setSelectedGenerationId] = useState('')
  const [checkpoints, setCheckpoints] = useState([])

  const [viewerZoom, setViewerZoom] = useState(1)
  const [viewerPan, setViewerPan] = useState({ x: 0, y: 0 })
  const [viewerRectDraft, setViewerRectDraft] = useState(null)
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [viewerSize, setViewerSize] = useState({ width: 0, height: 0 })

  const [promptCopyState, setPromptCopyState] = useState('Copy job JSON')

  const baseDropRef = useRef(null)
  const viewerRef = useRef(null)
  const minimapCanvasRef = useRef(null)
  const editorCanvasRef = useRef(null)
  const editorViewportRef = useRef(null)
  const viewerStateRef = useRef({ mode: null, pointerId: null, startPoint: null, startPan: null, startRect: null })
  const editorStateRef = useRef({ mode: null, pointerId: null, startPoint: null, activeStroke: null, startTool: null, paintColor: null })
  const editorUndoRef = useRef([])
  const editorRedoRef = useRef([])
  const viewerTouchedRef = useRef(false)
  const viewerInitSourceRef = useRef('')
  const editorStrokesRef = useRef([])

  useEffect(() => {
    editorStrokesRef.current = editorStrokes
  }, [editorStrokes])

  useEffect(() => {
    if (!selectedTargetId && editTargets[0]?.id) setSelectedTargetId(editTargets[0].id)
    if (selectedTargetId && !editTargets.find((target) => target.id === selectedTargetId)) {
      setSelectedTargetId(editTargets[0]?.id || '')
    }
  }, [editTargets, selectedTargetId])

  useEffect(() => {
    const node = viewerRef.current
    if (!node) return undefined
    const update = () => {
      const rect = node.getBoundingClientRect()
      setViewerSize({ width: rect.width, height: rect.height })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!baseImage || !viewerSize.width || !viewerSize.height) return
    if (viewerTouchedRef.current && viewerInitSourceRef.current === baseImageSrc) return
    const fit = clamp(Math.min(viewerSize.width / baseImage.width, viewerSize.height / baseImage.height), 0.1, 8)
    const panX = (viewerSize.width - baseImage.width * fit) / 2
    const panY = (viewerSize.height - baseImage.height * fit) / 2
    setViewerZoom(fit)
    setViewerPan({ x: panX, y: panY })
    viewerTouchedRef.current = false
    viewerInitSourceRef.current = baseImageSrc
  }, [baseImage, baseImageSrc, viewerSize.width, viewerSize.height])

  useEffect(() => {
    if (!baseImageSrc) {
      setBaseImage(null)
      return
    }
    let cancelled = false
    loadImage(baseImageSrc)
      .then((img) => {
        if (cancelled) return
        setBaseImage({
          src: baseImageSrc,
          img,
          width: img.naturalWidth,
          height: img.naturalHeight,
          name: baseImageSrc.split('/').pop() || 'base-image',
        })
        if (!cutoutRect) {
          const size = Math.round(Math.min(img.naturalWidth, img.naturalHeight) * 0.6)
          setCutoutRect({
            x: Math.max(0, Math.round((img.naturalWidth - size) / 2)),
            y: Math.max(0, Math.round((img.naturalHeight - size) / 2)),
            w: Math.max(64, size),
            h: Math.max(64, size),
          })
        }
      })
      .catch(() => setJobStatus('Failed to load base image'))
    return () => { cancelled = true }
  }, [baseImageSrc])

  useEffect(() => {
    if (!cutoutSrc) {
      setCutoutImage(null)
      return
    }
    let cancelled = false
    loadImage(cutoutSrc)
      .then((img) => {
        if (cancelled) return
        setCutoutImage({
          src: cutoutSrc,
          img,
          width: img.naturalWidth,
          height: img.naturalHeight,
          name: 'cutout-image',
        })
      })
      .catch(() => setJobStatus('Failed to load cutout image'))
    return () => { cancelled = true }
  }, [cutoutSrc])

  useEffect(() => {
    if (!editMapSrc) {
      setEditMapImage(null)
      return
    }
    let cancelled = false
    loadImage(editMapSrc)
      .then((img) => {
        if (cancelled) return
        setEditMapImage({
          src: editMapSrc,
          img,
          width: img.naturalWidth,
          height: img.naturalHeight,
          name: 'edit-map-image',
        })
      })
      .catch(() => setJobStatus('Failed to load edit map'))
    return () => { cancelled = true }
  }, [editMapSrc])

  useEffect(() => {
    const canvas = minimapCanvasRef.current
    if (!canvas || !baseImage) return
    const size = 176
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, size, size)
    const scale = Math.min(size / baseImage.width, size / baseImage.height)
    const drawW = baseImage.width * scale
    const drawH = baseImage.height * scale
    const offsetX = (size - drawW) / 2
    const offsetY = (size - drawH) / 2
    ctx.drawImage(baseImage.img, offsetX, offsetY, drawW, drawH)
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'
    ctx.lineWidth = 2
    if (viewerSize.width && viewerSize.height && viewerZoom > 0) {
      const visibleX = clamp((-viewerPan.x) / viewerZoom, 0, baseImage.width)
      const visibleY = clamp((-viewerPan.y) / viewerZoom, 0, baseImage.height)
      const visibleW = clamp(viewerSize.width / viewerZoom, 0, baseImage.width)
      const visibleH = clamp(viewerSize.height / viewerZoom, 0, baseImage.height)
      ctx.strokeRect(offsetX + visibleX * scale, offsetY + visibleY * scale, visibleW * scale, visibleH * scale)
    }
    if (cutoutRect) {
      ctx.strokeStyle = 'rgba(127, 184, 255, 0.95)'
      ctx.strokeRect(offsetX + cutoutRect.x * scale, offsetY + cutoutRect.y * scale, cutoutRect.w * scale, cutoutRect.h * scale)
    }
  }, [baseImage, cutoutRect, viewerPan, viewerSize.height, viewerSize.width, viewerZoom])

  useEffect(() => {
    const canvas = editorCanvasRef.current
    if (!canvas || !cutoutImage) return
    canvas.width = cutoutImage.width
    canvas.height = cutoutImage.height
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const stroke of editorStrokes) {
      if (stroke.tool !== 'paint') continue
      ctx.save()
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.size
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i += 1) ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      ctx.stroke()
      ctx.restore()
    }
    if (editorDraftStroke?.points?.length) {
      const stroke = editorDraftStroke
      ctx.save()
      ctx.strokeStyle = stroke.tool === 'erase' ? 'rgba(255,255,255,0.7)' : stroke.color
      ctx.lineWidth = stroke.size
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      if (stroke.tool === 'erase') {
        ctx.setLineDash([12, 8])
      }
      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i += 1) ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      ctx.stroke()
      ctx.restore()
    }
  }, [cutoutImage, editorDraftStroke, editorStrokes])

  useEffect(() => {
    setEditorBrush(brushSize)
  }, [brushSize])

  useEffect(() => {
    setModels(LOCAL_MODELS)
    setCurrentModel(LOCAL_MODELS[0].title)
    setInventoryStatus('Using local model list. Click Rescan from Tailscale to load live inventory.')
    if (!selectedModelTitle || !LOCAL_MODELS.some((model) => model.title === selectedModelTitle)) {
      setSelectedModelTitle(LOCAL_MODELS[0].title)
    }
  }, [])

  const selectedTarget = useMemo(
    () => editTargets.find((target) => target.id === selectedTargetId) || editTargets[0] || null,
    [editTargets, selectedTargetId],
  )

  const promptBundle = useMemo(
    () => makePromptBundle({
      excerpt,
      analysis,
      sdPrompt,
      selectedModel: selectedModelTitle,
      baseImage,
      cutoutRect,
      cutoutImage,
      editMapImage,
      editTargets,
    }),
    [excerpt, analysis, sdPrompt, selectedModelTitle, baseImage, cutoutRect, cutoutImage, editMapImage, editTargets],
  )

  const selectedGeneration = useMemo(
    () => generationItems.find((item) => item.id === selectedGenerationId) || generationItems[0] || null,
    [generationItems, selectedGenerationId],
  )

  function pushLog(message, percent = null, eta = null) {
    const entry = {
      id: makeId(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      message,
      percent,
      eta,
    }
    setJobLog((previous) => [entry, ...previous].slice(0, 20))
    if (percent !== null) setJobProgress(percent)
    if (eta) setJobEta(eta)
  }

  function resetDerivedState() {
    setCutoutRect(null)
    setCutoutSrc('')
    setEditMapSrc('')
    setEditTargets([])
    setEditorStrokes([])
    setEditorDraftStroke(null)
    setGenerationItems([])
    setSelectedGenerationId('')
    setJobLog([])
    setJobStatus('Idle')
    setJobProgress(0)
    setJobEta('0s')
  }

  async function loadBaseImageFromFile(file) {
    const src = await readFileAsDataUrl(file)
    setBaseImageSrc(src)
    resetDerivedState()
    pushLog(`Loaded base image: ${file.name}`, 3, '0s')
  }

  async function handleBaseDrop(event) {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) await loadBaseImageFromFile(file)
  }

  function setDemoScene() {
    setExcerpt(SAMPLE_EXCERPT)
    setAnalysis(SAMPLE_ANALYSIS)
    setSdPrompt(SAMPLE_SD_PROMPT)
    setBaseImageSrc(SAMPLE_BASE_IMAGE)
    resetDerivedState()
    pushLog('Loaded the demo base image and sample instructions.', 2, '0s')
  }

  function clientToImagePoint(event, bounds, zoom, pan) {
    return {
      x: (event.clientX - bounds.left - pan.x) / zoom,
      y: (event.clientY - bounds.top - pan.y) / zoom,
    }
  }

  function clampRect(rect, image) {
    const x = clamp(rect.x, 0, image.width)
    const y = clamp(rect.y, 0, image.height)
    const w = clamp(rect.w, 1, image.width - x)
    const h = clamp(rect.h, 1, image.height - y)
    return { x, y, w, h }
  }

  function applyViewerPan(nextPan, nextZoom = viewerZoom) {
    viewerTouchedRef.current = true
    setViewerPan(nextPan)
    setViewerZoom(nextZoom)
  }

  function startViewerInteraction(event) {
    if (!baseImage || !viewerRef.current) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    const bounds = event.currentTarget.getBoundingClientRect()
    const point = clientToImagePoint(event, bounds, viewerZoom, viewerPan)
    const mode = event.button === 2 ? 'rect' : 'pan'
    viewerStateRef.current = {
      mode,
      pointerId: event.pointerId,
      startPoint: point,
      startPan: { ...viewerPan },
      startRect: cutoutRect ? { ...cutoutRect } : null,
      draftRect: null,
    }
    if (mode === 'rect') {
      setViewerRectDraft({ x: point.x, y: point.y, w: 0, h: 0 })
    }
  }

  function moveViewerInteraction(event) {
    const state = viewerStateRef.current
    if (!state.mode || !baseImage || !viewerRef.current) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const point = clientToImagePoint(event, bounds, viewerZoom, viewerPan)
    if (state.mode === 'pan') {
      const dx = event.clientX - bounds.left - (state.startPoint.x * viewerZoom + state.startPan.x)
      const dy = event.clientY - bounds.top - (state.startPoint.y * viewerZoom + state.startPan.y)
      applyViewerPan({ x: state.startPan.x + dx, y: state.startPan.y + dy }, viewerZoom)
      return
    }
    const rect = {
      x: Math.min(state.startPoint.x, point.x),
      y: Math.min(state.startPoint.y, point.y),
      w: Math.abs(point.x - state.startPoint.x),
      h: Math.abs(point.y - state.startPoint.y),
    }
    const clamped = clampRect(rect, baseImage)
    viewerStateRef.current.draftRect = clamped
    setViewerRectDraft(clamped)
  }

  function endViewerInteraction(event) {
    const state = viewerStateRef.current
    if (!state.mode) return
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (state.mode === 'rect' && state.draftRect && state.draftRect.w > 2 && state.draftRect.h > 2) {
      setCutoutRect(state.draftRect)
    }
    setViewerRectDraft(null)
    viewerStateRef.current = { mode: null, pointerId: null, startPoint: null, startPan: null, startRect: null, draftRect: null }
  }

  function zoomViewer(event) {
    if (!baseImage || !viewerRef.current) return
    event.preventDefault()
    const bounds = event.currentTarget.getBoundingClientRect()
    const pointBefore = clientToImagePoint(event, bounds, viewerZoom, viewerPan)
    const nextZoom = clamp(viewerZoom + (event.deltaY < 0 ? 0.12 : -0.12), 0.1, 8)
    const nextPan = {
      x: event.clientX - bounds.left - pointBefore.x * nextZoom,
      y: event.clientY - bounds.top - pointBefore.y * nextZoom,
    }
    applyViewerPan(nextPan, nextZoom)
  }

  async function stampCutout() {
    if (!baseImageSrc || !cutoutRect) return
    const src = await cropImage(baseImageSrc, cutoutRect)
    setCutoutSrc(src)
    pushLog('Stamped the selected cutout from the base image.', 22, '0s')
  }

  function openEditor() {
    if (!cutoutSrc) return
    setEditorOpen(true)
  }

  function pushEditorUndoSnapshot() {
    editorUndoRef.current = [cloneStrokes(editorStrokesRef.current), ...editorUndoRef.current].slice(0, 24)
    editorRedoRef.current = []
  }

  function startEditorStroke(event) {
    if (!cutoutImage || !editorCanvasRef.current) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)

    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width) * cutoutImage.width
    const y = ((event.clientY - bounds.top) / bounds.height) * cutoutImage.height
    const isRight = event.button === 2
    const paintColor = COLOR_PALETTE[editorPaletteIndex % COLOR_PALETTE.length]

    if (!isRight) {
      setEditorPaletteIndex((value) => value + 1)
    }
    if (editorTool !== 'erase') setSelectedTargetId((current) => current || editTargets[0]?.id || '')

    pushEditorUndoSnapshot()

    const stroke = {
      id: makeId(),
      tool: editorTool,
      color: editorTool === 'paint' ? paintColor : '#ffffff',
      size: clamp(Number(editorBrush) || 18, 4, 72),
      points: [{ x, y }],
    }
    setEditorDraftStroke(stroke)
    editorStateRef.current = { mode: editorTool, pointerId: event.pointerId, startPoint: { x, y }, activeStroke: stroke, startTool: editorTool, paintColor }
    if (editorTool === 'paint') {
      setJobStatus(`Painting ${paintColor}`)
    } else {
      setJobStatus('Erasing whole strokes')
    }
  }

  function moveEditorStroke(event) {
    const state = editorStateRef.current
    if (!state.mode || !editorDraftStroke || !editorCanvasRef.current || !cutoutImage) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width) * cutoutImage.width
    const y = ((event.clientY - bounds.top) / bounds.height) * cutoutImage.height
    setEditorDraftStroke((previous) => {
      if (!previous) return previous
      const last = previous.points[previous.points.length - 1]
      if (last && Math.hypot(last.x - x, last.y - y) < 1.5) return previous
      return { ...previous, points: [...previous.points, { x, y }] }
    })
  }

  function finishEditorStroke(event) {
    const state = editorStateRef.current
    if (!state.mode || !editorDraftStroke) return
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const stroke = editorDraftStroke
    setEditorDraftStroke(null)

    if (state.mode === 'paint') {
      setEditorStrokes((previous) => [...previous, stroke])
    } else {
      setEditorStrokes((previous) => previous.filter((candidate) => !strokeIntersectsStroke(stroke, candidate, clamp(Number(editorBrush) || 18, 4, 72) * 0.9)))
    }

    editorStateRef.current = { mode: null, pointerId: null, startPoint: null, activeStroke: null, startTool: null, paintColor: null }
  }

  function undoEditor() {
    const previous = editorUndoRef.current.shift()
    if (!previous) return
    editorRedoRef.current = [cloneStrokes(editorStrokesRef.current), ...editorRedoRef.current].slice(0, 24)
    setEditorStrokes(previous)
    setEditorDraftStroke(null)
  }

  function redoEditor() {
    const next = editorRedoRef.current.shift()
    if (!next) return
    editorUndoRef.current = [cloneStrokes(editorStrokesRef.current), ...editorUndoRef.current].slice(0, 24)
    setEditorStrokes(next)
    setEditorDraftStroke(null)
  }

  function clearEditor() {
    pushEditorUndoSnapshot()
    setEditorStrokes([])
    setEditorDraftStroke(null)
    setEditTargets([])
  }

  async function saveEditorMap() {
    if (!cutoutImage) return
    const canvas = document.createElement('canvas')
    canvas.width = cutoutImage.width
    canvas.height = cutoutImage.height
    const ctx = canvas.getContext('2d')
    const bg = await loadImage(cutoutSrc || cutoutImage.src)
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height)
    for (const stroke of editorStrokesRef.current) {
      if (stroke.tool !== 'paint' || stroke.points.length < 1) continue
      ctx.save()
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.size
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i += 1) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      }
      ctx.stroke()
      ctx.restore()
    }
    const src = canvas.toDataURL('image/png')
    const nextTargets = deriveEditTargets(editorStrokesRef.current, editTargets)
    setEditMapSrc(src)
    setEditTargets(nextTargets)
    if (!selectedTargetId && nextTargets[0]?.id) setSelectedTargetId(nextTargets[0].id)
    setEditorOpen(false)
    pushLog('Saved the edit map and generated edit targets.', 54, 'ready')
  }

  function restoreViewerFromSelection(rect) {
    if (!baseImage || !viewerRef.current || !rect) return
    const fit = clamp(Math.min(viewerSize.width / baseImage.width, viewerSize.height / baseImage.height), 0.1, 8)
    const centerX = rect.x + rect.w / 2
    const centerY = rect.y + rect.h / 2
    const nextPan = {
      x: viewerSize.width / 2 - centerX * fit,
      y: viewerSize.height / 2 - centerY * fit,
    }
    applyViewerPan(nextPan, fit)
  }

  async function ensureSelectedModelActive() {
    if (!selectedModelTitle || modelLock !== 'true') return
    if (currentModel === selectedModelTitle) return
    setJobStatus(`Switching model to ${selectedModelTitle}...`)
    pushLog(`Switching active checkpoint to ${selectedModelTitle}`, 12, 'waiting')
    await fetchJson(`${orchestratorUrl.replace(/\/$/, '')}/models/switch`, {
      method: 'POST',
      body: JSON.stringify({ model_title: selectedModelTitle }),
    }, 120000)
    setCurrentModel(selectedModelTitle)
    pushLog(`Model switch confirmed: ${selectedModelTitle}`, 16, 'done')
  }

  async function refreshInventory() {
    try {
      setInventoryStatus('Loading live inventory...')
      const modelsResponse = await fetchJson(`${orchestratorUrl.replace(/\/$/, '')}/models`, {}, 25000)
      const normalized = Array.isArray(modelsResponse)
        ? modelsResponse.map((item) => ({
            title: item.title || item.model_name || item.name || '',
            name: item.model_name || item.name || item.title || '',
          })).filter((item) => item.title)
        : []
      setModels(normalized.length ? normalized : LOCAL_MODELS)
      setCurrentModel(normalized[0]?.title || LOCAL_MODELS[0].title)
      setInventoryStatus(`Loaded ${normalized.length || LOCAL_MODELS.length} checkpoint(s).`)
      if (!selectedModelTitle || !normalized.some((model) => model.title === selectedModelTitle)) {
        setSelectedModelTitle(normalized[0]?.title || LOCAL_MODELS[0].title)
      }
    } catch {
      setInventoryStatus('Live inventory unavailable; using local model list.')
      setModels(LOCAL_MODELS)
      setCurrentModel(LOCAL_MODELS[0].title)
    }
  }

  async function generatePreview() {
    let ticker = null
    try {
      setJobStatus('Preparing job...')
      setJobProgress(1)
      ticker = window.setInterval(() => {
        setJobProgress((value) => clamp(value + 3, 0, 92))
      }, 1400)

      await ensureSelectedModelActive()
      const activeModelTitle = selectedModelTitle || currentModel || LOCAL_MODELS[0].title
      const previewPrompt = promptBundle.strictPrompt

      let response = null
      if (cutoutImage && editMapSrc) {
        setJobStatus('Sending inpaint job...')
        pushLog('Sending the cutout and edit map to the orchestrator.', 24, 'rendering')
        response = await fetchJson(`${orchestratorUrl.replace(/\/$/, '')}/inpaint`, {
          method: 'POST',
          body: JSON.stringify({
            prompt: previewPrompt,
            negative_prompt: 'blurry, malformed, low detail, broken anatomy, text, watermark, extra limbs',
            init_image_b64: dataUrlToBase64(cutoutSrc),
            mask_b64: dataUrlToBase64(editMapSrc),
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
          const preview = cutoutSrc || baseImageSrc
          return { image_base64: dataUrlToBase64(preview), output: 'local preview fallback', model: activeModelTitle, seed: 0 }
        })
      } else {
        setJobStatus('Sending planned generation job...')
        pushLog('Sending the job to the planned generation endpoint.', 24, 'rendering')
        response = await fetchJson(`${orchestratorUrl.replace(/\/$/, '')}/generate/planned`, {
          method: 'POST',
          body: JSON.stringify({
            prompt: previewPrompt,
            preferred_model_title: activeModelTitle,
            style: 'auto',
            dry_run: false,
          }),
        }, 240000).catch(async () => {
          const preview = cutoutSrc || baseImageSrc
          return { image_base64: dataUrlToBase64(preview), output: 'local preview fallback', model: activeModelTitle, seed: 0 }
        })
      }

      const imageBase64 = Array.isArray(response?.images) && response.images[0]
        ? response.images[0]
        : response?.image_base64 || response?.output_image || ''

      const normalized = imageBase64
        ? (imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`)
        : (cutoutSrc || baseImageSrc)

      const generated = {
        id: makeId(),
        src: normalized,
        note: response?.output || `Result from ${response?.model || activeModelTitle}`,
        model: response?.model || activeModelTitle,
        seed: response?.seed ?? null,
        createdAt: new Date().toLocaleString(),
        prompt: previewPrompt,
      }

      setGenerationItems((previous) => [generated, ...previous].slice(0, 24))
      setSelectedGenerationId(generated.id)
      setJobStatus('Preview ready')
      setJobProgress(100)
      setJobEta('done')
      pushLog(`Preview ready: ${generated.model}`, 100, 'done')
    } catch (error) {
      setJobStatus(`Error: ${error.message}`)
      pushLog(`Job failed: ${error.message}`, 0, 'unknown')
    } finally {
      if (ticker) window.clearInterval(ticker)
    }
  }

  function selectGeneration(id) {
    const item = generationItems.find((entry) => entry.id === id)
    if (!item) return
    setSelectedGenerationId(id)
  }

  function discardGeneration(id) {
    setGenerationItems((previous) => previous.filter((item) => item.id !== id))
    if (selectedGenerationId === id) setSelectedGenerationId('')
  }

  function removeCheckpoint(id) {
    setCheckpoints((previous) => previous.filter((item) => item.id !== id))
  }

  function keepNewestCheckpoint() {
    setCheckpoints((previous) => (previous.length ? [previous[0]] : []))
  }

  async function makeCheckpointRecord(kind, approvedItem, snapshot = {}) {
    const snapshotBaseImageSrc = snapshot.baseImageSrc ?? baseImageSrc
    const snapshotCutoutSrc = snapshot.cutoutSrc ?? cutoutSrc
    const snapshotEditMapSrc = snapshot.editMapSrc ?? editMapSrc
    const snapshotCutoutRect = snapshot.cutoutRect ?? cutoutRect
    const snapshotEditTargets = snapshot.editTargets ?? editTargets
    const snapshotBaseImage = snapshot.baseImage ?? baseImage
    const snapshotCutoutImage = snapshot.cutoutImage ?? cutoutImage
    const snapshotEditMapImage = snapshot.editMapImage ?? editMapImage
    const snapshotSelectedModelTitle = snapshot.selectedModelTitle ?? selectedModelTitle
    const snapshotExcerpt = snapshot.excerpt ?? excerpt
    const snapshotAnalysis = snapshot.analysis ?? analysis
    const snapshotSdPrompt = snapshot.sdPrompt ?? sdPrompt

    const createdAt = new Date().toISOString()
    const manifest = {
      id: makeId(),
      kind,
      createdAt,
      baseImage: snapshotBaseImage ? { width: snapshotBaseImage.width, height: snapshotBaseImage.height, name: snapshotBaseImage.name } : null,
      cutoutRect: snapshotCutoutRect,
      cutoutImage: snapshotCutoutImage ? { width: snapshotCutoutImage.width, height: snapshotCutoutImage.height, name: snapshotCutoutImage.name } : null,
      editMapImage: snapshotEditMapImage ? { width: snapshotEditMapImage.width, height: snapshotEditMapImage.height, name: snapshotEditMapImage.name } : null,
      editTargets: snapshotEditTargets,
      prompts: {
        excerpt: snapshotExcerpt,
        analysis: snapshotAnalysis,
        sdPrompt: snapshotSdPrompt,
        strictPrompt: promptBundle.strictPrompt,
        naturalPrompt: promptBundle.naturalPrompt,
      },
      selectedModelTitle: snapshotSelectedModelTitle,
      approvedItem: approvedItem ? {
        id: approvedItem.id,
        note: approvedItem.note,
        model: approvedItem.model,
        seed: approvedItem.seed,
        createdAt: approvedItem.createdAt,
      } : null,
    }

    const zip = new JSZip()
    zip.file('manifest.json', JSON.stringify(manifest, null, 2))
    if (snapshotBaseImageSrc) zip.file('images/base.png', dataUrlToBase64(snapshotBaseImageSrc), { base64: true })
    if (snapshotCutoutSrc) zip.file('images/cutout.png', dataUrlToBase64(snapshotCutoutSrc), { base64: true })
    if (snapshotEditMapSrc) zip.file('images/edit-map.png', dataUrlToBase64(snapshotEditMapSrc), { base64: true })
    if (approvedItem?.src) zip.file('images/approved.png', dataUrlToBase64(approvedItem.src), { base64: true })
    const blob = await zip.generateAsync({ type: 'blob' })
    return { id: manifest.id, createdAt, kind, manifest, blob, filename: `image-workbench-${manifest.id}.zip` }
  }

  async function saveCheckpoint(kind, approvedItem = null, snapshot = {}) {
    const record = await makeCheckpointRecord(kind, approvedItem, snapshot)
    setCheckpoints((previous) => [record, ...previous].slice(0, 12))
    downloadBlob(record.blob, record.filename)
    pushLog(`Saved ${kind} checkpoint.`, 100, 'done')
  }

  async function approveSelectedGeneration(mode) {
    if (!selectedGeneration) return
    if (mode === 'cutout') {
      const nextCutoutSrc = selectedGeneration.src
      setCutoutSrc(selectedGeneration.src)
      setCutoutRect((previous) => previous || cutoutRect)
      await saveCheckpoint('cutout', selectedGeneration, { cutoutSrc: nextCutoutSrc })
      pushLog('Approved the cutout candidate.', 100, 'done')
      return
    }
    if (mode === 'base') {
      if (!baseImageSrc || !cutoutRect) return
      const merged = await mergeImageAtRect(baseImageSrc, selectedGeneration.src, cutoutRect)
      if (!merged) return
      setBaseImageSrc(merged)
      await saveCheckpoint('base', selectedGeneration, { baseImageSrc: merged })
      pushLog('Merged the candidate back into the base image.', 100, 'done')
    }
  }

  async function restoreCheckpointFromRecord(record) {
    const zip = await JSZip.loadAsync(record.blob)
    const manifestText = await zip.file('manifest.json').async('string')
    const manifest = JSON.parse(manifestText)
    const readImage = async (path) => {
      const file = zip.file(path)
      return file ? base64ToDataUrl(await file.async('base64')) : ''
    }
    const base = await readImage('images/base.png')
    const cutout = await readImage('images/cutout.png')
    const editMap = await readImage('images/edit-map.png')
    const approved = await readImage('images/approved.png')

    if (base) setBaseImageSrc(base)
    if (cutout) setCutoutSrc(cutout)
    if (editMap) setEditMapSrc(editMap)
    if (approved) {
      setGenerationItems((previous) => [{ id: makeId(), src: approved, note: 'Restored approved image', model: manifest.selectedModelTitle || selectedModelTitle, seed: null, createdAt: new Date().toLocaleString(), prompt: manifest.prompts?.strictPrompt || '' }, ...previous].slice(0, 24))
      setSelectedGenerationId((previous) => previous || '')
    }
    setCutoutRect(manifest.cutoutRect || null)
    setEditTargets(manifest.editTargets || [])
    setExcerpt(manifest.prompts?.excerpt || excerpt)
    setAnalysis(manifest.prompts?.analysis || analysis)
    setSdPrompt(manifest.prompts?.sdPrompt || sdPrompt)
    if (manifest.selectedModelTitle) setSelectedModelTitle(manifest.selectedModelTitle)
    setJobStatus('Checkpoint restored')
    pushLog('Restored checkpoint from zip.', 100, 'done')
  }

  async function importCheckpointFile(file) {
    const blob = file
    const zip = await JSZip.loadAsync(blob)
    const manifestText = await zip.file('manifest.json').async('string')
    const manifest = JSON.parse(manifestText)
    const readImage = async (path) => {
      const entry = zip.file(path)
      return entry ? base64ToDataUrl(await entry.async('base64')) : ''
    }
    const record = {
      id: manifest.id || makeId(),
      createdAt: manifest.createdAt || new Date().toISOString(),
      kind: manifest.kind || 'imported',
      blob,
      filename: file.name,
      manifest,
      imported: true,
    }
    setCheckpoints((previous) => [record, ...previous].slice(0, 12))
    const base = await readImage('images/base.png')
    const cutout = await readImage('images/cutout.png')
    const editMap = await readImage('images/edit-map.png')
    if (base) setBaseImageSrc(base)
    if (cutout) setCutoutSrc(cutout)
    if (editMap) setEditMapSrc(editMap)
    setCutoutRect(manifest.cutoutRect || null)
    setEditTargets(manifest.editTargets || [])
    setExcerpt(manifest.prompts?.excerpt || excerpt)
    setAnalysis(manifest.prompts?.analysis || analysis)
    setSdPrompt(manifest.prompts?.sdPrompt || sdPrompt)
    if (manifest.selectedModelTitle) setSelectedModelTitle(manifest.selectedModelTitle)
    setJobStatus('Imported checkpoint restored')
    pushLog('Imported checkpoint zip.', 100, 'done')
  }

  const gridSize = 8
  const gridCells = useMemo(() => {
    const cells = []
    for (let row = 0; row < gridSize; row += 1) {
      for (let col = 0; col < gridSize; col += 1) {
        cells.push({ row, col, label: `${String.fromCharCode(65 + col)}${row + 1}` })
      }
    }
    return cells
  }, [])

  function applyGridCell(cell) {
    if (!baseImage) return
    const cellW = baseImage.width / gridSize
    const cellH = baseImage.height / gridSize
    const rect = { x: cell.col * cellW, y: cell.row * cellH, w: cellW, h: cellH }
    setCutoutRect(clampRect(rect, baseImage))
    pushLog(`Selected ${cell.label} for grid cutout.`, 14, '0s')
    setActiveTab('main')
  }

  function copyJobJson() {
    navigator.clipboard.writeText(JSON.stringify(promptBundle.jobSpec, null, 2))
      .then(() => {
        setJobJsonCopied(true)
        setPromptCopyState('Copied')
        window.setTimeout(() => {
          setJobJsonCopied(false)
          setPromptCopyState('Copy job JSON')
        }, 1400)
      })
      .catch(() => {})
  }

  return (
    <div className="wbx-screen">
      <div className="wbx-shell">
        <header className="wbx-header">
          <div>
            <p className="wbx-kicker">COMFYUI / SD ORCHESTRATOR / CHECKPOINTS</p>
            <h1 className="wbx-title">Image Workbench</h1>
            <p className="wbx-subtitle">Base image, interactive cutout, stamp, editor, edit map, preview gallery, and checkpoint restore. Grid mode lives in its own tab.</p>
          </div>
          <div className="wbx-header__actions">
            <button type="button" className="wbx-button" onClick={onBack}>Portal</button>
            <button type="button" className="wbx-button" onClick={setDemoScene}>Load Sample</button>
            <button type="button" className="wbx-button" onClick={() => void refreshInventory()}>Rescan</button>
            <button type="button" className="wbx-button wbx-button--primary" onClick={() => void generatePreview()}>Generate</button>
          </div>
        </header>

        <section className="wbx-status-row">
          <div className="wbx-stat"><span className="wbx-stat__label">Inventory</span><span className="wbx-stat__value">{inventoryStatus}</span></div>
          <div className="wbx-stat"><span className="wbx-stat__label">Current model</span><span className="wbx-stat__value">{currentModel || 'unknown'}</span></div>
          <div className="wbx-stat"><span className="wbx-stat__label">Selected model</span><span className="wbx-stat__value">{selectedModelTitle || 'auto'}</span></div>
          <div className="wbx-stat"><span className="wbx-stat__label">Progress</span><span className="wbx-stat__value">{jobProgress}% · {jobEta}</span></div>
          <div className="wbx-stat"><span className="wbx-stat__label">Targets</span><span className="wbx-stat__value">{editTargets.length} color target(s)</span></div>
        </section>

        <section className="wbx-panel">
          <div className="wbx-panel__head">
            <div>
              <p className="wbx-panel__title">Model Control</p>
              <p className="wbx-panel__note">Pick a checkpoint, then sync it before generating.</p>
            </div>
            <div className="wbx-panel__actions">
              <button type="button" className="wbx-mini" onClick={() => void ensureSelectedModelActive()}>Sync model</button>
              <button type="button" className="wbx-mini" onClick={() => void refreshInventory()}>Rescan</button>
            </div>
          </div>
          <div className="wbx-prompt-grid">
            <label className="wbx-field">
              <span>Pinned checkpoint</span>
              <select className="wbx-input" value={selectedModelTitle} onChange={(event) => setSelectedModelTitle(event.target.value)}>
                {models.map((model) => (
                  <option key={model.title} value={model.title}>{model.title}</option>
                ))}
              </select>
            </label>
            <label className="wbx-field wbx-field--check">
              <input type="checkbox" checked={modelLock === 'true'} onChange={(event) => setModelLock(event.target.checked ? 'true' : 'false')} />
              <span>Keep selected model active</span>
            </label>
          </div>
        </section>

        <section className="wbx-tabs">
          <button type="button" className={`wbx-tab ${activeTab === 'main' ? 'wbx-tab--active' : ''}`} onClick={() => setActiveTab('main')}>Main</button>
          <button type="button" className={`wbx-tab ${activeTab === 'grid' ? 'wbx-tab--active' : ''}`} onClick={() => setActiveTab('grid')}>Grid</button>
          <label className="wbx-inline-file">
            <span>Import checkpoint zip</span>
            <input type="file" accept=".zip,application/zip" onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void importCheckpointFile(file)
            }} />
          </label>
        </section>

        {activeTab === 'main' ? (
          <>
            <section className="wbx-main-grid">
              <Panel
                title="Base Image"
                note="Drag and drop a file or pick one. This is the source image for the entire workbench."
                actions={(
                  <>
                    <button type="button" className="wbx-mini" onClick={setDemoScene}>Sample</button>
                    <label className="wbx-mini wbx-mini--file">
                      Upload
                      <input type="file" accept="image/*" onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) void loadBaseImageFromFile(file)
                      }} />
                    </label>
                  </>
                )}
              >
                <div
                  className="wbx-dropzone"
                  ref={baseDropRef}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => void handleBaseDrop(event)}
                >
                  {baseImage ? <img src={baseImage.src} alt="Base preview" className="wbx-fit-image" /> : <div className="wbx-empty">Drop an image here or use Upload.</div>}
                </div>
              </Panel>

              <Panel
                title="Define Cutout"
                note="Left-drag pans, right-drag draws the cutout rectangle, mouse wheel zooms. The minimap can be hidden with the eye button."
                actions={(
                  <button type="button" className="wbx-mini" onClick={() => setShowMiniMap((value) => !value)}>
                    <i className={`fa-solid ${showMiniMap ? 'fa-eye' : 'fa-eye-slash'}`} />
                  </button>
                )}
              >
                <div
                  ref={viewerRef}
                  className="wbx-viewport"
                  onPointerDown={(event) => startViewerInteraction(event)}
                  onPointerMove={(event) => moveViewerInteraction(event)}
                  onPointerUp={(event) => endViewerInteraction(event)}
                  onPointerCancel={(event) => endViewerInteraction(event)}
                  onContextMenu={(event) => event.preventDefault()}
                  onWheel={(event) => zoomViewer(event)}
                >
                  {baseImage ? (
                    <img
                      src={baseImage.src}
                      alt="Cutout viewport"
                      className="wbx-viewport__image"
                      style={{ width: baseImage.width, height: baseImage.height, transform: `translate(${viewerPan.x}px, ${viewerPan.y}px) scale(${viewerZoom})`, transformOrigin: 'top left' }}
                      draggable="false"
                    />
                  ) : <div className="wbx-empty">Load a base image first.</div>}

                  {cutoutRect ? (
                    <div
                      className="wbx-rect"
                      style={{
                        left: viewerPan.x + cutoutRect.x * viewerZoom,
                        top: viewerPan.y + cutoutRect.y * viewerZoom,
                        width: cutoutRect.w * viewerZoom,
                        height: cutoutRect.h * viewerZoom,
                      }}
                    />
                  ) : null}

                  {viewerRectDraft ? (
                    <div
                      className="wbx-rect wbx-rect--draft"
                      style={{
                        left: viewerPan.x + viewerRectDraft.x * viewerZoom,
                        top: viewerPan.y + viewerRectDraft.y * viewerZoom,
                        width: viewerRectDraft.w * viewerZoom,
                        height: viewerRectDraft.h * viewerZoom,
                      }}
                    />
                  ) : null}

                  {showMiniMap ? (
                    <div className="wbx-minimap">
                      <canvas ref={minimapCanvasRef} className="wbx-minimap__canvas" />
                    </div>
                  ) : null}
                </div>

                {cutoutRect ? (
                  <div className="wbx-readout">
                    <span>x {Math.round(cutoutRect.x)}</span>
                    <span>y {Math.round(cutoutRect.y)}</span>
                    <span>w {Math.round(cutoutRect.w)}</span>
                    <span>h {Math.round(cutoutRect.h)}</span>
                    <button type="button" className="wbx-mini" onClick={() => restoreViewerFromSelection(cutoutRect)}>Focus</button>
                  </div>
                ) : null}
              </Panel>

              <Panel
                title="Stamp"
                note="The rectangle defines the stamp. The zoom state only affects what you see while drawing the crop."
                actions={(
                  <button type="button" className="wbx-stamp-button" onClick={() => void stampCutout()} disabled={!cutoutRect || !baseImageSrc}>
                    <i className="fa-solid fa-stamp" />
                  </button>
                )}
              >
                <div className="wbx-mini-stack">
                  <button type="button" className="wbx-button wbx-button--primary" onClick={() => void stampCutout()} disabled={!cutoutRect || !baseImageSrc}>Stamp cutout</button>
                  <div className="wbx-preview-wrap">
                    {cutoutSrc ? (
                      <button type="button" className="wbx-preview-button" onClick={openEditor}>
                        <img src={cutoutSrc} alt="Stamped cutout" className="wbx-preview-image" />
                      </button>
                    ) : <div className="wbx-empty">Stamp the cutout to create image 3.</div>}
                  </div>
                </div>
              </Panel>

              <Panel
                title="Edit Map"
                note="Save from the editor to transfer the painted map here. Click the preview to reopen the editor."
                actions={(
                  <button type="button" className="wbx-mini" onClick={openEditor} disabled={!cutoutSrc}>Edit</button>
                )}
              >
                <div className="wbx-preview-wrap wbx-preview-wrap--checker">
                  {editMapSrc ? (
                    <button type="button" className="wbx-preview-button" onClick={openEditor}>
                      <img src={editMapSrc} alt="Edit map" className="wbx-preview-image" />
                    </button>
                  ) : <div className="wbx-empty">Save a painted map from the editor to populate image 4.</div>}
                </div>
              </Panel>
            </section>

            <section className="wbx-targets-panel">
              <Panel title="Edit Targets" note="Each unique color from the editor becomes one Stable Diffusion-friendly target.">
                <div className="wbx-targets-grid">
                  {editTargets.length ? editTargets.map((target, index) => (
                    <div key={target.id} className={`wbx-target ${selectedTargetId === target.id ? 'wbx-target--active' : ''}`}>
                      <button type="button" className="wbx-target__pick" onClick={() => setSelectedTargetId(target.id)}>
                        <span className="wbx-target__swatch" style={{ background: target.color }} />
                        <span>{target.label}</span>
                      </button>
                      <input className="wbx-input" value={target.label} onChange={(event) => setEditTargets((previous) => previous.map((item) => item.id === target.id ? { ...item, label: event.target.value } : item))} />
                      <textarea className="wbx-textarea wbx-textarea--compact" value={target.instruction} onChange={(event) => setEditTargets((previous) => previous.map((item) => item.id === target.id ? { ...item, instruction: event.target.value } : item))} />
                      <div className="wbx-target__meta">{index + 1}. {target.color}</div>
                    </div>
                  )) : <div className="wbx-empty">Paint a map and save it to generate targets.</div>}
                </div>
              </Panel>
            </section>

            <section className="wbx-output-panel">
              <Panel
                title="Output / Gallery"
                note="Generate multiple candidates, then approve one as cutout or merge it back into the base."
                actions={(
                  <>
                    <button type="button" className="wbx-mini" onClick={() => void generatePreview()}>Generate</button>
                    <button type="button" className="wbx-mini" onClick={copyJobJson}>{promptCopyState}</button>
                  </>
                )}
              >
                <div className="wbx-output-layout">
                  <div className="wbx-output-main">
                    {selectedGeneration ? (
                      <>
                        <img src={selectedGeneration.src} alt="Generated result" className="wbx-output-image" />
                        <div className="wbx-output-meta">{selectedGeneration.note} · {selectedGeneration.model}{selectedGeneration.seed !== null ? ` · seed ${selectedGeneration.seed}` : ''}</div>
                      </>
                    ) : <div className="wbx-empty">Run Generate to fill the gallery.</div>}
                    <div className="wbx-output-actions">
                      <button type="button" className="wbx-button wbx-button--primary" onClick={() => void approveSelectedGeneration('cutout')} disabled={!selectedGeneration}>Approve cutout</button>
                      <button type="button" className="wbx-button" onClick={() => void approveSelectedGeneration('base')} disabled={!selectedGeneration}>Merge to base</button>
                      <button type="button" className="wbx-button" onClick={() => setGenerationItems([])}>Clear gallery</button>
                    </div>
                  </div>
                  <div className="wbx-output-side">
                    <textarea className="wbx-textarea wbx-textarea--job" value={JSON.stringify(promptBundle.jobSpec, null, 2)} readOnly />
                    <div className="wbx-log">
                      {jobLog.map((entry) => (
                        <div key={entry.id} className="wbx-log__item">
                          <span className="wbx-log__time">{entry.time}</span>
                          <span className="wbx-log__message">{entry.message}</span>
                          <span className="wbx-log__meta">{entry.percent !== null ? `${entry.percent}%` : ''} {entry.eta ? `· ${entry.eta}` : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="wbx-gallery">
                  {generationItems.map((item) => (
                    <button key={item.id} type="button" className={`wbx-gallery__item ${selectedGenerationId === item.id ? 'wbx-gallery__item--active' : ''}`} onClick={() => selectGeneration(item.id)}>
                      <img src={item.src} alt={item.note} className="wbx-gallery__image" />
                      <span className="wbx-gallery__label">{item.model}</span>
                    </button>
                  ))}
                  {!generationItems.length ? <div className="wbx-empty">No generated candidates yet.</div> : null}
                </div>
              </Panel>
            </section>

            <section className="wbx-prompt-panel">
              <Panel title="Prompt Pack" note="These fields stay in sync with the edit targets and image state.">
                <div className="wbx-prompt-grid">
                  <label className="wbx-field"><span>Excerpt</span><textarea className="wbx-textarea" value={excerpt} onChange={(event) => setExcerpt(event.target.value)} /></label>
                  <label className="wbx-field"><span>Analysis</span><textarea className="wbx-textarea" value={analysis} onChange={(event) => setAnalysis(event.target.value)} /></label>
                  <label className="wbx-field"><span>SD prompt</span><textarea className="wbx-textarea" value={sdPrompt} onChange={(event) => setSdPrompt(event.target.value)} /></label>
                  <label className="wbx-field"><span>Strict prompt</span><textarea className="wbx-textarea wbx-textarea--job" value={promptBundle.strictPrompt} readOnly /></label>
                  <label className="wbx-field"><span>Natural prompt</span><textarea className="wbx-textarea wbx-textarea--job" value={promptBundle.naturalPrompt} readOnly /></label>
                </div>
              </Panel>
            </section>

            <section className="wbx-checkpoints-panel">
              <Panel
                title="Checkpoints"
                note="Approved generations are packaged into zip checkpoints that can be restored later."
                actions={(
                  <>
                    <button type="button" className="wbx-mini" onClick={() => void saveCheckpoint('manual', selectedGeneration || null)}>Save checkpoint</button>
                    <button type="button" className="wbx-mini" onClick={keepNewestCheckpoint} disabled={!checkpoints.length}>Keep newest only</button>
                  </>
                )}
              >
                <div className="wbx-checkpoint-list">
                  {checkpoints.map((record) => (
                    <div key={record.id} className="wbx-checkpoint">
                      <div className="wbx-checkpoint__head">
                        <strong>{record.kind}</strong>
                        <small>{new Date(record.createdAt).toLocaleString()}</small>
                      </div>
                      <small>{record.filename}</small>
                      <div className="wbx-inline-actions">
                        <button type="button" className="wbx-mini" onClick={() => void restoreCheckpointFromRecord(record)}>Restore</button>
                        <button type="button" className="wbx-mini" onClick={() => downloadBlob(record.blob, record.filename)}>Download</button>
                        <button type="button" className="wbx-mini" onClick={() => navigator.clipboard.writeText(JSON.stringify(record.manifest, null, 2))}>Inspect</button>
                        <button type="button" className="wbx-mini" onClick={() => removeCheckpoint(record.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                  {!checkpoints.length ? <div className="wbx-empty">No checkpoints saved yet.</div> : null}
                </div>
              </Panel>
            </section>
          </>
        ) : (
          <section className="wbx-grid-tab">
            <Panel
              title="Grid Work Style"
              note="This tab keeps the grid-based cutout logic separate from the main freeform workflow."
              actions={(
                <span className="wbx-mini wbx-mini--static">{gridSize} x {gridSize}</span>
              )}
            >
              <div className="wbx-grid-tab__layout">
                <div className="wbx-grid-preview">
                  {baseImage ? (
                    <div className="wbx-grid-preview__image-wrap">
                      <img src={baseImage.src} alt="Grid base" className="wbx-fit-image" />
                      <div className="wbx-grid-overlay">
                        {gridCells.map((cell) => (
                          <button key={cell.label} type="button" className="wbx-grid-cell" onClick={() => applyGridCell(cell)}>{cell.label}</button>
                        ))}
                      </div>
                    </div>
                  ) : <div className="wbx-empty">Load a base image first.</div>}
                </div>
                <div className="wbx-grid-side">
                  <div className="wbx-grid-side__block">
                    <strong>Selected cutout</strong>
                    <div>{cutoutRect ? `x ${Math.round(cutoutRect.x)} y ${Math.round(cutoutRect.y)} w ${Math.round(cutoutRect.w)} h ${Math.round(cutoutRect.h)}` : 'none'}</div>
                  </div>
                  <button type="button" className="wbx-button wbx-button--primary" onClick={() => setActiveTab('main')}>Back to main</button>
                </div>
              </div>
            </Panel>
          </section>
        )}
      </div>

      {editorOpen ? (
        <div className="wbx-modal" role="dialog" aria-modal="true">
          <div className="wbx-modal__shell">
            <div className="wbx-modal__head">
              <div>
                <p className="wbx-panel__title">Cutout Editor</p>
                <p className="wbx-panel__note">Left-click starts a new color, right-click continues the current color, eraser removes whole strokes, save closes the editor and writes the edit map.</p>
              </div>
              <div className="wbx-modal__actions">
                <button type="button" className="wbx-mini" onClick={() => setEditorTool('paint')}>Paint</button>
                <button type="button" className="wbx-mini" onClick={() => setEditorTool('erase')}>Erase</button>
                <button type="button" className="wbx-mini" onClick={undoEditor}>Undo</button>
                <button type="button" className="wbx-mini" onClick={redoEditor}>Redo</button>
                <button type="button" className="wbx-mini" onClick={clearEditor}>Clear</button>
                <button type="button" className="wbx-mini wbx-mini--primary" onClick={() => void saveEditorMap()}>Save</button>
                <button type="button" className="wbx-mini" onClick={() => setEditorOpen(false)}>Close</button>
              </div>
            </div>
            <div className="wbx-editor-layout">
              <div className="wbx-editor-stage" ref={editorViewportRef}>
                {cutoutSrc ? <img src={cutoutSrc} alt="Editor background" className="wbx-editor-stage__bg" draggable="false" /> : null}
                <canvas
                  ref={editorCanvasRef}
                  className="wbx-editor-stage__canvas"
                  onPointerDown={(event) => startEditorStroke(event)}
                  onPointerMove={(event) => moveEditorStroke(event)}
                  onPointerUp={(event) => finishEditorStroke(event)}
                  onPointerCancel={(event) => finishEditorStroke(event)}
                  onContextMenu={(event) => event.preventDefault()}
                />
              </div>
              <div className="wbx-editor-side">
                <div className="wbx-editor-side__block">
                  <strong>Current color</strong>
                  <div className="wbx-editor-color-row">
                    {COLOR_PALETTE.map((color, index) => (
                      <button key={color} type="button" className={`wbx-color ${editorPaletteIndex % COLOR_PALETTE.length === index ? 'wbx-color--active' : ''}`} style={{ background: color }} onClick={() => setEditorPaletteIndex(index)} />
                    ))}
                  </div>
                </div>
                <label className="wbx-field">
                  <span>Brush size</span>
                  <input type="range" min="4" max="72" value={editorBrush} onChange={(event) => setEditorBrush(event.target.value)} />
                </label>
                <div className="wbx-editor-side__block">
                  <strong>Selected target</strong>
                  <div>{selectedTarget ? `${selectedTarget.label} · ${selectedTarget.color}` : 'none'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
