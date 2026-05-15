import { useEffect, useState } from 'react'
import '../styles/loader.css'

export default function Loader() {
  const [visible, setVisible] = useState(true)

  // Loader stays visible for at least 2000ms (enforced by SlideEngine timeout)
  // This component just handles the fade-out animation

  return visible ? (
    <div className="loader-overlay">
      <div className="loader-inner">
        {/* Replace with real animated GIF when available */}
        <div className="loader-gif-placeholder">
          <div className="loader-spinner" />
        </div>
        <p className="loader-text">Loading...</p>
      </div>
    </div>
  ) : null
}
