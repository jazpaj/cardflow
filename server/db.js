const Database = require('better-sqlite3')
const path = require('path')
const { nanoid } = require('nanoid')

const DB_DIR = process.env.DB_PATH || __dirname
const db = new Database(path.join(DB_DIR, 'kanban.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS boards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS columns (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL,
    title TEXT NOT NULL,
    position INTEGER NOT NULL,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    column_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    assignee TEXT DEFAULT '',
    labels TEXT DEFAULT '[]',
    due_date TEXT DEFAULT NULL,
    position INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
  );
`)

function createBoard(name) {
  const id = nanoid(10)
  db.prepare('INSERT INTO boards (id, name) VALUES (?, ?)').run(id, name)

  const defaults = ['To Do', 'In Progress', 'Done']
  const insertCol = db.prepare('INSERT INTO columns (id, board_id, title, position) VALUES (?, ?, ?, ?)')
  defaults.forEach((title, i) => {
    insertCol.run(nanoid(10), id, title, (i + 1) * 1000)
  })

  return getBoard(id)
}

function getBoard(id) {
  const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(id)
  if (!board) return null

  const columns = db.prepare('SELECT * FROM columns WHERE board_id = ? ORDER BY position').all(id)
  const cards = db.prepare(`
    SELECT c.* FROM cards c
    JOIN columns col ON c.column_id = col.id
    WHERE col.board_id = ?
    ORDER BY c.position
  `).all(id)

  return { ...board, columns, cards }
}

function createColumn(id, boardId, title, position) {
  db.prepare('INSERT INTO columns (id, board_id, title, position) VALUES (?, ?, ?, ?)').run(id, boardId, title, position)
}

function updateColumn(columnId, title) {
  db.prepare('UPDATE columns SET title = ? WHERE id = ?').run(title, columnId)
}

function deleteColumn(columnId) {
  db.prepare('DELETE FROM columns WHERE id = ?').run(columnId)
}

function createCard(id, columnId, title, position) {
  db.prepare('INSERT INTO cards (id, column_id, title, position) VALUES (?, ?, ?, ?)').run(id, columnId, title, position)
}

function updateCard(cardId, fields) {
  const allowed = ['title', 'description', 'assignee', 'labels', 'due_date']
  const updates = []
  const values = []
  for (const [key, val] of Object.entries(fields)) {
    if (allowed.includes(key) && val !== undefined) {
      updates.push(`${key} = ?`)
      values.push(typeof val === 'object' ? JSON.stringify(val) : val)
    }
  }
  if (updates.length > 0) {
    values.push(cardId)
    db.prepare(`UPDATE cards SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  }
}

function moveCard(cardId, toColumnId, newPosition) {
  db.prepare('UPDATE cards SET column_id = ?, position = ? WHERE id = ?').run(toColumnId, newPosition, cardId)
}

function deleteCard(cardId) {
  db.prepare('DELETE FROM cards WHERE id = ?').run(cardId)
}

function getColumnBoardId(columnId) {
  const col = db.prepare('SELECT board_id FROM columns WHERE id = ?').get(columnId)
  return col ? col.board_id : null
}

function getCardBoardId(cardId) {
  const card = db.prepare(`
    SELECT col.board_id FROM cards c
    JOIN columns col ON c.column_id = col.id
    WHERE c.id = ?
  `).get(cardId)
  return card ? card.board_id : null
}

module.exports = {
  createBoard, getBoard,
  createColumn, updateColumn, deleteColumn,
  createCard, updateCard, moveCard, deleteCard,
  getColumnBoardId, getCardBoardId,
}
