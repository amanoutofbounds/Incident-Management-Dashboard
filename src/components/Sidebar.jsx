import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/incidents', label: 'Incidents', icon: '🔥' },
  { path: '/alerts', label: 'Alerts', icon: '⚡' },
  { path: '/timeline', label: 'Timeline', icon: '🕐' },
]

export default function Sidebar({ isOpen }) {
  const { state } = useApp()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  // Close on escape key
  useEffect(() => {
    const handleEsc = e => { if (e.key === 'Escape') setMobileOpen(false) }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

  const activeIncidents = state.incidents.filter(i => i.status !== 'Resolved').length
  const criticalCount = state.incidents.filter(i => i.severity === 'Critical' && i.status !== 'Resolved').length

  const sidebarContent = (
    <>
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <span className="logo-icon">◆</span>
          {isOpen && <span className="logo-text">Sentinel</span>}
        </div>
        {isOpen && <span className="logo-version">v2</span>}
        {mobileOpen && (
          <button className="sidebar-close" onClick={() => setMobileOpen(false)}>✕</button>
        )}
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {(isOpen || mobileOpen) && <span className="sidebar-label">{item.label}</span>}
            {(isOpen || mobileOpen) && item.path === '/incidents' && activeIncidents > 0 && (
              <span className="sidebar-badge">{activeIncidents}</span>
            )}
            {(isOpen || mobileOpen) && item.path === '/alerts' && state.alerts.length > 0 && (
              <span className="sidebar-badge alert">{state.alerts.length}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {(isOpen || mobileOpen) && (
        <div className="sidebar-status">
          <div className="sidebar-status-title">System Status</div>
          {state.services.slice(0, 5).map(s => (
            <div key={s.name} className="sidebar-service">
              <span className={`status-dot ${s.status}`} />
              <span className="service-name">{s.name}</span>
            </div>
          ))}
          {criticalCount > 0 && (
            <div className="sidebar-alert-banner">
              <span>🚨</span> {criticalCount} critical
            </div>
          )}
        </div>
      )}
    </>
  )

  return (
    <>
      {/* Mobile hamburger button */}
      <button className="mobile-hamburger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
        <span /><span /><span />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      {/* Desktop sidebar */}
      <aside className="sidebar desktop-sidebar" style={{ width: isOpen ? 256 : 72 }}>
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <aside className={`sidebar mobile-sidebar ${mobileOpen ? 'open' : ''}`}>
        {sidebarContent}
      </aside>

      <style>{`
        .sidebar {
          background: var(--bg-secondary);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          z-index: 100;
          overflow: hidden;
        }
        .desktop-sidebar {
          position: fixed;
          left: 0; top: 0; bottom: 0;
          transition: width var(--transition);
        }
        .mobile-sidebar {
          position: fixed;
          left: 0; top: 0; bottom: 0;
          width: 280px;
          transform: translateX(-100%);
          transition: transform 250ms ease;
          z-index: 1001;
          display: none;
        }
        .mobile-sidebar.open { transform: translateX(0); }
        .sidebar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 1000;
          display: none;
        }
        .mobile-hamburger {
          display: none;
          position: fixed;
          top: 14px; left: 14px;
          z-index: 101;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          width: 36px; height: 36px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          cursor: pointer;
        }
        .mobile-hamburger span {
          display: block;
          width: 16px; height: 2px;
          background: var(--text-secondary);
          border-radius: 1px;
        }
        .sidebar-close {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 1.1rem;
          cursor: pointer;
          padding: 4px;
        }
        .sidebar-close:hover { color: var(--text-primary); }

        @media (max-width: 768px) {
          .desktop-sidebar { display: none; }
          .mobile-sidebar { display: flex; }
          .sidebar-overlay { display: block; }
          .mobile-hamburger { display: flex; }
        }

        .sidebar-brand {
          padding: 16px 18px 14px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .logo-icon {
          font-size: 1.3rem;
          color: var(--accent);
        }
        .logo-text {
          font-size: 1.1rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--accent);
        }
        .logo-version {
          font-size: 0.62rem;
          color: var(--text-muted);
          background: var(--bg-card);
          padding: 1px 6px;
          border-radius: 3px;
          font-weight: 600;
        }
        .sidebar-nav {
          flex: 1;
          padding: 10px 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-size: 0.88rem;
          font-weight: 500;
          text-decoration: none;
          transition: all var(--transition);
          position: relative;
        }
        .sidebar-link:hover {
          background: var(--bg-card);
          color: var(--text-primary);
        }
        .sidebar-link.active {
          background: var(--accent-subtle);
          color: var(--accent);
        }
        .sidebar-link.active::before {
          content: '';
          position: absolute;
          left: -8px; top: 6px; bottom: 6px;
          width: 3px;
          background: var(--accent);
          border-radius: 0 2px 2px 0;
        }
        .sidebar-icon { font-size: 1.1rem; width: 22px; text-align: center; }
        .sidebar-badge {
          margin-left: auto;
          background: var(--danger);
          color: white;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 1px 7px;
          border-radius: 3px;
          min-width: 20px;
          text-align: center;
        }
        .sidebar-badge.alert {
          background: var(--warning);
          color: #1a1a1a;
        }
        .sidebar-status {
          padding: 14px 18px;
          border-top: 1px solid var(--border);
        }
        .sidebar-status-title {
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          font-weight: 600;
          margin-bottom: 10px;
        }
        .sidebar-service {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 0;
        }
        .service-name {
          font-size: 0.78rem;
          color: var(--text-secondary);
        }
        .sidebar-alert-banner {
          margin-top: 10px;
          background: var(--critical-bg);
          border: 1px solid rgba(239,68,68,0.2);
          color: #fca5a5;
          padding: 6px 10px;
          border-radius: var(--radius-xs);
          font-size: 0.74rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 5px;
        }
      `}</style>
    </>
  )
}
