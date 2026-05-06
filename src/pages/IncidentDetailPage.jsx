import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { SEVERITIES, STATUSES } from '../data/constants.js'
import { format, differenceInMinutes } from 'date-fns'

export default function IncidentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state, updateIncident } = useApp()
  const [editing, setEditing] = useState(false)

  const teamMembers = state.teamMembers
  const incident = state.incidents.find(i => i.id === id)

  if (!incident) {
    return (
      <div className="empty-state">
        <div className="icon">🔍</div>
        <h3>Incident not found</h3>
        <p>This incident may not exist yet or the backend is still loading.</p>
        <button className="btn btn-ghost" onClick={() => navigate('/incidents')}>← Back to incidents</button>
      </div>
    )
  }

  const [editForm, setEditForm] = useState({
    status: incident.status,
    severity: incident.severity,
    assignee: incident.assignee?.id || '',
  })

  const handleUpdate = () => {
    updateIncident(incident.id, {
      status: editForm.status,
      severity: editForm.severity,
      assignee: editForm.assignee,
    }, `Updated: status → ${editForm.status}, severity → ${editForm.severity}`)
    setEditing(false)
  }

  const handleResolve = () => {
    updateIncident(incident.id, { status: 'Resolved' }, 'Incident resolved manually')
  }

  const duration = incident.resolvedAt
    ? differenceInMinutes(new Date(incident.resolvedAt), new Date(incident.createdAt))
    : differenceInMinutes(new Date(), new Date(incident.createdAt))

  const avatarColors = ['purple', 'green', 'orange', 'blue', 'pink', 'teal']
  const aColor = (() => {
    if (!incident.assignee?.id) return 'purple'
    const parts = incident.assignee.id.split('-')
    return avatarColors[(parseInt(parts[1]) || 0) % 6]
  })()

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/incidents')}>← Back</button>
            <span style={{ fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 700, fontSize: '1rem' }}>{incident.id}</span>
            <span className={`badge badge-${incident.severity.toLowerCase()}`}>{incident.severity}</span>
            <span className={`badge badge-${incident.status.toLowerCase()}`}>{incident.status}</span>
          </div>
          <h1 style={{ fontSize: '1.4rem' }}>{incident.title}</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {incident.status !== 'Resolved' && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(!editing)}>✏️ Edit</button>
              <button className="btn btn-success btn-sm" onClick={handleResolve} id="resolve-incident-btn">✅ Resolve</button>
            </>
          )}
        </div>
      </div>

      <div className="incident-detail-grid">
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title" style={{ marginBottom: 16 }}>📋 Details</div>
            <div className="detail-field">
              <div className="detail-label">Description</div>
              <div className="detail-value">{incident.description || 'No description provided'}</div>
            </div>
            {incident.service && (
              <div className="detail-field">
                <div className="detail-label">Service</div>
                <div className="detail-value">{incident.service}</div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="detail-field">
                <div className="detail-label">Created</div>
                <div className="detail-value">{format(new Date(incident.createdAt), 'MMM dd, yyyy HH:mm:ss')}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Last Updated</div>
                <div className="detail-value">{format(new Date(incident.updatedAt), 'MMM dd, yyyy HH:mm:ss')}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Duration</div>
                <div className="detail-value">{duration < 60 ? `${duration}m` : `${Math.floor(duration / 60)}h ${duration % 60}m`}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Resolved At</div>
                <div className="detail-value">{incident.resolvedAt ? format(new Date(incident.resolvedAt), 'MMM dd, yyyy HH:mm:ss') : '—'}</div>
              </div>
            </div>
            <div className="detail-field">
              <div className="detail-label">Assigned To</div>
              <div className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                {incident.assignee ? (
                  <>
                    <div className={`avatar ${aColor}`}>{incident.assignee.avatar}</div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{incident.assignee.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{incident.assignee.role}</div>
                    </div>
                  </>
                ) : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
              </div>
            </div>
          </div>

          {editing && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-title" style={{ marginBottom: 16 }}>✏️ Edit Incident</div>
              <div className="form-group">
                <label>Status</label>
                <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Severity</label>
                <select value={editForm.severity} onChange={e => setEditForm({ ...editForm, severity: e.target.value })}>
                  {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Reassign</label>
                <select value={editForm.assignee} onChange={e => setEditForm({ ...editForm, assignee: e.target.value })}>
                  {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="modal-actions" style={{ justifyContent: 'flex-start' }}>
                <button className="btn btn-primary btn-sm" onClick={handleUpdate}>Save Changes</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 20 }}>🕐 Timeline</div>
            <div className="timeline">
              {incident.timeline.map((entry, i) => (
                <div key={i} className="timeline-item">
                  <div className={`timeline-dot ${entry.type}`} />
                  <div className="timeline-event">{entry.event}</div>
                  <div className="timeline-time">{format(new Date(entry.time), 'MMM dd, HH:mm:ss')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
