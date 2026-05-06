import express from 'express'
import cors from 'cors'
import { randomUUID } from 'crypto'
import client from 'prom-client'

const register = new client.Registry()

// Custom Prometheus Gauges
const promTotalRequests = new client.Gauge({ name: 'sentinel_total_requests', help: 'Total requests processed' })
const promTotalErrors = new client.Gauge({ name: 'sentinel_total_errors', help: 'Total error responses' })
const promErrorRate = new client.Gauge({ name: 'sentinel_error_rate_percent', help: 'Current error rate percentage' })
const promAvgLatency = new client.Gauge({ name: 'sentinel_avg_latency_ms', help: 'Average response latency in ms' })
const promActiveIncidents = new client.Gauge({ name: 'sentinel_active_incidents', help: 'Number of active incidents' })
const promHealth = new client.Gauge({ name: 'sentinel_system_health', help: 'System health (0=operational, 1=degraded, 2=outage)' })

register.registerMetric(promTotalRequests)
register.registerMetric(promTotalErrors)
register.registerMetric(promErrorRate)
register.registerMetric(promAvgLatency)
register.registerMetric(promActiveIncidents)
register.registerMetric(promHealth)

const app = express()
app.use(cors())
app.use(express.json())

// ─── Team Members ──────────────────────────────────────────────────────────
const TEAM_MEMBERS = [
  { id: 'usr-1', name: 'Aman', role: 'SRE Lead', avatar: 'A' },
  { id: 'usr-2', name: 'Omkar', role: 'Platform Engineer', avatar: 'O' },
  { id: 'usr-3', name: 'Harsh', role: 'DevOps Engineer', avatar: 'H' },
  { id: 'usr-4', name: 'Utpal', role: 'Incident Commander', avatar: 'U' },
  { id: 'usr-5', name: 'Subhasis', role: 'Backend Engineer', avatar: 'S' },
  { id: 'usr-6', name: 'Raunak', role: 'Infra Engineer', avatar: 'R' },
]

// ─── In-Memory State (single source of truth) ─────────────────────────────
let incidentCounter = 1000
const incidents = []
const alerts = []
const responseTimes = []       // rolling window of recent response times
let totalRequests = 0
let totalErrors = 0

// System behavior knobs — self-healing adjusts these
let failureRate = 0.10         // 10% base failure chance (healthy state)
let latencyBase = 200          // base latency in ms
let latencySpike = 0           // additional spike latency
let recovering = false

// Duplicate alert prevention — track active alert types
const activeAlertTypes = new Set()

// ─── Service List ──────────────────────────────────────────────────────────
const SERVICES = [
  'API Gateway', 'Compute Cluster', 'Cache Layer', 'Database',
  'CDN / Edge', 'Application', 'Load Balancer', 'Networking', 'CI/CD',
]

// ─── System Health (derived from incidents — backend is source of truth) ──
function getSystemHealth() {
  const active = incidents.filter(i => i.status !== 'Resolved')
  const hasCritical = active.some(i => i.severity === 'Critical')
  const hasActive = active.length > 0
  if (hasCritical) return 'outage'
  if (hasActive) return 'degraded'
  return 'operational'
}

function getServiceStatuses() {
  const active = incidents.filter(i => i.status !== 'Resolved')
  return SERVICES.map(name => {
    const relevant = active.filter(i =>
      (i.service && i.service === name) ||
      i.title.toLowerCase().includes(name.toLowerCase().split(' ')[0].toLowerCase())
    )
    let status = 'operational'
    if (relevant.some(i => i.severity === 'Critical')) status = 'outage'
    else if (relevant.length > 0) status = 'degraded'
    return { name, status }
  })
}

