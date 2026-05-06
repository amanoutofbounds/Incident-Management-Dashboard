import React from 'react'
import { useApp } from '../context/AppContext.jsx'
import { format } from 'date-fns'

export default function AlertsPage() {
  const { state, simulateAlert } = useApp()

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Alerts</h1>
          <p>Real-time alert logs from monitoring systems</p>
        </div>
        <button className="btn btn-danger" onClick={simulateAlert} id="trigger-alert-btn">
          💥 Inject Chaos
        </button>
      </div>

      <div className="metric-grid" style={{ marginBottom: 28 }}>
        <div className="metric-card danger">
          <div className="metric-label">Total Alerts</div>
          <div className="metric-value">{state.alerts.length}</div>
        </div>
        <div className="metric-card warning">
          <div className="metric-label">Critical</div>
          <div className="metric-value">{state.alerts.filter(a => a.severity === 'Critical').length}</div>
        </div>
        <div className="metric-card accent">
          <div className="metric-label">High</div>
          <div className="metric-value">{state.alerts.filter(a => a.severity === 'High').length}</div>
        </div>
        <div className="metric-card success">
          <div className="metric-label">Medium / Low</div>
          <div className="metric-value">{state.alerts.filter(a => a.severity === 'Medium' || a.severity === 'Low').length}</div>
        </div>
      </div>

      {state.alerts.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="icon">⚡</div>
            <h3>No alerts yet</h3>
            <p>Click "Trigger Alert" to simulate system failures</p>
          </div>
        </div>
      ) : (
        <div className="alerts-list">
          {state.alerts.map((alert, idx) => (
            <div key={alert.id} className="alert-card" style={{ animationDelay: `${idx * 50}ms` }}>
              <div className="alert-severity-bar" data-sev={alert.severity.toLowerCase()} />
              <div className="alert-content">
                <div className="alert-top">
                  <span className={`badge badge-${alert.severity.toLowerCase()}`}>{alert.severity}</span>
                  <span className="alert-service">{alert.service}</span>
                  <span className="alert-time">{format(new Date(alert.timestamp), 'MMM dd, HH:mm:ss')}</span>
                </div>
                <div className="alert-title-text">{alert.title}</div>
                <div className="alert-desc">{alert.description}</div>
                <div className="alert-footer">
                  <span className="alert-type">Type: {alert.type.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .alert-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          display: flex;
          overflow: hidden;
          transition: all var(--transition);
          animation: slideUp 300ms ease both;
        }
        .alert-card:hover {
          border-color: var(--border-light);
          transform: translateX(4px);
        }
        .alert-severity-bar {
          width: 4px;
          flex-shrink: 0;
        }
        .alert-severity-bar[data-sev="critical"] { background: var(--danger); }
        .alert-severity-bar[data-sev="high"] { background: #f97316; }
        .alert-severity-bar[data-sev="medium"] { background: var(--warning); }
        .alert-severity-bar[data-sev="low"] { background: var(--info); }
        .alert-content {
          padding: 18px 22px;
          flex: 1;
        }
        .alert-top {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }
        .alert-service {
          font-size: 0.78rem;
          color: var(--text-muted);
          background: var(--bg-secondary);
          padding: 2px 10px;
          border-radius: 12px;
        }
        .alert-time {
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-left: auto;
          font-family: monospace;
        }
        .alert-title-text {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .alert-desc {
          font-size: 0.88rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .alert-footer {
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .alert-type {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: capitalize;
        }
      `}</style>
    </div>
  )
}
