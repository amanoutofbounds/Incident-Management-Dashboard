import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { format } from 'date-fns'

export default function Header() {
  const { state, simulateAlert, logout } = useApp()
  const [showNotifs, setShowNotifs] = useState(false)
  const [showUser, setShowUser] = useState(false)
  const notifsRef = useRef()
  const userRef = useRef()

  const unread = state.notifications.filter(n => !n.read).length

  useEffect(() => {
    function handleClick(e) {
      if (notifsRef.current && !notifsRef.current.contains(e.target)) setShowNotifs(false)
      if (userRef.current && !userRef.current.contains(e.target)) setShowUser(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const avatarColors = ['purple', 'green', 'orange', 'blue', 'pink', 'teal']
  const userColor = avatarColors[state.currentUser ? state.currentUser.id.charCodeAt(4) % 6 : 0]

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="header-search">
          <span className="search-icon-h">🔍</span>
          <input type="text" placeholder="Search incidents, alerts..." />
        </div>
      </div>

      <div className="header-right">
        <button className="btn btn-danger btn-sm" onClick={simulateAlert} id="simulate-alert-btn">
          <span className="btn-icon-only">💥</span>
          <span className="btn-text-full">💥 Inject Chaos</span>
        </button>

        <div className="header-notif-wrapper" ref={notifsRef}>
          <button className="header-icon-btn" onClick={() => setShowNotifs(!showNotifs)} id="notifications-btn">
            🔔
            {unread > 0 && <span className="notif-count">{unread}</span>}
          </button>
          {showNotifs && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span>Notifications</span>
                <span className="notif-badge">{unread} new</span>
              </div>
              <div className="notif-list">
                {state.notifications.length === 0 ? (
                  <div className="notif-empty">No notifications yet</div>
                ) : (
                  state.notifications.slice(0, 10).map(n => (
                    <div key={n.id} className={`notif-item ${n.type}`}>
                      <div className="notif-title">{n.title}</div>
                      <div className="notif-msg">{n.message}</div>
                      <div className="notif-time">{format(new Date(n.time), 'HH:mm:ss')}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="header-user-wrapper" ref={userRef}>
          <button className="header-user-btn" onClick={() => setShowUser(!showUser)} id="user-menu-btn">
            <div className={`avatar ${userColor}`}>
              {state.currentUser?.avatar || '??'}
            </div>
            <div className="user-info-header">
              <div className="user-name-h">{state.currentUser?.name || 'User'}</div>
              <div className="user-role-h">{state.currentUser?.role || ''}</div>
            </div>
          </button>
          {showUser && (
            <div className="user-dropdown">
              <button className="dropdown-item" onClick={() => { logout(); setShowUser(false) }}>
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .app-header {
          height: var(--header-height);
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 50;
          gap: 12px;
        }
        .header-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
        .header-search { position: relative; flex: 1; max-width: 360px; }
        .header-search input {
          padding-left: 34px;
          width: 100%;
          background: var(--bg-card);
          border-color: var(--border);
          border-radius: var(--radius-sm);
          height: 36px;
          font-size: 0.82rem;
        }
        .search-icon-h {
          position: absolute;
          left: 10px; top: 50%;
          transform: translateY(-50%);
          font-size: 0.82rem;
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        /* Show full text on desktop, icon only on mobile */
        .btn-icon-only { display: none; }
        .btn-text-full { display: inline; }

        .header-icon-btn {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          width: 36px; height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          position: relative;
          cursor: pointer;
          transition: all var(--transition);
        }
        .header-icon-btn:hover {
          border-color: var(--border-light);
          background: var(--bg-card-hover);
        }
        .notif-count {
          position: absolute;
          top: -3px; right: -3px;
          background: var(--danger);
          color: white;
          font-size: 0.6rem;
          font-weight: 700;
          width: 16px; height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .header-notif-wrapper, .header-user-wrapper { position: relative; }
        .notif-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 360px;
          max-width: calc(100vw - 32px);
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow-lg);
          z-index: 200;
          animation: slideUp 180ms ease;
          max-height: 400px;
          overflow-y: auto;
        }
        .notif-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid var(--border);
          font-weight: 600;
          font-size: 0.9rem;
        }
        .notif-badge {
          background: var(--accent);
          color: #0c0c0e;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 3px;
        }
        .notif-list { padding: 2px 0; }
        .notif-item {
          padding: 10px 16px;
          border-bottom: 1px solid var(--border);
          cursor: pointer;
          transition: background var(--transition);
        }
        .notif-item:hover { background: var(--bg-card-hover); }
        .notif-item:last-child { border-bottom: none; }
        .notif-item.critical { border-left: 3px solid var(--danger); }
        .notif-item.warning { border-left: 3px solid var(--warning); }
        .notif-item.success { border-left: 3px solid var(--success); }
        .notif-item.info { border-left: 3px solid var(--info); }
        .notif-title { font-weight: 600; font-size: 0.82rem; }
        .notif-msg { font-size: 0.76rem; color: var(--text-secondary); margin-top: 2px; }
        .notif-time { font-size: 0.68rem; color: var(--text-muted); margin-top: 3px; font-family: var(--mono); }
        .notif-empty { padding: 28px; text-align: center; color: var(--text-muted); font-size: 0.85rem; }
        .header-user-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 6px;
          border-radius: var(--radius-sm);
          transition: background var(--transition);
        }
        .header-user-btn:hover { background: var(--bg-card); }
        .user-info-header { text-align: left; }
        .user-name-h { font-size: 0.82rem; font-weight: 600; color: var(--text-primary); }
        .user-role-h { font-size: 0.68rem; color: var(--text-muted); }
        .user-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 160px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          box-shadow: var(--shadow-lg);
          z-index: 200;
          animation: slideUp 180ms ease;
          padding: 4px;
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 6px;
          width: 100%;
          padding: 8px 12px;
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 0.85rem;
          cursor: pointer;
          border-radius: var(--radius-xs);
          transition: all var(--transition);
        }
        .dropdown-item:hover { background: var(--bg-card-hover); color: var(--text-primary); }

        @media (max-width: 768px) {
          .app-header { padding: 0 12px 0 52px; }
          .header-search { max-width: none; }
          .user-info-header { display: none; }
          .btn-icon-only { display: inline; }
          .btn-text-full { display: none; }
          .notif-dropdown { right: -40px; }
        }
        @media (max-width: 480px) {
          .header-search { display: none; }
        }
      `}</style>
    </header>
  )
}
