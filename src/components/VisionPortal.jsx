import { useEffect, useState } from 'react'
import '../styles/vision.css'

const DEFAULT_ORCHESTRATOR_URL = (import.meta.env.VITE_ORCHESTRATOR_URL || 'http://100.118.216.77:8766').trim()
const STORAGE_KEY = 'vision.portal.orchestratorUrl'
const MAX_IMAGES = 12

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `id_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`))
    reader.readAsDataURL(file)
  })
}

function stripExtension(name) {
  return String(name || '').replace(/\.[^.]+$/, '')
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return ''
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

function normalizeUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '')
}

function analyzeUrl(baseUrl) {
  return `${normalizeUrl(baseUrl)}/vision/analyze`
}

export default function VisionPortal({ onBack }) {
  const [orchestratorUrl, setOrchestratorUrl] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_ORCHESTRATOR_URL
    return window.localStorage.getItem(STORAGE_KEY) || DEFAULT_ORCHESTRATOR_URL
  })
  const [query, setQuery] = useState('Describe each image clearly and note people, objects, composition, and visible issues.')
  const [images, setImages] = useState([])
  const [results, setResults] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, orchestratorUrl)
  }, [orchestratorUrl])

  async function handleFiles(fileList) {
    const files = Array.from(fileList || [])
    if (!files.length) return

    const roomLeft = MAX_IMAGES - images.length
    const nextFiles = files.slice(0, roomLeft)
    const loaded = await Promise.all(nextFiles.map(async (file) => ({
      id: makeId(),
      name: file.name,
      size: file.size,
      type: file.type,
      dataUrl: await readFileAsDataUrl(file),
    })))

    setImages(prev => [...prev, ...loaded].slice(0, MAX_IMAGES))
    setError('')
    setStatus('ready')
  }

  function removeImage(id) {
    setImages(prev => prev.filter(image => image.id !== id))
  }

  function clearAll() {
    setImages([])
    setResults(null)
    setError('')
    setStatus('idle')
  }

  async function submitAnalysis() {
    if (!images.length) {
      setError('Add at least one image first.')
      return
    }

    const baseUrl = normalizeUrl(orchestratorUrl)
    if (!baseUrl) {
      setError('Set an orchestrator URL first.')
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 15 * 60 * 1000)
    setStatus('loading')
    setError('')

    try {
      const response = await fetch(analyzeUrl(baseUrl), {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: images.map(image => image.dataUrl),
          labels: images.map((image, index) => stripExtension(image.name) || `Image ${index + 1}`),
          query: query.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      setResults(await response.json())
      setStatus('done')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
      setStatus('error')
    } finally {
      window.clearTimeout(timer)
    }
  }

  return (
    <div className="vision-screen">
      <div className="vision-bg" />

      <div className="vision-shell">
        <header className="vision-header">
          <div>
            <p className="vision-kicker">TAILNET IMAGE DESCRIPTIONS</p>
            <h1 className="vision-title">Vision Portal</h1>
            <p className="vision-subtitle">
              Upload a batch of images, send them to the local vision pipeline, and read the descriptions back here.
            </p>
          </div>

          <button className="vision-back" type="button" onClick={onBack}>
            Back
          </button>
        </header>

        <section className="vision-panel">
          <div className="vision-panel__head">
            <div>
              <p className="vision-panel__title">Batch Analysis</p>
              <p className="vision-panel__note">
                Endpoint: <code>{analyzeUrl(orchestratorUrl || DEFAULT_ORCHESTRATOR_URL)}</code>
              </p>
            </div>
            <span className="vision-badge">{images.length}/{MAX_IMAGES} images</span>
          </div>

          <div className="vision-form">
            <label className="vision-field vision-field--wide">
              <span>Orchestrator URL</span>
              <input
                type="text"
                value={orchestratorUrl}
                onChange={(event) => setOrchestratorUrl(event.target.value)}
                spellCheck="false"
              />
            </label>

            <label className="vision-field vision-field--wide">
              <span>Prompt</span>
              <textarea
                rows="4"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Describe what is visible in the uploaded images."
              />
            </label>

            <label className="vision-upload">
              <span>Upload images</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => {
                  handleFiles(event.target.files).catch((cause) => {
                    setError(cause instanceof Error ? cause.message : String(cause))
                    setStatus('error')
                  })
                  event.target.value = ''
                }}
              />
            </label>

            <div className="vision-actions">
              <button className="vision-btn vision-btn--primary" type="button" onClick={submitAnalysis} disabled={status === 'loading'}>
                {status === 'loading' ? 'Analyzing...' : 'Analyze images'}
              </button>
              <button className="vision-btn" type="button" onClick={clearAll}>
                Clear
              </button>
            </div>
          </div>

          {error ? <p className="vision-state vision-state--error">{error}</p> : null}
          {status === 'loading' ? <p className="vision-state">Waiting for the vision model...</p> : null}

          {images.length ? (
            <div className="vision-preview-grid">
              {images.map((image, index) => (
                <article className="vision-preview-card" key={image.id}>
                  <img className="vision-preview-card__thumb" src={image.dataUrl} alt={image.name} />
                  <div className="vision-preview-card__meta">
                    <div>
                      <p className="vision-preview-card__name">{stripExtension(image.name) || `Image ${index + 1}`}</p>
                      <p className="vision-preview-card__info">
                        {formatBytes(image.size)}{image.type ? ` · ${image.type}` : ''}
                      </p>
                    </div>
                    <button className="vision-chip" type="button" onClick={() => removeImage(image.id)}>
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        {results?.results?.length ? (
          <section className="vision-panel vision-panel--results">
            <div className="vision-panel__head">
              <div>
                <p className="vision-panel__title">Results</p>
                <p className="vision-panel__note">Returned {results.count || results.results.length} analysis block(s).</p>
              </div>
            </div>

            <div className="vision-result-grid">
              {results.results.map((item, index) => (
                <article className={`vision-result-card ${item.ok ? '' : 'vision-result-card--error'}`} key={`${item.label || index}-${index}`}>
                  <div className="vision-result-card__head">
                    <div>
                      <p className="vision-result-card__label">{item.label || `Image ${index + 1}`}</p>
                      <p className="vision-result-card__meta">
                        {item.ok ? 'ok' : 'failed'}
                        {item.source_size ? ` · ${item.source_size.width}x${item.source_size.height}` : ''}
                        {item.vision_layout?.detail_mode ? ` · ${item.vision_layout.detail_mode}` : ''}
                      </p>
                    </div>
                    <span className="vision-badge">{item.ok ? 'ready' : 'error'}</span>
                  </div>

                  <pre className="vision-result-card__analysis">{item.analysis || '[no analysis returned]'}</pre>

                  {Array.isArray(item.vision_layout?.detail_boxes) && item.vision_layout.detail_boxes.length ? (
                    <p className="vision-result-card__meta">
                      Detail boxes: {item.vision_layout.detail_boxes.length}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
