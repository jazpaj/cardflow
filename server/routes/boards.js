const express = require('express')
const router = express.Router()
const db = require('../db')

router.post('/', (req, res) => {
  const { name } = req.body
  if (!name || !name.trim()) return res.status(400).json({ error: 'Board name is required' })
  const board = db.createBoard(name.trim())
  res.json(board)
})

router.get('/:id', (req, res) => {
  const board = db.getBoard(req.params.id)
  if (!board) return res.status(404).json({ error: 'Board not found' })
  res.json(board)
})

module.exports = router
