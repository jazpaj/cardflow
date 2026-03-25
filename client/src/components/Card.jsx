import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, User, X } from 'lucide-react'

const LABEL_COLORS = {
  red: '#e74c3c',
  orange: '#e67e22',
  yellow: '#f1c40f',
  green: '#2ecc71',
  blue: '#3498db',
  purple: '#9b59b6',
  pink: '#e84393',
  teal: '#00cec9',
}

export default function Card({ card, isOverlay, onClick, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: 'grab',
  }

  let labels = []
  try {
    labels = typeof card.labels === 'string' ? JSON.parse(card.labels) : card.labels || []
  } catch { labels = [] }

  const firstLabel = labels[0]
  const borderColor = firstLabel && LABEL_COLORS[firstLabel] ? LABEL_COLORS[firstLabel] : 'transparent'

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={isOverlay ? { cursor: 'grabbing', transform: 'rotate(3deg)' } : style}
      className={`card-item ${isOverlay ? 'card-overlay' : ''}`}
    >
      {onDelete && (
        <button
          className="card-delete-btn"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          title="Delete card"
        >
          <X size={14} />
        </button>
      )}
      <div className="card-border-accent" style={{ backgroundColor: borderColor }} />
      <div
        className="card-content"
        {...(isOverlay ? {} : { ...attributes, ...listeners })}
        onClick={onClick}
        style={{ cursor: 'grab' }}
      >
        {labels.length > 0 && (
          <div className="card-labels">
            {labels.map((l, i) => (
              <span key={i} className="card-label" style={{ backgroundColor: LABEL_COLORS[l] || '#6c5ce7' }} />
            ))}
          </div>
        )}
        <p className="card-title">{card.title}</p>
        <div className="card-meta">
          {card.assignee && (
            <span className="card-assignee">
              <User size={11} /> {card.assignee}
            </span>
          )}
          {card.due_date && (
            <span className="card-due">
              <Calendar size={11} /> {card.due_date}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
