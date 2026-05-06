# Sentinel: SRE Incident Management Dashboard

Sentinel is a full-stack Site Reliability Engineering (SRE) incident management and monitoring dashboard. It simulates a live production environment with real-time metrics, automated alerting, incident auto-creation, and self-healing mechanisms. 

![Sentinel Dashboard](https://img.shields.io/badge/Status-Operational-success)
![Version](https://img.shields.io/badge/Version-2.0-blue)
![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Express-orange)

## 🚀 Features

- **Live System Metrics:** Real-time tracking of Request Volume, Error Rates, and API Latency.
- **Automated SRE Lifecycle:** 
  - Background traffic simulator (2-5 req/sec).
  - Monitoring engine checks thresholds every 5 seconds.
  - Automatically triggers Alerts and creates Incidents when thresholds are breached.
- **Chaos Engineering:** "Inject Chaos" button allows you to manually spike error rates and latency to test system responsiveness.
- **Self-Healing Engine:** Incidents automatically progress through `Open` → `Investigating` → `Resolved` states, stabilizing system metrics over time.
- **Prometheus Integration:** Native endpoint (`/metrics/prometheus`) exposing metrics in Prometheus text format for Grafana visualization.

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Recharts (for live graphs), CSS Variables (Warm Dark Theme).
- **Backend:** Node.js, Express, UUID, Prom-Client.
- **Architecture:** Zero mock data on the frontend; the Express backend acts as the single source of truth for all state, metrics, and incident timelines.

## 📦 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/sentinel-dashboard.git
   cd sentinel-dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the application:**
   ```bash
   npm run dev
   ```
   *This uses `concurrently` to start both the Express backend (port 3001) and Vite frontend (port 5173).*

4. **Access the Dashboard:**
   Open your browser and navigate to `http://localhost:5173`.

## 📊 Prometheus & Grafana Setup

The backend exposes a Prometheus scrape endpoint at `http://localhost:3001/metrics/prometheus`. 

For detailed instructions on setting up Prometheus and Grafana, please see the [Prometheus & Grafana Setup Guide](./prometheus-grafana-setup.md).

## 💡 How it works (The Simulation)

1. **Normal State:** Background traffic flows with a ~10% error rate and ~200ms latency.
2. **Chaos Injected:** Clicking "Inject Chaos" spikes the failure rate by 20% and adds +500ms latency.
3. **Alert Triggered:** The monitoring engine detects Error Rate > 20% or Latency > 1000ms.
4. **Incident Created:** An incident is automatically logged and assigned to an on-call engineer.
5. **Auto-Recovery:** The self-healing loop takes over, investigating the incident for ~5-8 seconds, and then resolving it. Metrics begin to normalize back to healthy thresholds.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
