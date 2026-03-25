const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const path = require('path')
const { registerHandlers } = require('./socket/handlers')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
})

app.use(cors())
app.use(express.json())

// API routes
app.use('/api/boards', require('./routes/boards'))

// Serve static client build in production
const clientDist = path.join(__dirname, '../client/dist')
app.use(express.static(clientDist))
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
    res.sendFile(path.join(clientDist, 'index.html'))
  }
})

// Socket.io
io.on('connection', (socket) => {
  registerHandlers(io, socket)
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`CardFlow server running on http://localhost:${PORT}`)
})
