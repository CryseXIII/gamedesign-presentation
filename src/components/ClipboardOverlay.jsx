/**
 * ClipboardOverlay
 * Shown for Taskmaster scene when player interacts with clipboard.
 * data: { tasks: [{ id, label, claimed }] }
 * onClose(result): called with { completedAll: bool }
 */
import { useState, useEffect } from 'react'

export default function ClipboardOverlay({ data, onClose }) {
  const [tasks, setTasks] = useState([])

  useEffect(() => {
    if (data?.tasks) setTasks(data.tasks.map(t => ({ ...t })))
  }, [data])

  if (!data) return null

  const claimTask = (id) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, claimed: true } : t)
      // Last task only claimable after first two
      const lastTask = updated[updated.length - 1]
      const allOthersDone = updated.slice(0, -1).every(t => t.claimed)
      if (lastTask && lastTask.id === id && !allOthersDone) {
        return prev // block — not all prerequisites done
      }
      // Check if all done
      const allDone = updated.every(t => t.claimed)
      if (allDone) {
        setTimeout(() => onClose({ completedAll: true }), 600)
      }
      return updated
    })
  }

  const firstTwoDone = tasks.slice(0, 2).every(t => t.claimed)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 600,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#f5f0e8',
        border: '2px solid #8b6914',
        borderRadius: 8,
        padding: '24px 32px',
        minWidth: 340,
        maxWidth: 480,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        fontFamily: 'Georgia, serif',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: '#5a3c08', letterSpacing: '0.15em', fontFamily: '"Cinzel", Georgia, serif' }}>
            ✦ DAILY TASK LIST ✦
          </div>
          <div style={{ fontSize: 10, color: '#8b6914', marginTop: 4 }}>
            PRISONER TASK AUTHORITY — MANDATORY COMPLETION
          </div>
        </div>

        <div style={{ borderTop: '1px solid #c9a84c', marginBottom: 16 }} />

        {/* Task rows */}
        {tasks.map((task, i) => {
          const isLast = i === tasks.length - 1
          const locked = isLast && !firstTwoDone
          return (
            <div key={task.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 14,
              opacity: locked ? 0.4 : 1,
            }}>
              <div style={{ flex: 1, marginRight: 12 }}>
                <div style={{ fontSize: 11, color: '#8b6914', letterSpacing: '0.1em', fontFamily: '"Cinzel", Georgia, serif' }}>
                  {task.label}
                </div>
                {task.claimed && (
                  <div style={{ fontSize: 10, color: '#4a8a2c', marginTop: 2 }}>✓ Abgeschlossen</div>
                )}
              </div>
              <button
                onClick={() => !task.claimed && !locked && claimTask(task.id)}
                disabled={task.claimed || locked}
                style={{
                  background: task.claimed ? '#4a8a2c' : locked ? '#aaa' : '#2a7a1a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 20,
                  padding: '6px 18px',
                  fontSize: 12,
                  fontFamily: '"Cinzel", Georgia, serif',
                  cursor: task.claimed || locked ? 'not-allowed' : 'pointer',
                  minWidth: 80,
                  letterSpacing: '0.05em',
                  transition: 'background 0.2s',
                }}
              >
                {task.claimed ? '✓' : 'Claim'}
              </button>
            </div>
          )
        })}

        <div style={{ borderTop: '1px solid #c9a84c', marginTop: 8, paddingTop: 10 }}>
          <div style={{ fontSize: 9, color: '#aaa', textAlign: 'center', fontStyle: 'italic' }}>
            All tasks are mandatory. Non-completion is not an option.
          </div>
        </div>
      </div>
    </div>
  )
}
