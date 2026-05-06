import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'

// ─── ZERO mock data imports — all data from backend ────────────────────────

const AppContext = createContext()

const initialState = {
  incidents: [],
  alerts: [],
  notifications: [],
  services: [],
  teamMembers: [],
  metrics: {
    totalRequests: 0,
    totalErrors: 0,
    errorRate: 0,
    avgResponseTime: 0,
    activeIncidents: 0,
    uptime: 0,
    failureRate: 0,
    latencySpike: 0,
    recovering: false,
    systemHealth: 'operational',
  },
  metricsHistory: [],
  isAuthenticated: false,
  currentUser: null,
  backendStatus: 'connecting',
}

function appReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, isAuthenticated: true, currentUser: action.payload }
    case 'LOGOUT':
      return { ...state, isAuthenticated: false, currentUser: null }

    // ── Backend data ────────────────────────────────────────────────────
    case 'SET_INCIDENTS':
      return { ...state, incidents: action.payload }
    case 'SET_ALERTS':
      return { ...state, alerts: action.payload }
    case 'SET_TEAM':
      return { ...state, teamMembers: action.payload }
    case 'SET_METRICS': {
      const entry = {
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        errorRate: action.payload.errorRate,
        avgLatency: action.payload.avgResponseTime,
        requests: action.payload.totalRequests,
      }
      const history = [...state.metricsHistory, entry].slice(-60)
      return { ...state, metrics: action.payload, metricsHistory: history }
    }
    case 'SET_SERVICES':
      return { ...state, services: action.payload }
    case 'SET_BACKEND_STATUS':
      return { ...state, backendStatus: action.payload }

    // ── Frontend-only ───────────────────────────────────────────────────
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications].slice(0, 50) }
    case 'DISMISS_NOTIFICATION':
      return { ...state, notifications: state.notifications.filter(n => n.id !== action.payload) }

    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Refs for stale closure safety in polling
  const prevIncidentIdsRef = useRef(new Set())
  const prevAlertIdsRef = useRef(new Set())
  const prevMetricsRef = useRef(null)
  const incidentsRef = useRef([])

  // Keep incidentsRef synced so polling can detect status changes
  useEffect(() => {
    incidentsRef.current = state.incidents
  }, [state.incidents])

  // ── Notification helper ──────────────────────────────────────────────
  const addNotification = useCallback((title, message, type = 'info') => {
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: { id: uuidv4(), title, message, type, time: new Date().toISOString(), read: false },
    })
  }, [])

  // ── Fetch team members once on mount ─────────────────────────────────
  useEffect(() => {
    fetch('/api/team')
      .then(r => r.ok ? r.json() : [])
      .then(team => dispatch({ type: 'SET_TEAM', payload: team }))
      .catch(() => {})
  }, [])

  // ── Central polling loop (every 3 seconds) ───────────────────────────
  useEffect(() => {
    let active = true

    async function fetchAllData() {
      if (!active) return
      try {
        const [metricsRes, incidentsRes, alertsRes, servicesRes] = await Promise.all([
          fetch('/metrics'),
          fetch('/incidents'),
          fetch('/alerts'),
          fetch('/api/services'),
        ])

        if (!active) return

        // ── Process metrics ──
        if (metricsRes.ok) {
          const metrics = await metricsRes.json()
          dispatch({ type: 'SET_METRICS', payload: metrics })

          if (prevMetricsRef.current) {
            const prev = prevMetricsRef.current
            if (metrics.errorRate > 20 && prev.errorRate <= 20) {
              addNotification('🔴 Error Rate Spike', `Error rate jumped to ${metrics.errorRate}%`, 'critical')
            }
            if (metrics.avgResponseTime > 1000 && prev.avgResponseTime <= 1000) {
              addNotification('🟡 Latency Spike', `Avg response time: ${metrics.avgResponseTime}ms`, 'warning')
            }
            if (metrics.recovering && !prev.recovering) {
              addNotification('🔄 Self-Healing', 'System is auto-recovering from incident', 'info')
            }
          }
          prevMetricsRef.current = metrics
        }

        // ── Process incidents ──
        if (incidentsRes.ok) {
          const incidents = await incidentsRes.json()
          const newIds = new Set(incidents.map(i => i.id))

          // Detect NEW incidents
          incidents.forEach(inc => {
            if (!prevIncidentIdsRef.current.has(inc.id)) {
              addNotification(
                '🚨 New Incident',
                `${inc.id}: ${inc.title} [${inc.severity}]`,
                inc.severity === 'Critical' ? 'critical' : 'warning'
              )
            }
          })

          // Detect RESOLVED incidents (status changed from non-Resolved to Resolved)
          incidents.forEach(inc => {
            if (inc.status === 'Resolved') {
              const prev = incidentsRef.current.find(p => p.id === inc.id)
              if (prev && prev.status !== 'Resolved') {
                addNotification('✅ Auto-Resolved', `${inc.id} has been auto-resolved`, 'success')
              }
            }
          })

          prevIncidentIdsRef.current = newIds
          dispatch({ type: 'SET_INCIDENTS', payload: incidents })
        }

        // ── Process alerts ──
        if (alertsRes.ok) {
          const alerts = await alertsRes.json()
          alerts.forEach(alert => {
            if (!prevAlertIdsRef.current.has(alert.id)) {
              addNotification(
                '⚡ Alert Triggered',
                `${alert.title} — ${alert.service}`,
                alert.severity === 'Critical' ? 'critical' : 'warning'
              )
            }
          })
          prevAlertIdsRef.current = new Set(alerts.map(a => a.id))
          dispatch({ type: 'SET_ALERTS', payload: alerts })
        }

        // ── Process services ──
        if (servicesRes.ok) {
          dispatch({ type: 'SET_SERVICES', payload: await servicesRes.json() })
        }

        dispatch({ type: 'SET_BACKEND_STATUS', payload: 'connected' })
      } catch (err) {
        if (active) {
          dispatch({ type: 'SET_BACKEND_STATUS', payload: 'error' })
        }
      }
    }

    // Initial fetch + interval
    fetchAllData()
    const intervalId = setInterval(fetchAllData, 3000)

    return () => {
      active = false
      clearInterval(intervalId)
    }
  }, []) // empty deps — refs handle freshness

  // ── API Actions ──────────────────────────────────────────────────────
  const createIncident = useCallback(async (data) => {
    try {
      const res = await fetch('/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          severity: data.severity,
          service: data.service || null,
        }),
      })
      if (res.ok) {
        addNotification('🚨 Incident Created', `${data.title}`, 'warning')
      }
    } catch (err) {
      addNotification('❌ Error', 'Failed to create incident', 'critical')
    }
  }, [addNotification])

  const updateIncident = useCallback(async (id, updates, timelineEvent) => {
    try {
      const res = await fetch(`/incidents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, timelineEvent }),
      })
      if (res.ok && updates.status === 'Resolved') {
        addNotification('✅ Resolved', `${id} has been resolved`, 'success')
      }
    } catch (err) {
      addNotification('❌ Error', 'Failed to update incident', 'critical')
    }
  }, [addNotification])

  const simulateAlert = useCallback(async () => {
    try {
      const res = await fetch('/simulate', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        addNotification('💥 Chaos Injected', `Failure rate: ${data.failureRate}% | Latency: +${data.latencySpike}ms`, 'critical')
      }
    } catch (err) {
      addNotification('❌ Error', 'Failed to inject chaos — is backend running?', 'critical')
    }
  }, [addNotification])

  const login = useCallback((user) => dispatch({ type: 'LOGIN', payload: user }), [])
  const logout = useCallback(() => dispatch({ type: 'LOGOUT' }), [])

  return (
    <AppContext.Provider value={{ state, dispatch, createIncident, updateIncident, simulateAlert, addNotification, login, logout }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
