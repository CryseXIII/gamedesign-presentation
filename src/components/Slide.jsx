export default function Slide({ slide }) {
  return (
    <div className="slide slide-content-type">
      <div className="slide-chapter-label">Chapter {slide.chapter}</div>
      <h2 className="slide-title">{slide.title}</h2>
      <div className="slide-body">
        {slide.body.map((block, i) => renderBlock(block, i))}
      </div>
    </div>
  )
}

function renderBlock(block, i) {
  switch (block.type) {
    case 'text':
      return <p key={i} className="block-text">{block.text}</p>

    case 'quote':
      return (
        <blockquote key={i} className="block-quote">
          <p>{block.text}</p>
          {block.attribution && (
            <cite>{block.attribution}</cite>
          )}
        </blockquote>
      )

    case 'list':
      return (
        <ul key={i} className="block-list">
          {block.items.map((item, j) => (
            <li key={j}>{item}</li>
          ))}
        </ul>
      )

    case 'comparison':
      return (
        <div key={i} className="block-comparison">
          <div className="compare-col compare-left">
            <div className="compare-label">{block.left.label}</div>
            <ul>
              {block.left.points.map((p, j) => <li key={j}>{p}</li>)}
            </ul>
          </div>
          <div className="compare-divider">VS</div>
          <div className="compare-col compare-right">
            <div className="compare-label">{block.right.label}</div>
            <ul>
              {block.right.points.map((p, j) => <li key={j}>{p}</li>)}
            </ul>
          </div>
        </div>
      )

    default:
      return null
  }
}
