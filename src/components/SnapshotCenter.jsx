import { useEffect, useRef, useState } from 'react'
import '../styles/snapshot.css'
import { snapshotPolicy } from '../config/portalTargets.js'

const API_BASE = (import.meta.env.VITE_SNAPSHOT_API_BASE || '').trim().replace(/\/+$/, '')

const targetRows = [
  { label: 'Host config', value: 'ssh + /etc + /opt/agents' },
  { label: 'gd-proxy', value: 'CT 201' },
  { label: 'gd-dev', value: 'CT 202' },
  { label: 'gd-test', value: 'CT 203' },
  { label: 'gd-build', value: 'CT 204' },
  { label: 'gd-prod', value: 'CT 205' },
  { label: 'ai-chat', value: 'CT 210' },
  { label: 'n8n / bot', value: 'CT 211' },
]

const seedHistory = [
  {
    id: 'snap-2026-05-21-1042',
    kind: 'backup',
    label: 'Pre-deploy baseline',
    status: 'done',
    storage: 'NAS',
    percent: 100,
    eta: 'done',
    summary: 'Full environment captured, deduped archive stored remotely.',
    timestamp: '2026-05-21 10:42',
  },
  {
    id: 'snap-2026-05-20-2231',
    kind: 'restore',
    label: 'gd-prod rollback',
    status: 'done',
    storage: 'local LXC',
    percent: 100,
    eta: 'done',
    summary: 'Playback completed into the production container.',
    timestamp: '2026-05-20 22:31',
  },
]

function formatEta(seconds) {
  const total = Math.max(0, Math.round(seconds || 0))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60
  const parts = []
  if (hours > 0) parts.push(`${hours}h`)
  parts.push(`${minutes}m`)
  parts.push(`${secs.toString().padStart(2, '0')}s`)
  return parts.join(' ')
}

