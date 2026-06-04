import { useState, useEffect, useRef } from 'react'
import '../styles/portal.css'
import { internalPages, portalUrls, serviceGroups, snapshotPolicy, launcherConfig } from '../config/portalTargets.js'

function formatLinkCount(count) {
  return `${count} ${count === 1 ? 'item' : 'items'}`
}

function Dot({ ready }) {
  return <span className={`svc-dot svc-dot--${ready ? 'ok' : 'off'}`} />
}

function ServiceStatusPanel() {
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)
  const [action, setAction] = useState({})
  const intervalRef = useRef(null)

  async function fetchStatus() {
    if (!launcherConfig.token) {
      setError('VITE_LAUNCHER_TOKEN not set')
      return
    }
    try {
      const r = await fetch(`${launcherConfig.url}/status`, {
        headers: { 'X-Secret-Token': launcherConfig.token },
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      setStatus(await r.json())
      setError(null)
    } catch (e) {
      setError(String(e.message || e))
    }
  }

  useEffect(() => {
    fetchStatus()
    intervalRef.current = setInterval(fetchStatus, 30000)
    return () => clearInterval(intervalRef.current)
  }, [])

  async function doAction(endpoint) {
    setAction(s => ({ ...s, [endpoint]: 'pending' }))
    try {
      const r = await fetch(`${launcherConfig.url}${endpoint}`, {
        method: 'POST',
        headers: { 'X-Secret-Token': launcherConfig.token },
      })
      const data = await r.json()
      setAction(s => ({ ...s, [endpoint]: data.status || 'ok' }))
    } catch (e) {
      setAction(s => ({ ...s, [endpoint]: 'error' }))
    }
    setTimeout(() => {
      setAction(s => ({ ...s, [endpoint]: null }))
      fetchStatus()
    }, 2500)
  }

  function actionLabel(endpoint, fallback) {
    const st = action[endpoint]
    if (st === 'pending') return '...'
    if (st) return st
    return fallback
  }

  if (!launcherConfig.token) {
    return (
      <section className="portal-panel portal-panel--status">
        <div className="portal-panel__head">
          <div>
            <p className="portal-panel__title">Service Status</p>
            <p className="portal-panel__note">Set VITE_LAUNCHER_TOKEN to enable live status.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="portal-panel portal-panel--status">
      <div className="portal-panel__head">
        <div>
          <p className="portal-panel__title">Service Status</p>
          <p className="portal-panel__note">Laptop AI stack — live via Launcher Daemon, polled every 30s.</p>
        </div>
        <button className="portal-copy" type="button" onClick={fetchStatus}>Refresh</button>
      </div>

      {error ? (
        <p className="portal-status-msg">{error}</p>
      ) : !status ? (
        <p className="portal-status-msg">Loading...</p>
      ) : (
        <div className="portal-svc-grid">
          <div className="portal-svc-card">
            <div className="portal-svc-card__head">
              <Dot ready={status.sd?.api_ready} />
              <span className="portal-svc-card__name">A1111</span>
            </div>
            <p className="portal-svc-card__detail">
              {status.sd?.api_ready ? 'API ready' : status.sd?.running ? 'Starting...' : 'Offline'}
            </p>
            <div className="portal-svc-card__actions">
              <button
                className="portal-svc-btn"
                type="button"
                disabled={action['/restart/sd'] === 'pending'}
                onClick={() => doAction('/restart/sd')}
              >
                {actionLabel('/restart/sd', 'Restart')}
              </button>
            </div>
          </div>

          <div className="portal-svc-card">
            <div className="portal-svc-card__head">
              <Dot ready={status.llm?.api_ready} />
              <span className="portal-svc-card__name">Oobabooga</span>
            </div>
            <p className="portal-svc-card__detail">
              {status.llm?.api_ready ? 'API ready' : status.llm?.running ? 'Starting...' : 'Offline'}
            </p>
          </div>

          <div className="portal-svc-card">
            <div className="portal-svc-card__head">
              <Dot ready={status.kokoro?.api_ready} />
              <span className="portal-svc-card__name">Kokoro TTS</span>
            </div>
            <p className="portal-svc-card__detail">
              {status.kokoro?.api_ready ? 'API ready' : (status.kokoro?.service_status ?? 'Unknown')}
            </p>
            <div className="portal-svc-card__actions">
              {status.kokoro?.api_ready ? (
                <button
                  className="portal-svc-btn"
                  type="button"
                  disabled={action['/stop/kokoro'] === 'pending'}
                  onClick={() => doAction('/stop/kokoro')}
                >
                  {actionLabel('/stop/kokoro', 'Stop')}
                </button>
              ) : (
                <button
                  className="portal-svc-btn"
                  type="button"
                  disabled={action['/start/kokoro'] === 'pending'}
                  onClick={() => doAction('/start/kokoro')}
                >
                  {actionLabel('/start/kokoro', 'Start')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default function PortalScreen({ onOpenGameron, onOpenSnapshots }) {
  const [copiedLabel, setCopiedLabel] = useState('')

  function copyUrl(url, label) {
    if (!url || !navigator.clipboard) return

    navigator.clipboard.writeText(url).then(() => {
      setCopiedLabel(label)
      window.setTimeout(() => setCopiedLabel(''), 1400)
    }).catch(() => {})
  }

  return (
    <div className="portal-screen">
      <div className="portal-bg" />

      <div className="portal-shell portal-shell--hub">
        <header className="portal-header">
          <p className="portal-kicker">OPS HUB / GAMERON SUBPAGE</p>
          <h1 className="portal-title">Alles an einem Ort.</h1>
          <p className="portal-subtitle">
            Portal, Gameron, Snapshots und die freigegebenen Services sind hier direkt erreichbar.
          </p>
          <div className="portal-overview" aria-label="Portal Uebersicht">
            <div className="portal-pill">
              <span className="portal-pill__label">Subpages</span>
              <span className="portal-pill__value">{formatLinkCount(internalPages.length)}</span>
            </div>
            <div className="portal-pill">
              <span className="portal-pill__label">Services</span>
              <span className="portal-pill__value">{formatLinkCount(serviceGroups.reduce((sum, group) => sum + group.items.length, 0))}</span>
            </div>
            <div className="portal-pill">
              <span className="portal-pill__label">Portal URLs</span>
              <span className="portal-pill__value">2 routes</span>
            </div>
          </div>
        </header>

        <section className="portal-panel portal-panel--urls">
          <div className="portal-panel__head">
            <div>
              <p className="portal-panel__title">Portal URL</p>
              <p className="portal-panel__note">Root page and stable hash routes for direct access.</p>
            </div>
            <span className="portal-badge">{copiedLabel ? `Copied ${copiedLabel}` : 'Copy-ready'}</span>
          </div>

          <div className="portal-url-list">
            {portalUrls.map(item => (
              <div className="portal-url-card" key={item.label}>
                <div>
                  <p className="portal-url-card__label">{item.label}</p>
                  <p className="portal-url-card__note">{item.note}</p>
                  <p className="portal-url-card__url">{item.url}</p>
                </div>
                <button className="portal-copy" type="button" onClick={() => copyUrl(item.url, item.label)}>
                  Copy
                </button>
              </div>
            ))}
          </div>

          <div className="portal-launchers">
            {internalPages.map(page => (
              <button
                key={page.id}
                type="button"
                className="portal-launcher"
                onClick={page.id === 'gameron' ? onOpenGameron : onOpenSnapshots}
              >
                <span className="portal-launcher__label">{page.label}</span>
                <span className="portal-launcher__desc">{page.description}</span>
                <span className="portal-launcher__meta">Open subpage</span>
              </button>
            ))}
          </div>
        </section>

        <ServiceStatusPanel />

        {serviceGroups.map(group => (
          <section className="portal-panel" key={group.title}>
            <div className="portal-panel__head">
              <div>
                <p className="portal-panel__title">{group.title}</p>
                <p className="portal-panel__note">{group.note}</p>
              </div>
              <span className="portal-card__count">{formatLinkCount(group.items.length)}</span>
            </div>

            <div className="portal-links">
              {group.items.map(item => {
                const enabled = Boolean(item.url)
                const content = (
                  <>
                    <span className="portal-link__label">{item.label}</span>
                    <span className="portal-link__url">{enabled ? item.url : item.fallback}</span>
                    <span className="portal-link__desc">{item.description}</span>
                  </>
                )

                return enabled ? (
                  <a
                    key={item.label}
                    className="portal-link"
                    href={item.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={`${item.label} oeffnen: ${item.description}`}
                  >
                    {content}
                  </a>
                ) : (
                  <div key={item.label} className="portal-link portal-link--disabled" aria-disabled="true">
                    {content}
                  </div>
                )
              })}
            </div>
          </section>
        ))}

        <section className="portal-panel portal-panel--ops">
          <div className="portal-panel__head">
            <div>
              <p className="portal-panel__title">Snapshot Console</p>
              <p className="portal-panel__note">Manual start, restore, playback, and progress with percent + ETA.</p>
            </div>
            <button className="portal-copy" type="button" onClick={onOpenSnapshots}>
              Open
            </button>
          </div>

          <div className="portal-ops-grid">
            <div className="portal-ops-card">
              <p className="portal-ops-card__label">Engine</p>
              <p className="portal-ops-card__value">{snapshotPolicy.engine}</p>
            </div>
            <div className="portal-ops-card">
              <p className="portal-ops-card__label">Tiering</p>
              <p className="portal-ops-card__value">{snapshotPolicy.tiering}</p>
            </div>
            <div className="portal-ops-card">
              <p className="portal-ops-card__label">Restore</p>
              <p className="portal-ops-card__value">{snapshotPolicy.restoreModel}</p>
            </div>
            <div className="portal-ops-card">
              <p className="portal-ops-card__label">Progress</p>
              <p className="portal-ops-card__value">{snapshotPolicy.progressModel}</p>
            </div>
          </div>

          <p className="portal-footnote">
            Gameron is a subpage. Everything else stays reachable from the hub, and Jellyfin can be wired in via `VITE_JELLYFIN_URL`.
          </p>
        </section>
      </div>
    </div>
  )
}

