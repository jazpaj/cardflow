const db = require('../db')

// Track connected users per board: { boardId: [{ socketId, name, color }] }
const boardUsers = {}

const COLORS = ['#6c5ce7', '#00b894', '#e17055', '#0984e3', '#fdcb6e', '#e84393', '#00cec9', '#a29bfe']

function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)]
}

function registerHandlers(io, socket) {
  socket.on('join-board', ({ boardId, userName }) => {
    socket.join(boardId)
    socket.boardId = boardId
    socket.userName = userName

    if (!boardUsers[boardId]) boardUsers[boardId] = []
    boardUsers[boardId] = boardUsers[boardId].filter(u => u.socketId !== socket.id)
    boardUsers[boardId].push({ socketId: socket.id, name: userName, color: getRandomColor() })

    io.to(boardId).emit('users-updated', boardUsers[boardId].map(u => ({ name: u.name, color: u.color })))
  })

  socket.on('leave-board', ({ boardId }) => {
    socket.leave(boardId)
    if (boardUsers[boardId]) {
      boardUsers[boardId] = boardUsers[boardId].filter(u => u.socketId !== socket.id)
      io.to(boardId).emit('users-updated', boardUsers[boardId].map(u => ({ name: u.name, color: u.color })))
    }
  })

  socket.on('card-move', ({ cardId, toColumnId, newPosition }) => {
    try {
      db.moveCard(cardId, toColumnId, newPosition)
      const boardId = db.getCardBoardId(cardId)
      if (boardId) {
        const board = db.getBoard(boardId)
        socket.to(boardId).emit('board-updated', board)
      }
    } catch (e) {
      console.error('card-move error:', e.message)
    }
  })

  socket.on('card-create', ({ id, columnId, title, position }) => {
    try {
      db.createCard(id, columnId, title, position)
      const boardId = db.getColumnBoardId(columnId)
      if (boardId) {
        const board = db.getBoard(boardId)
        io.to(boardId).emit('board-updated', board)
      }
    } catch (e) {
      console.error('card-create error:', e.message)
    }
  })

  socket.on('card-update', ({ cardId, fields }) => {
    try {
      db.updateCard(cardId, fields)
      const boardId = db.getCardBoardId(cardId)
      if (boardId) {
        const board = db.getBoard(boardId)
        socket.to(boardId).emit('board-updated', board)

        // Notify assigned user
        if (fields.assignee) {
          const cardTitle = fields.title || ''
          const card = board.cards.find(c => c.id === cardId)
          io.to(boardId).emit('card-assigned', {
            assignee: fields.assignee,
            cardTitle: card ? card.title : cardTitle,
            assignedBy: socket.userName || 'Someone',
          })
        }
      }
    } catch (e) {
      console.error('card-update error:', e.message)
    }
  })

  socket.on('card-delete', ({ cardId }) => {
    try {
      const boardId = db.getCardBoardId(cardId)
      db.deleteCard(cardId)
      if (boardId) {
        const board = db.getBoard(boardId)
        io.to(boardId).emit('board-updated', board)
      }
    } catch (e) {
      console.error('card-delete error:', e.message)
    }
  })

  socket.on('column-create', ({ id, boardId, title, position }) => {
    try {
      db.createColumn(id, boardId, title, position)
      const board = db.getBoard(boardId)
      io.to(boardId).emit('board-updated', board)
    } catch (e) {
      console.error('column-create error:', e.message)
    }
  })

  socket.on('column-update', ({ columnId, title }) => {
    try {
      const boardId = db.getColumnBoardId(columnId)
      db.updateColumn(columnId, title)
      if (boardId) {
        const board = db.getBoard(boardId)
        io.to(boardId).emit('board-updated', board)
      }
    } catch (e) {
      console.error('column-update error:', e.message)
    }
  })

  socket.on('column-delete', ({ columnId }) => {
    try {
      const boardId = db.getColumnBoardId(columnId)
      db.deleteColumn(columnId)
      if (boardId) {
        const board = db.getBoard(boardId)
        io.to(boardId).emit('board-updated', board)
      }
    } catch (e) {
      console.error('column-delete error:', e.message)
    }
  })

  socket.on('disconnect', () => {
    const boardId = socket.boardId
    if (boardId && boardUsers[boardId]) {
      boardUsers[boardId] = boardUsers[boardId].filter(u => u.socketId !== socket.id)
      io.to(boardId).emit('users-updated', boardUsers[boardId].map(u => ({ name: u.name, color: u.color })))
    }
  })
}

module.exports = { registerHandlers }
