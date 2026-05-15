import { useState, useRef, useEffect } from 'react'

export default function AudioPlayer() {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.3)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  function toggle() {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      audioRef.current.play().catch(() => {})
      setPlaying(true)
    }
  }

  return (
    <div className="audio-player">
      <button className="audio-btn" onClick={toggle} title={playing ? 'Pause music' : 'Play music'}>
        {playing ? '⏸' : '▶'} BGM
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={volume}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
        className="audio-volume"
        title="Volume"
      />
      {/* Replace src with real OST file when available */}
      <audio ref={audioRef} src="/assets/menu-ost.mp3" loop />
    </div>
  )
}
