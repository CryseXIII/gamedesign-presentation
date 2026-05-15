import '../styles/sidebar.css'

// Walking pixel character frames (CSS animation handles the sprite sheet)
// For now: simple ASCII character that bobs up/down via CSS

export default function Sidebar({ slides, currentIndex, onJump }) {
  const total = slides.length
  const progress = currentIndex / Math.max(total - 1, 1) // 0..1

  // Build path nodes: one dot per slide, grouped by type
  return (
    <aside className="sidebar">
      <div className="sidebar-title">Progress</div>

      <div className="sidebar-path">
        {/* Walking character at current progress position */}
        <div
          className="sidebar-character"
          style={{ top: `${progress * 78}%` }}
        >
          ♟
        </div>

        {/* Path line */}
        <div className="path-track">
          <div
            className="path-fill"
            style={{ height: `${progress * 100}%` }}
          />
        </div>

        {/* Nodes for chapter starts + ToC */}
        {slides.map((s, i) => {
          if (s.type !== 'chapter' && s.type !== 'toc') return null
          const nodeProgress = i / Math.max(total - 1, 1)
          const isVisited = i <= currentIndex
          return (
            <button
              key={i}
              className={`path-node ${isVisited ? 'visited' : ''} ${i === currentIndex ? 'active' : ''}`}
              style={{ top: `${nodeProgress * 78}%` }}
              onClick={() => onJump(i)}
              title={s.title || `Chapter ${s.chapterNum}`}
            >
              {s.type === 'toc' ? '☰' : s.chapterNum}
            </button>
          )
        })}
      </div>

      {/* Progress bar at bottom */}
      <div className="sidebar-progress-bar">
        <div
          className="sidebar-progress-fill"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <div className="sidebar-counter">
        {currentIndex + 1}/{total}
      </div>
    </aside>
  )
}
