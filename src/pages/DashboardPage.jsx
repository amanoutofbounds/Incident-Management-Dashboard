import React, { useMemo } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { format, differenceInMinutes } from 'date-fns'
import { useNavigate } from 'react-router-dom'

const SEV_COLORS = { Critical: '#ef4444', High: '#fb923c', Medium: '#fbbf24', Low: '#a78bfa' }

export default function DashboardPage() {
  const { state } = useApp()
  const navigate = useNavigate()

  const m = state.metrics

  const incidentMetrics = useMemo(() => {
    const total = state.incidents.length
    const active = state.incidents.filter(i => i.status !== 'Resolved').length
    const critical = state.incidents.filter(i => i.severity === 'Critical' && i.status !== 'Resolved').length
    const resolved = state.incidents.filter(i => i.resolvedAt)
    const mttr = resolved.length > 0
      ? Math.round(resolved.reduce((sum, i) => sum + differenceInMinutes(new Date(i.resolvedAt), new Date(i.createdAt)), 0) / resolved.length)
      : 0
    return { total, active, critical, mttr }
  }, [state.incidents])

  const severityData = useMemo(() => {
    const counts = { Low: 0, Medium: 0, High: 0, Critical: 0 }
    state.incidents.forEach(i => { if (counts[i.severity] !== undefined) counts[i.severity]++ })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [state.incidents])

  const recentIncidents = state.incidents.slice(0, 5)
  const avatarColors = ['purple', 'green', 'orange', 'blue', 'pink', 'teal']

  const overallStatus = m.systemHealth || 'operational'
  const statusLabel = overallStatus === 'operational' ? 'Operational' : overallStatus === 'degraded' ? 'Degraded' : 'Outage'

  const errColor = m.errorRate > 20 ? 'var(--danger)' : m.errorRate > 10 ? 'var(--warning)' : 'var(--success)'
  const latColor = m.avgResponseTime > 1000 ? 'var(--danger)' : m.avgResponseTime > 500 ? 'var(--warning)' : 'var(--success)'

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Real-time incident monitoring & system health</p>
        </div>
        <div className="dash-badges">
          <div className={`status-pill ${state.backendStatus}`}>
            <span className={`status-dot ${state.backendStatus === 'connected' ? 'operational' : 'outage'}`} />
            {state.backendStatus}
          </div>
          <div className={`status-pill ${overallStatus}`}>
            <span className={`status-dot ${overallStatus}`} />
            {statusLabel}
          </div>
        </div>
      </div>

      {/* ── Live Metrics ── */}
      <div className="metric-grid">
        <div className="metric-card accent">
          <div className="metric-label">Total Requests</div>
          <div className="metric-value">{m.totalRequests.toLocaleString()}</div>
          <div className="metric-change down">↑ Live</div>
        </div>
        <div className="metric-card" style={{ '--card-accent': errColor }}>
          <div className="metric-label">Error Rate</div>
          <div className="metric-value" style={{ color: errColor }}>{m.errorRate}<span className="metric-unit">%</span></div>
          {m.errorRate > 20 ? <div className="metric-change up">⚠ Above 20%</div> : <div className="metric-change down">✓ Normal</div>}
          <div className="metric-bar"><div className="metric-bar-fill" style={{ width: `${Math.min(m.errorRate, 100)}%`, background: errColor }} /></div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Avg Latency</div>
          <div className="metric-value" style={{ color: latColor }}>{m.avgResponseTime}<span className="metric-unit">ms</span></div>
          {m.avgResponseTime > 1000 ? <div className="metric-change up">⚠ High</div> : <div className="metric-change down">✓ Normal</div>}
          <div className="metric-bar"><div className="metric-bar-fill" style={{ width: `${Math.min(m.avgResponseTime / 20, 100)}%`, background: latColor }} /></div>
        </div>
        <div className="metric-card success">
          <div className="metric-label">Active Incidents</div>
          <div className="metric-value">{incidentMetrics.active}</div>
          {incidentMetrics.active > 0
            ? <div className="metric-change up">↑ {incidentMetrics.critical} critical</div>
            : <div className="metric-change down">✓ Clear</div>}
        </div>
      </div>

      {/* ── Recovery Banner ── */}
      {m.recovering && (
        <div className="recovery-banner">
          <span>🔄</span> Self-healing in progress — auto-recovering
        </div>
      )}

      {/* ── Charts ── */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title">📈 Error Rate & Latency</div>
            <div className="live-indicator">● LIVE</div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={state.metricsHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e34" />
              <XAxis dataKey="time" tick={{ fill: '#6a6a74', fontSize: 10 }} axisLine={{ stroke: '#2e2e34' }} interval="preserveStartEnd" />
              <YAxis yAxisId="left" tick={{ fill: '#6a6a74', fontSize: 10 }} axisLine={{ stroke: '#2e2e34' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6a6a74', fontSize: 10 }} axisLine={{ stroke: '#2e2e34' }} />
              <Tooltip contentStyle={{ background: '#1c1c20', border: '1px solid #2e2e34', borderRadius: 6, fontSize: 12 }} />
              <Line yAxisId="left" type="monotone" dataKey="errorRate" stroke="#f87171" strokeWidth={2} dot={false} name="Error Rate %" />
              <Line yAxisId="right" type="monotone" dataKey="avgLatency" stroke="#e2a63b" strokeWidth={2} dot={false} name="Latency (ms)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">🎯 Severity Split</div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={severityData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}>
                {severityData.map((entry, i) => (
                  <Cell key={i} fill={Object.values(SEV_COLORS)[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1c1c20', border: '1px solid #2e2e34', borderRadius: 6, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="metric-grid" style={{ marginBottom: 24 }}>
        <div className="metric-card accent">
          <div className="metric-label">Total Incidents</div>
          <div className="metric-value">{incidentMetrics.total}</div>
        </div>
        <div className="metric-card warning">
          <div className="metric-label">Critical</div>
          <div className="metric-value">{incidentMetrics.critical}</div>
        </div>
        <div className="metric-card success">
          <div className="metric-label">MTTR</div>
          <div className="metric-value">{incidentMetrics.mttr}<span className="metric-unit">min</span></div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Uptime</div>
          <div className="metric-value">{Math.floor(m.uptime / 60)}<span className="metric-unit">min</span></div>
        </div>
      </div>

      {/* ── Recent Incidents ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title">🔥 Recent Incidents</div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/incidents')}>View All →</button>
        </div>
        {recentIncidents.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📋</div>
            <h3>No incidents yet</h3>
            <p>Inject chaos to trigger the SRE lifecycle</p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th className="hide-mobile">Assignee</th>
                  <th className="hide-mobile">Created</th>
                </tr>
              </thead>
              <tbody>
                {recentIncidents.map(inc => (
                  <tr key={inc.id} onClick={() => navigate(`/incidents/${inc.id}`)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontFamily: 'var(--mono)', color: 'var(--accent)', fontWeight: 600, fontSize: '0.82rem' }}>{inc.id}</td>
                    <td style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.title}</td>
                    <td><span className={`badge badge-${inc.severity.toLowerCase()}`}>{inc.severity}</span></td>
                    <td><span className={`badge badge-${inc.status.toLowerCase()}`}>{inc.status}</span></td>
                    <td className="hide-mobile">
                      {inc.assignee ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div className={`avatar ${avatarColors[parseInt(inc.assignee?.id?.split('-')[1] || 0) % 6]}`} style={{ width: 24, height: 24, fontSize: '0.6rem' }}>{inc.assignee.avatar}</div>
                          <span style={{ fontSize: '0.82rem' }}>{inc.assignee.name}</span>
                        </div>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td className="hide-mobile" style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontFamily: 'var(--mono)' }}>{format(new Date(inc.createdAt), 'MMM dd, HH:mm')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Service Status ── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">🟢 Services</div>
          <div className="live-indicator">● LIVE</div>
        </div>
        <div className="service-grid">
          {state.services.map(s => (
            <div key={s.name} className="service-card">
              <span className={`status-dot ${s.status}`} />
              <div>
                <div className="service-card-name">{s.name}</div>
                <div className={`service-card-status ${s.status}`}>{s.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .dash-badges {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 4px;
          font-size: 0.76rem;
          font-weight: 600;
          text-transform: capitalize;
          border: 1px solid var(--border);
          background: var(--bg-card);
        }
        .status-pill.connected, .status-pill.operational { color: var(--success); border-color: rgba(52,211,153,0.25); }
        .status-pill.degraded { color: var(--warning); border-color: rgba(251,191,36,0.25); }
        .status-pill.outage, .status-pill.error { color: var(--danger); border-color: rgba(248,113,113,0.25); }
        .status-pill.connecting { color: var(--warning); border-color: rgba(251,191,36,0.25); }

        .live-indicator {
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--success);
          letter-spacing: 0.04em;
          animation: pulse-dot 2s infinite;
        }
        .metric-unit {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-left: 2px;
          font-weight: 400;
        }
        .metric-bar {
          margin-top: 8px;
          height: 3px;
          background: var(--bg-secondary);
          border-radius: 2px;
          overflow: hidden;
        }
        .metric-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.5s ease;
        }
        .recovery-banner {
          background: rgba(226,166,59,0.08);
          border: 1px solid rgba(226,166,59,0.2);
          color: var(--accent);
          padding: 10px 16px;
          border-radius: var(--radius-sm);
          font-size: 0.84rem;
          font-weight: 600;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .service-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 10px;
        }
        .service-card {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: var(--bg-secondary);
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
        }
        .service-card-name { font-size: 0.82rem; font-weight: 500; }
        .service-card-status {
          font-size: 0.68rem;
          text-transform: capitalize;
          font-weight: 600;
        }
        .service-card-status.operational { color: var(--success); }
        .service-card-status.degraded { color: var(--warning); }
        .service-card-status.outage { color: var(--danger); }

        .hide-mobile { }
        @media (max-width: 768px) {
          .hide-mobile { display: none; }
          .dash-badges { width: 100%; }
          .service-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .service-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
