import { Copy, Check, Home, Link, Mail, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function UserBar({ boardName, users }) {
  const [copied, setCopied] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [email, setEmail] = useState('')
  const navigate = useNavigate()

  const boardUrl = window.location.href
  const userName = sessionStorage.getItem('kanban-user') || 'Someone'

  const share = () => {
    navigator.clipboard.writeText(boardUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sendEmail = () => {
    if (!email.trim()) return
    const subject = encodeURIComponent(`Join my CardFlow board: ${boardName}`)
    const body = encodeURIComponent(
      `Hey!\n\n${userName} invited you to collaborate on a CardFlow board.\n\nBoard: ${boardName}\nLink: ${boardUrl}\n\nJust click the link above to join!`
    )
    window.open(`mailto:${email.trim()}?subject=${subject}&body=${body}`, '_self')
    setEmail('')
    setShowEmailModal(false)
  }

  return (
    <>
      <div className="user-bar">
        <div className="user-bar-left">
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/')}>
            <Home size={18} />
          </button>
          <h2 className="board-title">{boardName}</h2>
          <div className="board-link-box" onClick={share} title="Click to copy board link">
            <Link size={12} />
            <span className="board-link-text">{boardUrl}</span>
            {copied ? <Check size={12} className="board-link-icon copied" /> : <Copy size={12} className="board-link-icon" />}
          </div>
        </div>
        <div className="user-bar-right">
          <div className="user-avatars">
            {users.map((u, i) => (
              <div key={i} className="user-avatar" style={{ backgroundColor: u.color }} title={u.name}>
                {u.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          <span className="user-count">{users.length} online</span>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowEmailModal(true)}>
            <Mail size={14} /> Invite
          </button>
          <button className="btn btn-secondary btn-sm" onClick={share}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </div>

      {showEmailModal && (
        <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>Invite via Email</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowEmailModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Enter an email address to send them the board invite link.
              </p>
              <div className="modal-field">
                <label><Mail size={14} /> Email Address</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendEmail()}
                  className="modal-input"
                  placeholder="colleague@example.com"
                  type="email"
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={sendEmail} disabled={!email.trim()}>
                <Mail size={15} /> Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
