import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createBoard } from '../utils/api'
import { LayoutDashboard, Plus, ArrowRight, User } from 'lucide-react'

export default function Home() {
  const navigate = useNavigate()
  const [name, setName] = useState(() => sessionStorage.getItem('kanban-user') || '')
  const [boardName, setBoardName] = useState('')
  const [boardLink, setBoardLink] = useState('')
  const [step, setStep] = useState(sessionStorage.getItem('kanban-user') ? 'action' : 'name')

  const saveName = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    sessionStorage.setItem('kanban-user', name.trim())
    setStep('action')
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!boardName.trim()) return
    const board = await createBoard(boardName.trim())
    navigate(`/board/${board.id}`)
  }

  const handleJoin = (e) => {
    e.preventDefault()
    if (!boardLink.trim()) return
    const id = boardLink.trim().split('/').pop()
    navigate(`/board/${id}`)
  }

  return (
    <div className="home-page">
      <div className="home-card">
        <div className="home-logo">
          <LayoutDashboard size={32} />
          <h1>CardFlow</h1>
        </div>
        <p className="home-subtitle">Real-time collaborative task boards</p>

        {step === 'name' ? (
          <form onSubmit={saveName}>
            <div className="form-group">
              <label>What's your name?</label>
              <div className="input-with-icon">
                <User size={16} />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  autoFocus
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full">
              Continue <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <>
            <p className="home-welcome">Welcome, <strong>{sessionStorage.getItem('kanban-user')}</strong></p>

            <form onSubmit={handleCreate} className="home-section">
              <div className="form-group">
                <label>Create a new board</label>
                <input
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  placeholder="e.g. Sprint #12, Project Alpha"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full">
                <Plus size={16} /> Create Board
              </button>
            </form>

            <div className="home-divider"><span>or</span></div>

            <form onSubmit={handleJoin} className="home-section">
              <div className="form-group">
                <label>Join an existing board</label>
                <input
                  value={boardLink}
                  onChange={(e) => setBoardLink(e.target.value)}
                  placeholder="Paste board link or ID"
                  required
                />
              </div>
              <button type="submit" className="btn btn-secondary btn-full">
                <ArrowRight size={16} /> Join Board
              </button>
            </form>

            <button className="btn-link" onClick={() => { sessionStorage.removeItem('kanban-user'); setStep('name') }}>
              Change name
            </button>
          </>
        )}
      </div>
    </div>
  )
}
