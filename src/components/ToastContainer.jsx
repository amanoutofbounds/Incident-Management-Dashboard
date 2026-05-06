import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'

export default function ToastContainer() {
  const { state, dispatch } = useApp()
  const [visible, setVisible] = useState([])

  useEffect(() => {
    if (state.notifications.length > 0) {
      const latest = state.notifications[0]
      if (!visible.find(v => v.id === latest.id)) {
        setVisible(prev => [latest, ...prev].slice(0, 5))
        setTimeout(() => {
          setVisible(prev => prev.filter(v => v.id !== latest.id))
        }, 5000)
      }
    }
  }, [state.notifications])

  if (visible.length === 0) return null

  return (
    <div className="toast-container">
      {visible.map(n => (
        <div key={n.id} className={`toast ${n.type}`}>
          <div>
            <div className="toast-title">{n.title}</div>
            <div className="toast-msg">{n.message}</div>
          </div>
          <button className="toast-close" onClick={() => setVisible(v => v.filter(x => x.id !== n.id))}>×</button>
        </div>
      ))}
    </div>
  )
}