// ─── Metrics (derived from real simulated traffic) ─────────────────────────
function getMetrics() {
  const recentTimes = responseTimes.slice(-100)
  const avgResponseTime = recentTimes.length > 0
    ? Math.round(recentTimes.reduce((a, b) => a + b, 0) / recentTimes.length)
    : 0

  // Use rolling window error rate (last 100 requests) for accuracy
  const recentRequests = Math.min(totalRequests, 100)
  const recentErrors = responseTimes.slice(-100).filter((_, i) => {
    // We need a separate error tracking array for rolling accuracy
    return false // placeholder — we use the global rate below
  }).length

  const errorRate = totalRequests > 0
    ? parseFloat(((totalErrors / totalRequests) * 100).toFixed(1))
    : 0

  const activeIncidents = incidents.filter(i => i.status !== 'Resolved').length

  return {
    totalRequests,
    totalErrors,
    errorRate,
    avgResponseTime,
    activeIncidents,
    uptime: process.uptime(),
    failureRate: parseFloat((failureRate * 100).toFixed(1)),
    latencyBase,
    latencySpike: Math.round(latencySpike),
    recovering,
    systemHealth: getSystemHealth(),
    timestamp: new Date().toISOString(),
  }
}

function recordRequest(responseTime, isError) {
  totalRequests++
  if (isError) totalErrors++
  responseTimes.push(responseTime)
  if (responseTimes.length > 200) responseTimes.shift()
}

// ─── Incident Management ───────────────────────────────────────────────────
function createIncident({ title, description, severity, service }) {
  incidentCounter++
  const assignee = TEAM_MEMBERS[Math.floor(Math.random() * TEAM_MEMBERS.length)]
  const now = new Date().toISOString()
  const incident = {
    id: `INC-${String(incidentCounter).padStart(4, '0')}`,
    title,
    description,
    severity,
    status: 'Open',
    service: service || null,
    assignee,
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
    healAt: Date.now() + 15000 + Math.random() * 10000, // stable heal time: 15-25s from creation
    timeline: [{ time: now, event: 'Incident created', type: 'created' }],
  }
  incidents.unshift(incident)
  console.log(`  🚨 INCIDENT ${incident.id}: ${title} [${severity}]`)
  return incident
}

// ─── Alert Engine ──────────────────────────────────────────────────────────
function createAlert(type, severity) {
  // STRICT: prevent duplicate alerts for same active condition
  if (activeAlertTypes.has(type)) return null

  const m = getMetrics()
  const templates = {
    high_error_rate: {
      title: 'Elevated Error Rate',
      description: `Error rate at ${m.errorRate}% — exceeds 20% threshold`,
      service: 'API Gateway',
    },
    high_latency: {
      title: 'High API Latency Detected',
      description: `Average response time at ${m.avgResponseTime}ms — exceeds 1000ms threshold`,
      service: 'Load Balancer',
    },
  }
  const tpl = templates[type]
  if (!tpl) return null

  // Mark this alert type as active
  activeAlertTypes.add(type)

  const alert = {
    id: randomUUID(),
    type,
    title: tpl.title,
    description: tpl.description,
    severity,
    service: tpl.service,
    timestamp: new Date().toISOString(),
    acknowledged: false,
  }
  alerts.unshift(alert)
  console.log(`  ⚡ ALERT: ${tpl.title} [${severity}]`)

  // Each alert creates exactly ONE incident
  createIncident({
    title: tpl.title,
    description: tpl.description,
    severity,
    service: tpl.service,
  })

  return alert
}

// ─── Monitoring Engine (every 5 seconds) ───────────────────────────────────
function monitoringLoop() {
  const m = getMetrics()

  // Check error rate threshold (>20%)
  if (m.errorRate > 20) {
    createAlert('high_error_rate', m.errorRate > 40 ? 'Critical' : 'High')
  }

  // Check latency threshold (>1000ms)
  if (m.avgResponseTime > 1000) {
    createAlert('high_latency', m.avgResponseTime > 1500 ? 'Critical' : 'High')
  }

  // Clear active alert types when conditions normalize
  if (m.errorRate <= 20) activeAlertTypes.delete('high_error_rate')
  if (m.avgResponseTime <= 1000) activeAlertTypes.delete('high_latency')

  // Console status
  const icon = m.systemHealth === 'outage' ? '🔴' : m.systemHealth === 'degraded' ? '🟡' : '🟢'
  console.log(`${icon} Monitor | Reqs: ${m.totalRequests} | Err: ${m.errorRate}% | Lat: ${m.avgResponseTime}ms | Active: ${m.activeIncidents} | Health: ${m.systemHealth}`)
}

