import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { SEVERITIES } from '../data/constants.js'
import { format } from 'date-fns'

export default function IncidentsPage() {
  const { state, createIncident } = useApp()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [filterSev, setFilterSev] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')

  const teamMembers = state.teamMembers
  const defaultAssignee = teamMembers.length > 0 ? teamMembers[0].id : ''
  const [form, setForm] = useState({ title: '', description: '', severity: 'Medium', assignee: defaultAssignee })

  const filtered = useMemo(() => {
    return state.incidents.filter(i => {
      if (search && !i.title.toLowerCase().includes(search.toLowerCase()) && !i.id.toLowerCase().includes(search.toLowerCase())) return false
      if (filterSev !== 'All' && i.severity !== filterSev) return false
      if (filterStatus !== 'All' && i.status !== filterStatus) return false
      return true
    })
  }, [state.incidents, search, filterSev, filterStatus])

  const handleCreate = () => {
    if (!form.title.trim()) return
    createIncident({ ...form, status: 'Open' })
    setForm({ title: '', description: '', severity: 'Medium', assignee: defaultAssignee })
    setShowModal(false)
  }

  const avatarColors = ['purple', 'green', 'orange', 'blue', 'pink', 'teal']
  const getAvatarColor = (assignee) => {
    if (!assignee?.id) return 'purple'
    const parts = assignee.id.split('-')
    return avatarColors[(parseInt(parts[1]) || 0) % 6]
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Incidents</h1>
          <p>Manage and track all system incidents</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} id="create-incident-btn">
          + Create Incident
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-input">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search by title or ID..." value={search} onChange={e => setSearch(e.target.value)} id="incident-search" />
        </div>
        <select value={filterSev} onChange={e => setFilterSev(e.target.value)} id="filter-severity">
          <option value="All">All Severities</option>
          {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} id="filter-status">
          <option value="All">All Statuses</option>
          <option value="Open">Open</option>
          <option value="Investigating">Investigating</option>
          <option value="Resolved">Resolved</option>
        </select>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: 'auto' }}>
          {filtered.length} incident{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Assignee</th>
              <th>Created</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7}>
                <div className="empty-state">
                  <div className="icon">🔍</div>
                  <h3>No incidents found</h3>
                  <p>Try adjusting your filters or inject chaos to trigger incidents</p>
                </div>
              </td></tr>
            ) : (
              filtered.map(inc => (
                <tr key={inc.id} onClick={() => navigate(`/incidents/${inc.id}`)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 600 }}>{inc.id}</td>
                  <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.title}</td>
                  <td><span className={`badge badge-${inc.severity.toLowerCase()}`}>{inc.severity}</span></td>
                  <td><span className={`badge badge-${inc.status.toLowerCase()}`}>{inc.status}</span></td>
                  <td>
                    {inc.assignee ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className={`avatar ${getAvatarColor(inc.assignee)}`} style={{ width: 26, height: 26, fontSize: '0.65rem' }}>{inc.assignee.avatar}</div>
                        <span style={{ fontSize: '0.85rem' }}>{inc.assignee.name}</span>
                      </div>
                    ) : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{format(new Date(inc.createdAt), 'MMM dd, HH:mm')}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{format(new Date(inc.updatedAt), 'MMM dd, HH:mm')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>🚨 Create Incident</h2>
            <div className="form-group">
              <label>Title</label>
              <input type="text" placeholder="Brief incident title..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} id="incident-title-input" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea placeholder="Detailed description of the incident..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} id="incident-desc-input" />
            </div>
            <div className="form-group">
              <label>Severity</label>
              <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })} id="incident-severity-select">
                {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Assign To</label>
              <select value={form.assignee} onChange={e => setForm({ ...form, assignee: e.target.value })} id="incident-assignee-select">
                {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name} — {m.role}</option>)}
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={!form.title.trim()} id="submit-incident-btn">Create Incident</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
