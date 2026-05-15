import { useState, useEffect, useCallback } from 'react'
import { slides } from '../slides.js'
import Slide from './Slide.jsx'
import ChapterSlide from './ChapterSlide.jsx'
import TableOfContents from './TableOfContents.jsx'
import Sidebar from './Sidebar.jsx'
import AudioPlayer from './AudioPlayer.jsx'
import Loader from './Loader.jsx'
import '../styles/slide.css'

export default function SlideEngine() {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState('forward')
  const [animKey, setAnimKey] = useState(0)
  const [showLoader, setShowLoader] = useState(false)

  const total = slides.length
  const current = slides[index]

  const go = useCallback(
    (delta) => {
      const next = index + delta
      if (next < 0 || next >= total) return
      setDirection(delta > 0 ? 'forward' : 'back')
      setShowLoader(true)
      const loaderDuration = Math.max(600, Math.random() * 600 + 400)
      setTimeout(() => {
        setIndex(next)
        setAnimKey((k) => k + 1)
        setShowLoader(false)
      }, loaderDuration)
    },
    [index, total]
  )

  function jumpTo(i) {
    setDirection(i > index ? 'forward' : 'back')
    setShowLoader(true)
    setTimeout(() => {
      setIndex(i)
      setAnimKey((k) => k + 1)
      setShowLoader(false)
    }, 600)
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(1)
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go])

  function renderSlide() {
    if (current.type === 'toc') return <TableOfContents slide={current} onJump={jumpTo} slides={slides} />
    if (current.type === 'chapter') return <ChapterSlide slide={current} />
    return <Slide slide={current} />
  }

  return (
    <div className="slide-engine">
      <Sidebar slides={slides} currentIndex={index} onJump={jumpTo} />

      <div className={`slide-area slide-${direction}`} key={animKey}>
        {renderSlide()}
      </div>

      <nav className="slide-nav">
        <button
          className="nav-btn"
          onClick={() => go(-1)}
          disabled={index === 0}
          aria-label="Previous slide"
        >
          ◀
        </button>
        <span className="slide-counter">
          {index + 1} / {total}
        </span>
        <button
          className="nav-btn"
          onClick={() => go(1)}
          disabled={index === total - 1}
          aria-label="Next slide"
        >
          ▶
        </button>
      </nav>

      <AudioPlayer />
      {showLoader && <Loader />}
    </div>
  )
}
