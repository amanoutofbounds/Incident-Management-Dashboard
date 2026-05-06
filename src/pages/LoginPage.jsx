import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

export default function LoginPage() {
  const { login, state } = useApp()
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)

  if (state.isAuthenticated) {
    navigate('/', { replace: true })
    return null
  }

  const avatarColors = ['purple', 'green', 'orange', 'blue', 'pink', 'teal']

  const handleLogin = () => {
    if (!selected) return
    login(selected)
    navigate('/')
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>◆ Sentinel</h1>
        <p>Incident Management Dashboard — Select your profile to continue</p>
        <div className="login-user-grid">
          {state.teamMembers.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
              Loading team members from backend...
            </div>
          ) : (
            state.teamMembers.map((u, i) => (
              <button
                key={u.id}
                className={`login-user-btn ${selected?.id === u.id ? 'selected' : ''}`}
                onClick={() => setSelected(u)}
              >
                <div className={`avatar ${avatarColors[i % 6]}`}>{u.avatar}</div>
                <div>
                  <div>{u.name}</div>
                  <div className="role">{u.role}</div>
                </div>
              </button>
            ))
          )}
        </div>
        <button
          className="btn btn-primary"
          onClick={handleLogin}
          disabled={!selected}
          style={{ opacity: selected ? 1 : 0.5 }}
          id="login-submit-btn"
        >
          Sign In as {selected ? selected.name.split(' ')[0] : '...'}
        </button>
      </div>
    </div>
  )
}
