import { v4 as uuidv4 } from 'uuid'

export const TEAM_MEMBERS = [
  { id: 'usr-1', name: 'Arjun Mehta', role: 'SRE Lead', avatar: 'AM' },
  { id: 'usr-2', name: 'Priya Sharma', role: 'Platform Engineer', avatar: 'PS' },
  { id: 'usr-3', name: 'Ravi Kumar', role: 'DevOps Engineer', avatar: 'RK' },
  { id: 'usr-4', name: 'Sneha Patel', role: 'Incident Commander', avatar: 'SP' },
  { id: 'usr-5', name: 'Vikram Singh', role: 'Backend Engineer', avatar: 'VS' },
  { id: 'usr-6', name: 'Ananya Gupta', role: 'Infra Engineer', avatar: 'AG' },
]

export const SEVERITIES = ['Low', 'Medium', 'High', 'Critical']
export const STATUSES = ['Open', 'Investigating', 'Resolved']

export const ALERT_TEMPLATES = [
  { type: 'high_latency', title: 'High API Latency Detected', description: 'API response time exceeded 2000ms threshold on gateway-prod-01', severity: 'High', service: 'API Gateway' },
  { type: 'server_down', title: 'Server Unreachable', description: 'Health check failed for compute node prod-worker-03 after 3 consecutive attempts', severity: 'Critical', service: 'Compute Cluster' },
  { type: 'memory_leak', title: 'Memory Usage Critical', description: 'Memory utilization at 94% on cache-server-02, approaching OOM threshold', severity: 'Critical', service: 'Cache Layer' },
  { type: 'disk_full', title: 'Disk Space Warning', description: 'Disk usage at 89% on db-replica-01, projected full in 6 hours', severity: 'High', service: 'Database' },
  { type: 'ssl_expiry', title: 'SSL Certificate Expiring', description: 'TLS certificate for *.sentinel.io expires in 7 days', severity: 'Medium', service: 'CDN / Edge' },
  { type: 'cpu_spike', title: 'CPU Utilization Spike', description: 'CPU usage sustained at 98% on app-server-05 for 10 minutes', severity: 'High', service: 'Application' },
  { type: 'db_connection', title: 'Database Connection Pool Exhausted', description: 'Connection pool saturated on primary PostgreSQL instance (max 200)', severity: 'Critical', service: 'Database' },
  { type: 'error_rate', title: 'Elevated 5xx Error Rate', description: 'HTTP 5xx error rate increased to 12% across region us-east-1', severity: 'High', service: 'Load Balancer' },
  { type: 'dns_failure', title: 'DNS Resolution Failure', description: 'Intermittent DNS resolution failures for internal service discovery', severity: 'Medium', service: 'Networking' },
  { type: 'deployment_fail', title: 'Deployment Pipeline Failed', description: 'Canary deployment rolled back after health check failures in staging', severity: 'Low', service: 'CI/CD' },
]

export const SERVICES = [
  { name: 'API Gateway', status: 'operational' },
  { name: 'Compute Cluster', status: 'operational' },
  { name: 'Cache Layer', status: 'operational' },
  { name: 'Database', status: 'operational' },
  { name: 'CDN / Edge', status: 'operational' },
  { name: 'Application', status: 'operational' },
  { name: 'Load Balancer', status: 'operational' },
  { name: 'Networking', status: 'operational' },
  { name: 'CI/CD', status: 'operational' },
]

function randomDate(daysBack) {
  const now = new Date()
  const past = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()))
}

export function generateSeedIncidents() {
  const incidents = []
  const titles = [
    'Payment service timeout across EU region',
    'Authentication service degraded performance',
    'CDN cache invalidation delay',
    'Kubernetes pod crash loop in production',
    'Redis cluster failover triggered',
    'Load balancer health check flapping',
    'Elasticsearch indexing lag exceeding 30min',
    'Message queue consumer backlog growing',
  ]

  for (let i = 0; i < titles.length; i++) {
    const created = randomDate(14)
    const severity = SEVERITIES[Math.floor(Math.random() * 4)]
    const isResolved = Math.random() > 0.35
    const resolveTime = isResolved
      ? new Date(created.getTime() + Math.random() * 4 * 60 * 60 * 1000)
      : null
    const assignee = TEAM_MEMBERS[Math.floor(Math.random() * TEAM_MEMBERS.length)]

    const timeline = [
      { time: created.toISOString(), event: 'Incident created', type: 'created' },
      { time: new Date(created.getTime() + 5 * 60 * 1000).toISOString(), event: 'Alert acknowledged by ' + assignee.name, type: 'acknowledged' },
      { time: new Date(created.getTime() + 12 * 60 * 1000).toISOString(), event: 'Investigation started — checking service logs', type: 'status_change' },
    ]

    if (isResolved) {
      timeline.push(
        { time: new Date(resolveTime.getTime() - 10 * 60 * 1000).toISOString(), event: 'Root cause identified — deploying fix', type: 'update' },
        { time: resolveTime.toISOString(), event: 'Incident resolved — service restored', type: 'resolved' },
      )
    }

    incidents.push({
      id: `INC-${String(1000 + i).padStart(4, '0')}`,
      title: titles[i],
      description: `Automated detection: ${titles[i]}. Impact assessment in progress. Affected region: ${['us-east-1', 'eu-west-1', 'ap-south-1'][Math.floor(Math.random() * 3)]}`,
      severity,
      status: isResolved ? 'Resolved' : (Math.random() > 0.5 ? 'Investigating' : 'Open'),
      assignee,
      createdAt: created.toISOString(),
      updatedAt: (resolveTime || new Date(created.getTime() + 30 * 60 * 1000)).toISOString(),
      resolvedAt: resolveTime ? resolveTime.toISOString() : null,
      timeline,
    })
  }

  return incidents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}