setInterval(monitoringLoop, 5000)

// ─── Self-Healing Engine (every 3 seconds) ─────────────────────────────────
function selfHealingLoop() {
  const active = incidents.filter(i => i.status !== 'Resolved')
  if (active.length === 0) {
    recovering = false
    return
  }

  active.forEach(inc => {
    const now = Date.now()

    // Use the stable healAt timestamp (set once at creation)
    if (now < inc.healAt) return

    // Phase 1: Open → Investigating (after healAt reached)
    if (inc.status === 'Open') {
      inc.status = 'Investigating'
      inc.updatedAt = new Date().toISOString()
      inc.timeline.push({
        time: new Date().toISOString(),
        event: 'Auto-investigation started — analyzing metrics',
        type: 'status_change',
      })
      // Set resolve time 5-8 seconds after investigation starts
      inc.resolveAt = now + 5000 + Math.random() * 3000
      console.log(`  🔍 Self-heal: ${inc.id} → Investigating`)
      return
    }

    // Phase 2: Investigating → Resolved (after resolveAt)
    if (inc.status === 'Investigating' && inc.resolveAt && now >= inc.resolveAt) {
      const ts = new Date().toISOString()
      inc.status = 'Resolved'
      inc.resolvedAt = ts
      inc.updatedAt = ts
      inc.timeline.push(
        { time: new Date(now - 2000).toISOString(), event: 'Root cause identified — deploying fix', type: 'update' },
        { time: ts, event: 'Incident auto-resolved — service recovered', type: 'resolved' },
      )
      console.log(`  ✅ Self-heal: ${inc.id} → Resolved`)

      // Reduce system stress on resolution
      failureRate = Math.max(0.08, failureRate - 0.08)
      latencySpike = Math.max(0, latencySpike - 300)
      recovering = true
      setTimeout(() => { recovering = false }, 5000)
    }
  })
}

setInterval(selfHealingLoop, 3000)

// ─── Traffic Simulator (background load) ───────────────────────────────────
function simulateTraffic() {
  const latency = latencyBase + latencySpike + Math.random() * 300
  const isError = Math.random() < failureRate
  recordRequest(Math.round(latency), isError)
}

// Generate 2-5 requests per second
setInterval(() => {
  const batch = 2 + Math.floor(Math.random() * 4)
  for (let i = 0; i < batch; i++) simulateTraffic()
}, 1000)

// ═══════════════════════════════════════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'sentinel-backend', uptime: process.uptime() })
})

// Team members (frontend fetches this instead of importing mockData)
app.get('/api/team', (req, res) => {
  res.json(TEAM_MEMBERS)
})

// Sample data endpoint with real simulated failures
app.get('/api/data', (req, res) => {
  const start = Date.now()
  const delay = latencyBase + latencySpike + Math.random() * 500
  const shouldFail = Math.random() < failureRate

  setTimeout(() => {
    const responseTime = Date.now() - start
    recordRequest(responseTime, shouldFail)

    if (shouldFail) {
      return res.status(500).json({ error: 'Internal Server Error', message: 'Simulated failure' })
    }
    res.json({
      data: { message: 'Sample response', timestamp: new Date().toISOString() },
      responseTime,
    })
  }, delay)
})

// Standard JSON Metrics endpoint (used by React UI)
app.get('/metrics', (req, res) => {
  res.json(getMetrics())
})

// Prometheus text format endpoint (used by Prometheus scraper)
app.get('/metrics/prometheus', async (req, res) => {
  const m = getMetrics()
  promTotalRequests.set(m.totalRequests)
  promTotalErrors.set(m.totalErrors)
  promErrorRate.set(m.errorRate)
  promAvgLatency.set(m.avgResponseTime)
  promActiveIncidents.set(m.activeIncidents)
  promHealth.set(m.systemHealth === 'operational' ? 0 : m.systemHealth === 'degraded' ? 1 : 2)

  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
})

