import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import Card from './Card'
import { Plus, MoreHorizontal, Trash2, Pencil, Check } from 'lucide-react'

export default function Column({ column, cards, onAddCard, onUpdateTitle, onDelete, onCardClick, onDeleteCard }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(column.title)
  const [showMenu, setShowMenu] = useState(false)

  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  const handleSave = () => {
    if (title.trim()) {
      onUpdateTitle(title.trim())
    } else {
      setTitle(column.title)
    }
    setEditing(false)
  }

  return (
    <div className={`column ${isOver ? 'column-over' : ''}`} ref={setNodeRef}>
      <div className="column-header">
        {editing ? (
          <div className="column-title-edit">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <button className="btn btn-ghost btn-icon-sm" onClick={handleSave}>
              <Check size={14} />
            </button>
          </div>
        ) : (
          <>
            <h3 className="column-title">{column.title}</h3>
            <span className="column-count">{cards.length}</span>
          </>
        )}

        <div className="column-actions">
          <button className="btn btn-ghost btn-icon-sm" onClick={() => setShowMenu(!showMenu)}>
            <MoreHorizontal size={16} />
          </button>
          {showMenu && (
            <>
              <div className="menu-overlay" onClick={() => setShowMenu(false)} />
              <div className="column-menu">
                <button onClick={() => { setEditing(true); setShowMenu(false) }}>
                  <Pencil size={14} /> Rename
                </button>
                <button className="danger" onClick={() => { onDelete(); setShowMenu(false) }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="column-cards">
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <Card key={card.id} card={card} onClick={() => onCardClick(card)} onDelete={() => onDeleteCard(card.id)} />
          ))}
        </SortableContext>
      </div>

      <button className="add-card-btn" onClick={onAddCard}>
        <Plus size={15} /> Add a card
      </button>
    </div>
  )
}
