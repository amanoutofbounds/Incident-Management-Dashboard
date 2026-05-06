import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { format, differenceInMinutes } from 'date-fns'

export default function TimelinePage() {
  const { state } = useApp()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('All')

  const incidents = useMemo(() => {
    let list = [...state.incidents].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    if (filter !== 'All') list = list.filter(i => i.status === filter)
    return list
  }, [state.incidents, filter])

  const avatarColors = ['purple', 'green', 'orange', 'blue', 'pink', 'teal']

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Timeline</h1>
          <p>Visual timeline of all incident activity</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['All', 'Open', 'Investigating', 'Resolved'].map(f => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(f)}
            >{f}</button>
          ))}
        </div>
      </div>

      {incidents.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="icon">🕐</div>
            <h3>No incidents to display</h3>
          </div>
        </div>
      ) : (
        <div className="timeline-page-list">
          {incidents.map(inc => {
            const duration = inc.resolvedAt
              ? differenceInMinutes(new Date(inc.resolvedAt), new Date(inc.createdAt))
              : differenceInMinutes(new Date(), new Date(inc.createdAt))
            const aColor = (() => {
              if (!inc.assignee?.id) return 'purple'
              const parts = inc.assignee.id.split('-')
              return avatarColors[(parseInt(parts[1]) || 0) % 6]
            })()

            return (
              <div key={inc.id} className="timeline-incident-card" onClick={() => navigate(`/incidents/${inc.id}`)}>
                <div className="tic-left">
                  <div className={`tic-status-line ${inc.status.toLowerCase()}`} />
                  <div className={`tic-dot ${inc.status.toLowerCase()}`} />
                </div>
                <div className="tic-content">
                  <div className="tic-header">
                    <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent)', fontWeight: 600, fontSize: '0.82rem' }}>{inc.id}</span>
                    <span className={`badge badge-${inc.severity.toLowerCase()}`}>{inc.severity}</span>
                    <span className={`badge badge-${inc.status.toLowerCase()}`}>{inc.status}</span>
                    <span className="tic-time">{format(new Date(inc.createdAt), 'MMM dd, HH:mm')}</span>
                  </div>
                  <div className="tic-title">{inc.title}</div>
                  <div className="tic-meta">
                    <div className="tic-assignee">
                      {inc.assignee ? (
                        <>
                          <div className={`avatar ${aColor}`} style={{ width: 22, height: 22, fontSize: '0.6rem' }}>{inc.assignee.avatar}</div>
                          <span>{inc.assignee.name}</span>
                        </>
                      ) : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                    </div>
                    <span className="tic-duration">⏱ {duration < 60 ? `${duration}m` : `${Math.floor(duration / 60)}h ${duration % 60}m`}</span>
                  </div>
                  <div className="tic-timeline-mini">
                    {inc.timeline.map((entry, i) => (
                      <div key={i} className="tic-mini-item">
                        <div className={`tic-mini-dot ${entry.type}`} />
                        <span className="tic-mini-event">{entry.event}</span>
                        <span className="tic-mini-time">{format(new Date(entry.time), 'HH:mm:ss')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        .timeline-page-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .timeline-incident-card {
          display: flex;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          cursor: pointer;
          transition: all var(--transition);
        }
        .timeline-incident-card:hover {
          border-color: var(--accent);
          transform: translateY(-2px);
          box-shadow: var(--shadow);
        }
        .tic-left {
          width: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 24px;
          position: relative;
        }
        .tic-status-line {
          position: absolute;
          top: 36px; bottom: 0;
          width: 2px;
          left: 50%;
          transform: translateX(-50%);
        }
        .tic-status-line.open { background: var(--danger); opacity: 0.4; }
        .tic-status-line.investigating { background: var(--warning); opacity: 0.4; }
        .tic-status-line.resolved { background: var(--success); opacity: 0.4; }
        .tic-dot {
          width: 14px; height: 14px;
          border-radius: 50%;
          z-index: 1;
          flex-shrink: 0;
        }
        .tic-dot.open { background: var(--danger); box-shadow: 0 0 10px rgba(239,68,68,0.4); }
        .tic-dot.investigating { background: var(--warning); box-shadow: 0 0 10px rgba(245,158,11,0.4); }
        .tic-dot.resolved { background: var(--success); box-shadow: 0 0 10px rgba(34,197,94,0.4); }
        .tic-content {
          padding: 20px 24px;
          flex: 1;
        }
        .tic-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }
        .tic-time {
          font-size: 0.74rem;
          color: var(--text-muted);
          margin-left: auto;
          font-family: var(--mono);
        }
        .tic-title {
          font-size: 1.05rem;
          font-weight: 600;
          margin-bottom: 10px;
        }
        .tic-meta {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 14px;
        }
        .tic-assignee {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          color: var(--text-secondary);
        }
        .tic-duration {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .tic-timeline-mini {
          border-top: 1px solid var(--border);
          padding-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tic-mini-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
        }
        .tic-mini-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .tic-mini-dot.created { background: var(--accent); }
        .tic-mini-dot.acknowledged { background: var(--info); }
        .tic-mini-dot.status_change { background: var(--warning); }
        .tic-mini-dot.update { background: var(--text-muted); }
        .tic-mini-dot.resolved { background: var(--success); }
        .tic-mini-event {
          color: var(--text-secondary);
          flex: 1;
        }
        .tic-mini-time {
          color: var(--text-muted);
          font-family: var(--mono);
          font-size: 0.68rem;
        }
        @media (max-width: 768px) {
          .tic-content { padding: 14px 16px; }
          .tic-title { font-size: 0.95rem; }
          .tic-meta { flex-wrap: wrap; gap: 10px; }
          .tic-header { gap: 6px; }
          .tic-left { width: 32px; }
        }
      `}</style>
    </div>
  )
}
