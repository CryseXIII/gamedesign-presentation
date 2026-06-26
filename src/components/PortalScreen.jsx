import { useState, useEffect, useRef } from 'react'
import '../styles/portal.css'
import { internalPages, portalUrls, serviceGroups, snapshotPolicy, launcherConfig } from '../config/portalTargets.js'

function countItems() {
  const services = serviceGroups.reduce((s, g) => s + g.items.length, 0)
  return { pages: internalPages.length, services, urls: portalUrls.length }
}

function Dot({ ready }) {
  return <span className={`svc-dot svc-dot--${ready ? 'ok' : 'off'}`} />
}

function ServiceStatusPanel() {
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)
  const [action, setAction] = useState({})
  const ref = useRef(null)

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
    ref.current = setInterval(fetchStatus, 30000)
    return () => clearInterval(ref.current)
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
    } catch {
      setAction(s => ({ ...s, [endpoint]: 'error' }))
    }
    setTimeout(() => {
      setAction(s => ({ ...s, [endpoint]: null }))
      fetchStatus()
    }, 2500)
  }

  const label = (ep, fallback) => {
    const s = action[ep]
    if (s === 'pending') return '...'
    return s || fallback
  }

  if (!launcherConfig.token) {
    return (
      <section className="portal-panel">
        <div className="portal-panel__head">
          <div>
            <p className="portal-panel__title">Service Status</p>
            <p className="portal-panel__note">Set VITE_LAUNCHER_TOKEN to enable live status.</p>
          </div>
        </div>
      </section>
    )
  }

  const cards = [
    {
      name: 'A1111',
      dot: status?.sd?.api_ready,
      detail: status?.sd?.api_ready ? 'API ready' : status?.sd?.running ? 'Starting...' : 'Offline',
      actions: (
        <button className="portal-svc-btn" type="button" disabled={action['/restart/sd'] === 'pending'} onClick={() => doAction('/restart/sd')}>
          {label('/restart/sd', 'Restart')}
        </button>
      ),
    },
    {
      name: 'Oobabooga',
      dot: status?.llm?.api_ready,
      detail: status?.llm?.api_ready ? 'API ready' : status?.llm?.running ? 'Starting...' : 'Offline',
      actions: status?.llm?.running ? (
        <button className="portal-svc-btn" type="button" disabled={action['/stop/llm'] === 'pending'} onClick={() => doAction('/stop/llm')}>
          {label('/stop/llm', 'Stop')}
        </button>
      ) : (
        <button className="portal-svc-btn" type="button" disabled={action['/start/llm'] === 'pending'} onClick={() => doAction('/start/llm')}>
          {label('/start/llm', 'Start')}
        </button>
      ),
    },
    {
      name: 'Kokoro TTS',
      dot: status?.kokoro?.api_ready,
      detail: status?.kokoro?.api_ready ? 'API ready' : status?.kokoro?.service_status ?? 'Unknown',
      actions: status?.kokoro?.api_ready ? (
        <button className="portal-svc-btn" type="button" disabled={action['/stop/kokoro'] === 'pending'} onClick={() => doAction('/stop/kokoro')}>
          {label('/stop/kokoro', 'Stop')}
        </button>
      ) : (
        <button className="portal-svc-btn" type="button" disabled={action['/start/kokoro'] === 'pending'} onClick={() => doAction('/start/kokoro')}>
          {label('/start/kokoro', 'Start')}
        </button>
      ),
    },
  ]

  return (
    <section className="portal-panel">
      <div className="portal-panel__head">
        <div>
          <p className="portal-panel__title">Service Status</p>
          <p className="portal-panel__note">Laptop AI stack — polled every 30s</p>
        </div>
        <button className="portal-copy" type="button" onClick={fetchStatus}>Refresh</button>
      </div>
      {error ? (
        <p className="portal-status-msg">{error}</p>
      ) : !status ? (
        <p className="portal-status-msg">Loading…</p>
      ) : (
        <div className="portal-svc-grid">
          {cards.map(c => (
            <div className="portal-svc-card" key={c.name}>
              <div className="portal-svc-card__head">
                <Dot ready={c.dot} />
                <span className="portal-svc-card__name">{c.name}</span>
              </div>
              <span className="portal-svc-card__detail">{c.detail}</span>
              <div className="portal-svc-card__actions">{c.actions}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default function PortalScreen({ onOpenGameron, onOpenSnapshots, onOpenWorkbench, onOpenVision }) {
  const [copied, setCopied] = useState('')
  const counts = countItems()

  const handlers = {
    gameron: onOpenGameron,
    snapshots: onOpenSnapshots,
    vision: onOpenVision,
    workbench: onOpenWorkbench,
  }

  function copy(url, label) {
    if (!url || !navigator.clipboard) return
    navigator.clipboard.writeText(url).then(() => {
      setCopied(label)
      setTimeout(() => setCopied(''), 1400)
    }).catch(() => {})
  }

  return (
    <div className="portal-screen">
      <div className="portal-shell">
        <header className="portal-header">
          <p className="portal-kicker">Ops Hub</p>
          <h1 className="portal-title">Alles an einem Ort.</h1>
          <p className="portal-subtitle">
            Portal, Gameron, Snapshots und die freigegebenen Services sind hier direkt erreichbar.
          </p>
          <div className="portal-stats">
            <div className="portal-stat">
              <span>Subpages</span>
              <span className="portal-stat__value">{counts.pages}</span>
            </div>
            <div className="portal-stat">
              <span>Services</span>
              <span className="portal-stat__value">{counts.services}</span>
            </div>
            <div className="portal-stat">
              <span>Portal URLs</span>
              <span className="portal-stat__value">{counts.urls}</span>
            </div>
          </div>
        </header>

        <section className="portal-panel">
          <div className="portal-panel__head">
            <div>
              <p className="portal-panel__title">Quick Access</p>
              <p className="portal-panel__note">Subpages und wichtige Aktionen</p>
            </div>
            <span className="portal-badge">{copied ? `✓ ${copied}` : 'Copy-ready'}</span>
          </div>
          <div className="portal-launchers">
            {internalPages.map(p => (
              <button key={p.id} type="button" className="portal-launcher" onClick={handlers[p.id]}>
                <span className="portal-launcher__label">{p.label}</span>
                <span className="portal-launcher__desc">{p.description}</span>
                <span className="portal-launcher__meta">Öffnen →</span>
              </button>
            ))}
          </div>
        </section>

        <section className="portal-panel">
          <div className="portal-panel__head">
            <div>
              <p className="portal-panel__title">Portal URLs</p>
              <p className="portal-panel__note">Root page und stabile Hash-Routen</p>
            </div>
          </div>
          <div className="portal-url-list">
            {portalUrls.map(item => (
              <div className="portal-url-card" key={item.label}>
                <div>
                  <p className="portal-url-card__label">{item.label}</p>
                  <p className="portal-url-card__note">{item.note}</p>
                  <p className="portal-url-card__url">{item.url}</p>
                </div>
                <button className="portal-copy" type="button" onClick={() => copy(item.url, item.label)}>
                  {copied === item.label ? 'Copied' : 'Copy'}
                </button>
              </div>
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
              <span className="portal-badge">{group.items.length} items</span>
            </div>
            <div className="portal-links">
              {group.items.map(item => {
                const enabled = Boolean(item.url)
                const Wrapper = enabled ? 'a' : 'div'
                const props = enabled
                  ? {
                      key: item.label,
                      className: 'portal-link',
                      href: item.url,
                      target: '_blank',
                      rel: 'noreferrer noopener',
                      'aria-label': `${item.label} — ${item.description}`,
                    }
                  : {
                      key: item.label,
                      className: 'portal-link portal-link--disabled',
                      'aria-disabled': true,
                    }
                return (
                  <Wrapper {...props}>
                    <span className="portal-link__label">{item.label}</span>
                    <span className="portal-link__url">{enabled ? item.url : item.fallback}</span>
                  </Wrapper>
                )
              })}
            </div>
          </section>
        ))}

        <section className="portal-panel">
          <div className="portal-panel__head">
            <div>
              <p className="portal-panel__title">Snapshot Console</p>
              <p className="portal-panel__note">Backup, Restore und Playback mit % + ETA</p>
            </div>
            <button className="portal-copy" type="button" onClick={onOpenSnapshots}>Open</button>
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
            Gameron ist eine Subpage — alles andere bleibt vom Hub aus erreichbar.
          </p>
        </section>
      </div>
    </div>
  )
}