function formatPercent(value) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`
}

function formatSummary(mode, storage, scope) {
  const action = mode === 'restore' ? 'Restoring' : 'Snapshotting'
  const scopeLabel = scope === 'selected' ? 'selected machines' : 'full VPS environment'
  return `${action} ${scopeLabel} via ${storage === 'auto' ? 'auto storage routing' : storage}.`
}

export default function SnapshotCenter({ onBack }) {
  const [mode, setMode] = useState('backup')
  const [storage, setStorage] = useState('auto')
  const [scope, setScope] = useState('full')
  const [selectedSnapshot, setSelectedSnapshot] = useState(seedHistory[0].id)
  const [history, setHistory] = useState(seedHistory)
  const [activeJob, setActiveJob] = useState(null)
  const [backendLabel, setBackendLabel] = useState(API_BASE ? 'API connected' : 'Demo mode')
  const timerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  function clearTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  function finishJob(job) {
    setActiveJob(null)
    setHistory(prev => [{ ...job, progress: 100, eta: 'done', status: job.kind === 'restore' ? 'restored' : 'done' }, ...prev].slice(0, 8))
  }

  function startDemoJob(kind) {
    clearTimer()

    const startedAt = Date.now()
    const job = {
      id: `job-${startedAt}`,
      kind,
      label: kind === 'restore' ? 'Restore playback' : 'Manual snapshot',
      storage: storage === 'auto' ? 'Auto' : storage,
      progress: 3,
      etaSeconds: kind === 'restore' ? 780 : 1020,
      phase: kind === 'restore' ? 'Replaying backup blocks' : 'Capturing deduplicated deltas',
      status: 'running',
      summary: formatSummary(kind, storage, scope),
      timestamp: new Date(startedAt).toLocaleString([], { hour12: false }),
    }

    setActiveJob(job)

    timerRef.current = setInterval(() => {
      setActiveJob(current => {
        if (!current) return current

        const step = kind === 'restore' ? 7 : 5
        const nextProgress = Math.min(100, current.progress + step)
        const etaSeconds = Math.max(0, Math.round((100 - nextProgress) * (kind === 'restore' ? 7.8 : 10.2)))
        const phase = nextProgress < 18
          ? 'Preparing inventory and repo'
          : nextProgress < 58
            ? 'Streaming changed blocks'
            : nextProgress < 92
              ? (kind === 'restore' ? 'Replaying into target machine' : 'Syncing deltas to repo')
              : 'Finalizing checksum and manifest'

        if (nextProgress >= 100) {
          clearTimer()
          finishJob({ ...current, progress: 100, etaSeconds: 0, phase, status: kind === 'restore' ? 'restored' : 'done' })
          return null
        }

        return { ...current, progress: nextProgress, etaSeconds, phase }
      })
    }, 900)
  }

  async function startSnapshot() {
    if (API_BASE) {
      try {
        setBackendLabel('Dispatching API job...')
        const response = await fetch(`${API_BASE}/snapshots/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode, storage, scope }),
        })

        if (!response.ok) {
          throw new Error(await response.text())
        }

        const data = await response.json()
        setBackendLabel(`Job ${data.id || 'accepted'}`)
        if (data.job) {
          setActiveJob(data.job)
        }
        return
      } catch {
        setBackendLabel('API unavailable, demo mode')
      }
    }

    startDemoJob(mode)
  }

  async function restoreSelected() {
    const target = history.find(item => item.id === selectedSnapshot) || history[0]
    if (!target) return

    if (API_BASE) {
      try {
        setBackendLabel('Dispatching restore job...')
        const response = await fetch(`${API_BASE}/snapshots/restore`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ snapshotId: target.id }),
        })

        if (!response.ok) {
          throw new Error(await response.text())
        }

        const data = await response.json()
        setBackendLabel(`Job ${data.id || 'accepted'}`)
        if (data.job) {
          setActiveJob(data.job)
        }
        return
      } catch {
        setBackendLabel('API unavailable, demo mode')
      }
    }

    startDemoJob('restore')
  }

  const activeProgress = activeJob?.progress || 0
  const activeEta = activeJob ? formatEta(activeJob.etaSeconds) : 'idle'

  return (
    <div className="snapshot-screen">
      <div className="snapshot-bg" />

      <div className="snapshot-shell">
        <header className="snapshot-header">
          <div>
            <p className="snapshot-kicker">MAINTENANCE / SNAPSHOT CONSOLE</p>
            <h1 className="snapshot-title">Manual snapshots, restore, playback.</h1>
            <p className="snapshot-subtitle">
              Deduplicated archives keep only the changes from the previous run. The storage router can send bigger jobs to NAS or keep smaller ones in a local LXC repo.
            </p>
          </div>

          <button className="snapshot-back" type="button" onClick={onBack}>
            BACK TO PORTAL
          </button>
        </header>

        <section className="snapshot-panel snapshot-panel--summary">
          <div className="snapshot-summary-grid">
            <div className="snapshot-stat">
              <span className="snapshot-stat__label">Engine</span>
              <span className="snapshot-stat__value">{snapshotPolicy.engine}</span>
            </div>
            <div className="snapshot-stat">
              <span className="snapshot-stat__label">Routing</span>
              <span className="snapshot-stat__value">Auto NAS / local LXC</span>
            </div>
            <div className="snapshot-stat">
              <span className="snapshot-stat__label">Mode</span>
              <span className="snapshot-stat__value">{mode === 'restore' ? 'Playback' : 'Snapshot'}</span>
            </div>
            <div className="snapshot-stat">
              <span className="snapshot-stat__label">Backend</span>
              <span className="snapshot-stat__value">{backendLabel}</span>
            </div>
          </div>
        </section>

        <section className="snapshot-grid">
          <div className="snapshot-panel">
            <div className="snapshot-panel__head">
              <div>
                <p className="snapshot-panel__title">Scope</p>
                <p className="snapshot-panel__note">The current design captures the whole VPS environment, but the backend can later split host and guests into separate jobs.</p>
              </div>
            </div>

            <div className="snapshot-targets">
              {targetRows.map(row => (
                <div className="snapshot-target" key={row.label}>
                  <span className="snapshot-target__label">{row.label}</span>
                  <span className="snapshot-target__value">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="snapshot-panel">
            <div className="snapshot-panel__head">
              <div>
                <p className="snapshot-panel__title">Controls</p>
                <p className="snapshot-panel__note">Progress shows percentage plus ETA while a snapshot or restore is running.</p>
              </div>
            </div>

            <div className="snapshot-controls">
              <label className="snapshot-switch">
                <span>Operation</span>
                <select value={mode} onChange={e => setMode(e.target.value)}>
                  <option value="backup">Snapshot</option>
                  <option value="restore">Restore / playback</option>
                </select>
              </label>

              <label className="snapshot-switch">
                <span>Storage</span>
                <select value={storage} onChange={e => setStorage(e.target.value)}>
                  <option value="auto">Auto route</option>
                  <option value="nas">NAS</option>
                  <option value="local">Local LXC</option>
                </select>
              </label>

              <label className="snapshot-switch">
                <span>Scope</span>
                <select value={scope} onChange={e => setScope(e.target.value)}>
                  <option value="full">Full VPS</option>
                  <option value="selected">Selected machines</option>
                </select>
              </label>
            </div>

            <div className="snapshot-actions">
              <button className="snapshot-action snapshot-action--primary" type="button" onClick={startSnapshot}>
                Start {mode === 'restore' ? 'Restore' : 'Snapshot'}
              </button>
              <button className="snapshot-action" type="button" onClick={restoreSelected}>
                Restore selected
              </button>
            </div>

            <div className="snapshot-progress" aria-label="Snapshot progress">
              <div className="snapshot-progress__track">
                <div className="snapshot-progress__fill" style={{ width: `${activeProgress}%` }} />
              </div>
              <div className="snapshot-progress__meta">
                <span>{formatPercent(activeProgress)}</span>
                <span>ETA {activeEta}</span>
                <span>{activeJob?.phase || 'idle'}</span>
              </div>
              {activeJob ? <p className="snapshot-progress__summary">{activeJob.summary}</p> : <p className="snapshot-progress__summary">No active job. Start a snapshot or restore to see live progress here.</p>}
            </div>
          </div>
        </section>

        <section className="snapshot-panel">
          <div className="snapshot-panel__head">
            <div>
              <p className="snapshot-panel__title">Playback History</p>
              <p className="snapshot-panel__note">Choose a snapshot and replay it into the original machine or a clone later. The current UI already shows the job trail.</p>
            </div>
          </div>

          <div className="snapshot-history">
            {history.map(item => (
              <button
                key={item.id}
                type="button"
                className={`snapshot-history__item${selectedSnapshot === item.id ? ' snapshot-history__item--active' : ''}`}
                onClick={() => setSelectedSnapshot(item.id)}
              >
                <div className="snapshot-history__meta">
                  <span className="snapshot-history__label">{item.label}</span>
                  <span className="snapshot-history__stamp">{item.timestamp}</span>
                </div>
                <div className="snapshot-history__bar">
                  <div className="snapshot-history__fill" style={{ width: `${item.percent}%` }} />
                </div>
                <div className="snapshot-history__foot">
                  <span>{item.kind}</span>
                  <span>{item.storage}</span>
                  <span>{item.status}</span>
                </div>
                <p className="snapshot-history__summary">{item.summary}</p>
              </button>
            ))}
          </div>

          <p className="snapshot-footnote">
            The backend can later route to NAS or a local backup LXC based on estimated size, then restore from the deduplicated archive set.
          </p>
        </section>
      </div>
    </div>
  )
}
