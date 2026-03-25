import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DndContext, DragOverlay, pointerWithin, closestCorners } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { getBoard } from '../utils/api'
import socket from '../socket'
import Column from './Column'
import Card from './Card'
import CardModal from './CardModal'
import UserBar from './UserBar'
import { Plus } from 'lucide-react'
import { nanoid } from 'nanoid'

export default function Board() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [board, setBoard] = useState(null)
  const [columns, setColumns] = useState([])
  const [cards, setCards] = useState([])
  const [users, setUsers] = useState([])
  const [activeCard, setActiveCard] = useState(null)
  const [editingCard, setEditingCard] = useState(null)
  const [creatingColumnId, setCreatingColumnId] = useState(null)
  const [loading, setLoading] = useState(true)

  const userName = sessionStorage.getItem('kanban-user')

  useEffect(() => {
    if (!userName) {
      navigate('/')
      return
    }

    async function init() {
      const data = await getBoard(id)
      if (!data) {
        navigate('/')
        return
      }
      setBoard(data)
      setColumns(data.columns)
      setCards(data.cards)
      setLoading(false)

      socket.connect()
      socket.emit('join-board', { boardId: id, userName })
    }

    init()

    socket.on('board-updated', (data) => {
      setColumns(data.columns)
      setCards(data.cards)
    })

    socket.on('users-updated', (userList) => {
      setUsers(userList)
    })

    return () => {
      socket.emit('leave-board', { boardId: id })
      socket.off('board-updated')
      socket.off('users-updated')
      socket.disconnect()
    }
  }, [id])

  const getCardsForColumn = useCallback((columnId) => {
    return cards.filter(c => c.column_id === columnId).sort((a, b) => a.position - b.position)
  }, [cards])

  const findColumnByCardId = (cardId) => {
    const card = cards.find(c => c.id === cardId)
    return card ? card.column_id : null
  }

  const handleDragStart = (event) => {
    const card = cards.find(c => c.id === event.active.id)
    setActiveCard(card || null)
  }

  const handleDragOver = (event) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    const activeCol = findColumnByCardId(activeId)
    let overCol = findColumnByCardId(overId)

    // If over is a column (not a card), use it directly
    if (!overCol && columns.find(c => c.id === overId)) {
      overCol = overId
    }

    if (!activeCol || !overCol || activeCol === overCol) return

    setCards(prev => {
      const updated = prev.map(c =>
        c.id === activeId ? { ...c, column_id: overCol } : c
      )
      return updated
    })
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveCard(null)

    if (!over) return

    const activeId = active.id
    const overId = over.id
    const card = cards.find(c => c.id === activeId)
    if (!card) return

    let targetColumnId = card.column_id
    const overCard = cards.find(c => c.id === overId)
    const overColumn = columns.find(c => c.id === overId)

    if (overCard) {
      targetColumnId = overCard.column_id
    } else if (overColumn) {
      targetColumnId = overColumn.id
    }

    const columnCards = cards
      .filter(c => c.column_id === targetColumnId && c.id !== activeId)
      .sort((a, b) => a.position - b.position)

    let newPosition
    if (overCard) {
      const overIndex = columnCards.findIndex(c => c.id === overId)
      if (overIndex === 0) {
        newPosition = columnCards[0] ? columnCards[0].position - 1000 : 1000
      } else if (overIndex === -1) {
        newPosition = columnCards.length > 0 ? columnCards[columnCards.length - 1].position + 1000 : 1000
      } else {
        newPosition = Math.floor((columnCards[overIndex - 1].position + columnCards[overIndex].position) / 2)
      }
    } else {
      newPosition = columnCards.length > 0 ? columnCards[columnCards.length - 1].position + 1000 : 1000
    }

    setCards(prev =>
      prev.map(c => c.id === activeId ? { ...c, column_id: targetColumnId, position: newPosition } : c)
    )

    socket.emit('card-move', { cardId: activeId, toColumnId: targetColumnId, newPosition })
  }

  const handleAddCard = (columnId) => {
    setCreatingColumnId(columnId)
  }

  const handleConfirmCreate = (fields) => {
    const columnId = creatingColumnId
    const colCards = getCardsForColumn(columnId)
    const position = colCards.length > 0 ? colCards[colCards.length - 1].position + 1000 : 1000
    const cardId = nanoid(10)
    const title = fields.title || 'Untitled'
    const newCard = { id: cardId, column_id: columnId, title, description: fields.description || '', assignee: fields.assignee || '', labels: fields.labels ? JSON.stringify(fields.labels) : '[]', due_date: fields.due_date || null, position }
    setCards(prev => [...prev, newCard])
    socket.emit('card-create', { id: cardId, columnId, title, position })
    if (fields.description || fields.assignee || (fields.labels && fields.labels.length) || fields.due_date) {
      socket.emit('card-update', { cardId, fields: { description: fields.description || '', assignee: fields.assignee || '', labels: fields.labels || [], due_date: fields.due_date || null } })
    }
    setCreatingColumnId(null)
  }

  const handleAddColumn = () => {
    const position = columns.length > 0 ? columns[columns.length - 1].position + 1000 : 1000
    const colId = nanoid(10)
    const newCol = { id: colId, board_id: id, title: 'New Column', position }
    setColumns(prev => [...prev, newCol])
    socket.emit('column-create', { id: colId, boardId: id, title: 'New Column', position })
  }

  const handleUpdateColumn = (columnId, title) => {
    setColumns(prev => prev.map(c => c.id === columnId ? { ...c, title } : c))
    socket.emit('column-update', { columnId, title })
  }

  const handleDeleteColumn = (columnId) => {
    setColumns(prev => prev.filter(c => c.id !== columnId))
    setCards(prev => prev.filter(c => c.column_id !== columnId))
    socket.emit('column-delete', { columnId })
  }

  const handleUpdateCard = (cardId, fields) => {
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, ...fields } : c))
    socket.emit('card-update', { cardId, fields })
  }

  const handleDeleteCard = (cardId) => {
    setCards(prev => prev.filter(c => c.id !== cardId))
    setEditingCard(null)
    socket.emit('card-delete', { cardId })
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading board...</p>
      </div>
    )
  }

  return (
    <div className="board-page">
      <UserBar boardName={board?.name || 'Board'} users={users} />

      <div className="board-container">
        <DndContext
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="columns-wrapper">
            {columns.map(col => (
              <Column
                key={col.id}
                column={col}
                cards={getCardsForColumn(col.id)}
                onAddCard={() => handleAddCard(col.id)}
                onUpdateTitle={(title) => handleUpdateColumn(col.id, title)}
                onDelete={() => handleDeleteColumn(col.id)}
                onCardClick={(card) => setEditingCard(card)}
                onDeleteCard={(cardId) => handleDeleteCard(cardId)}
              />
            ))}

            <button className="add-column-btn" onClick={handleAddColumn}>
              <Plus size={18} />
              Add Column
            </button>
          </div>

          <DragOverlay>
            {activeCard ? <Card card={activeCard} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {editingCard && (
        <CardModal
          card={editingCard}
          mode="edit"
          onUpdate={(fields) => {
            handleUpdateCard(editingCard.id, fields)
            setEditingCard(prev => ({ ...prev, ...fields }))
          }}
          onDelete={() => handleDeleteCard(editingCard.id)}
          onClose={() => setEditingCard(null)}
        />
      )}

      {creatingColumnId && (
        <CardModal
          card={{ title: '', description: '', assignee: '', labels: '[]', due_date: null }}
          mode="create"
          onCreate={handleConfirmCreate}
          onClose={() => setCreatingColumnId(null)}
        />
      )}
    </div>
  )
}
