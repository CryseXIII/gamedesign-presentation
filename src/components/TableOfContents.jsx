export default function TableOfContents({ slide, onJump, slides }) {
  function chapterSlideIndex(chapterNum) {
    return slides.findIndex(
      (s) => s.type === 'chapter' && s.chapterNum === chapterNum
    )
  }

  return (
    <div className="slide slide-toc">
      <h2 className="slide-title">{slide.title}</h2>
      <ol className="toc-list">
        {slide.chapters.map((ch) => (
          <li key={ch.num}>
            <button
              className="toc-link"
              onClick={() => onJump(chapterSlideIndex(ch.num))}
            >
              <span className="toc-num">{String(ch.num).padStart(2, '0')}</span>
              <span className="toc-title">{ch.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
