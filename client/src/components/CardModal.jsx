import { useState } from 'react'
import { X, Trash2, Type, AlignLeft, User, Tag, Calendar, Plus } from 'lucide-react'

const LABEL_OPTIONS = [
  { name: 'red', color: '#e74c3c' },
  { name: 'orange', color: '#e67e22' },
  { name: 'yellow', color: '#f1c40f' },
  { name: 'green', color: '#2ecc71' },
  { name: 'blue', color: '#3498db' },
  { name: 'purple', color: '#9b59b6' },
  { name: 'pink', color: '#e84393' },
  { name: 'teal', color: '#00cec9' },
]

export default function CardModal({ card, mode = 'edit', onUpdate, onDelete, onCreate, onClose }) {
  const [title, setTitle] = useState(card.title || '')
  const [description, setDescription] = useState(card.description || '')
  const [assignee, setAssignee] = useState(card.assignee || '')
  const [dueDate, setDueDate] = useState(card.due_date || '')

  let initialLabels = []
  try {
    initialLabels = typeof card.labels === 'string' ? JSON.parse(card.labels) : card.labels || []
  } catch { initialLabels = [] }
  const [labels, setLabels] = useState(initialLabels)

  const isCreate = mode === 'create'

  const handleTitleBlur = () => {
    if (!isCreate && title.trim() && title !== card.title) onUpdate({ title: title.trim() })
  }

  const handleDescBlur = () => {
    if (!isCreate && description !== (card.description || '')) onUpdate({ description })
  }

  const handleAssigneeBlur = () => {
    if (!isCreate && assignee !== (card.assignee || '')) onUpdate({ assignee })
  }

  const handleDueDateChange = (e) => {
    const val = e.target.value || null
    setDueDate(val || '')
    if (!isCreate) onUpdate({ due_date: val })
  }

  const toggleLabel = (labelName) => {
    const updated = labels.includes(labelName)
      ? labels.filter(l => l !== labelName)
      : [...labels, labelName]
    setLabels(updated)
    if (!isCreate) onUpdate({ labels: updated })
  }

  const handleCreate = () => {
    if (!title.trim()) return
    onCreate({ title: title.trim(), description, assignee, labels, due_date: dueDate || null })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isCreate ? 'Create Card' : 'Edit Card'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-field">
            <label><Type size={14} /> Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (isCreate) handleCreate()
                  else e.target.blur()
                }
              }}
              className="modal-input"
              placeholder="Enter card title..."
              autoFocus={isCreate}
            />
          </div>

          <div className="modal-field">
            <label><AlignLeft size={14} /> Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescBlur}
              className="modal-textarea"
              placeholder="Add a description..."
              rows={4}
            />
          </div>

          <div className="modal-row">
            <div className="modal-field">
              <label><User size={14} /> Assignee</label>
              <input
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                onBlur={handleAssigneeBlur}
                className="modal-input"
                placeholder="Assign to..."
              />
            </div>

            <div className="modal-field">
              <label><Calendar size={14} /> Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={handleDueDateChange}
                className="modal-input"
              />
            </div>
          </div>

          <div className="modal-field">
            <label><Tag size={14} /> Labels</label>
            <div className="label-picker">
              {LABEL_OPTIONS.map(opt => (
                <button
                  key={opt.name}
                  className={`label-chip ${labels.includes(opt.name) ? 'active' : ''}`}
                  style={{ backgroundColor: opt.color }}
                  onClick={() => toggleLabel(opt.name)}
                  title={opt.name}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          {isCreate ? (
            <button className="btn btn-primary" onClick={handleCreate} disabled={!title.trim()}>
              <Plus size={15} /> Create Card
            </button>
          ) : (
            <button className="btn btn-danger btn-sm" onClick={onDelete}>
              <Trash2 size={14} /> Delete Card
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
