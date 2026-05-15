export default function ChapterSlide({ slide }) {
  return (
    <div className="slide slide-chapter">
      <div className="chapter-num-label">Chapter {slide.chapterNum}</div>
      <h2 className="chapter-title">{slide.title}</h2>
      <div className="chapter-decoration">▓▒░</div>
    </div>
  )
}