// Incidents — GET all
app.get('/incidents', (req, res) => {
  // Strip internal fields (healAt, resolveAt) before sending
  const clean = incidents.map(({ healAt, resolveAt, ...inc }) => inc)
  res.json(clean)
})

// Incidents — POST create (manual from UI)
app.post('/incidents', (req, res) => {
  const { title, description, severity, service } = req.body
  if (!title) return res.status(400).json({ error: 'Title is required' })
  const inc = createIncident({
    title,
    description: description || '',
    severity: severity || 'Medium',
    service: service || null,
  })
  const { healAt, resolveAt, ...clean } = inc
  res.status(201).json(clean)
})

// Incidents — PATCH update
app.patch('/incidents/:id', (req, res) => {
  const inc = incidents.find(i => i.id === req.params.id)
  if (!inc) return res.status(404).json({ error: 'Incident not found' })

  const { status, severity, assignee, timelineEvent } = req.body
  const now = new Date().toISOString()

  if (status) {
    const entry = { time: now, event: timelineEvent || `Status changed to ${status}`, type: 'status_change' }
    if (status === 'Resolved') {
      inc.resolvedAt = now
      entry.type = 'resolved'
      entry.event = timelineEvent || 'Incident resolved manually'
      // Also reduce stress on manual resolve
      failureRate = Math.max(0.08, failureRate - 0.05)
      latencySpike = Math.max(0, latencySpike - 200)
    }
    inc.status = status
    inc.timeline.push(entry)
  }
  if (severity) inc.severity = severity
  if (assignee) {
    const member = TEAM_MEMBERS.find(m => m.id === assignee)
    if (member) {
      inc.assignee = member
      inc.timeline.push({ time: now, event: `Reassigned to ${member.name}`, type: 'update' })
    }
  }
  inc.updatedAt = now

  const { healAt, resolveAt, ...clean } = inc
  res.json(clean)
})

// Alerts endpoint
app.get('/alerts', (req, res) => {
  res.json(alerts)
})

// ─── POST /simulate — Manual chaos injection (for demo) ───────────────────
app.post('/simulate', (req, res) => {
  // Spike failure rate and latency
  failureRate = Math.min(0.55, failureRate + 0.20)
  latencySpike = latencySpike + 500 + Math.random() * 500

  console.log(`\n  💥 CHAOS INJECTED — failureRate: ${(failureRate * 100).toFixed(0)}%, latencySpike: ${latencySpike.toFixed(0)}ms`)

  // Run immediate monitoring check to detect the spike
  setTimeout(() => {
    monitoringLoop()
    res.json({
      message: 'Chaos injected — system degraded',
      failureRate: parseFloat((failureRate * 100).toFixed(1)),
      latencySpike: Math.round(latencySpike),
    })
  }, 500)
})

// Service statuses (backend-driven)
app.get('/api/services', (req, res) => {
  res.json(getServiceStatuses())
})

// ─── Start Server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`\n  ◆ Sentinel Backend v2.0 — http://localhost:${PORT}`)
  console.log(`  ├─ Health:     GET /`)
  console.log(`  ├─ Team:       GET /api/team`)
  console.log(`  ├─ Data:       GET /api/data`)
  console.log(`  ├─ Metrics:    GET /metrics`)
  console.log(`  ├─ Prometheus: GET /metrics/prometheus`)
  console.log(`  ├─ Incidents:  GET|POST /incidents, PATCH /incidents/:id`)
  console.log(`  ├─ Alerts:     GET /alerts`)
  console.log(`  ├─ Services:   GET /api/services`)
  console.log(`  ├─ Simulate:   POST /simulate`)
  console.log(`  └─ Engines: traffic (1s) | monitor (5s) | self-heal (3s)\n`)
})
