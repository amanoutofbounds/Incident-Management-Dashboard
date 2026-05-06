# Connecting Sentinel to Prometheus & Grafana

I have updated the Node.js Express backend to export system metrics in the native Prometheus text format via the `prom-client` library. 

The metrics are exposed on the backend at:
**`http://localhost:3001/metrics/prometheus`**

Here is how you can connect this data pipeline into Prometheus and visualize it with Grafana.

---

## 1. Setup Prometheus

If you downloaded the Prometheus Windows binary (`prometheus-x.x.x.windows-amd64`), follow these steps:

### `prometheus.yml`

Create a file named `prometheus.yml` in your working directory and configure it to scrape the Sentinel backend:

```yaml
global:
  scrape_interval: 5s # Match the backend's 5s monitoring loop
  evaluation_interval: 5s

scrape_configs:
  - job_name: 'sentinel_backend'
    metrics_path: '/metrics/prometheus'
    static_configs:
      - targets: ['localhost:3001']
```

### Run Prometheus
Open PowerShell, navigate to your Prometheus folder (`D:\prometheus-3.5.1.windows-amd64`), and start the executable:

```powershell
.\prometheus.exe --config.file=prometheus.yml
```

You can verify Prometheus is receiving data by opening `http://localhost:9090` and searching for `sentinel_error_rate_percent`.

---

## 2. Setup Grafana

Once Prometheus is collecting data, connect it to Grafana to build advanced dashboards.

If you have Grafana installed natively on Windows (or downloaded the standalone binary):

1. Start the Grafana server (usually by running `bin\grafana-server.exe` in the Grafana folder).
2. Wait for it to start.

### Connect the Data Source
1. Open Grafana at `http://localhost:3000` (default login is `admin` / `admin`).
2. Go to **Connections > Data Sources > Add data source**.
3. Select **Prometheus**.
4. Set the Prometheus Server URL to `http://localhost:9090`.
5. Click **Save & Test**.

---

## 3. Build Your Dashboard

You can now create a new dashboard and use the custom metrics that Sentinel exports.

### Available Sentinel Metrics
You can use these PromQL queries when adding panels in Grafana:

*   **Error Rate (%)**: `sentinel_error_rate_percent`
*   **Average Latency**: `sentinel_avg_latency_ms`
*   **Active Incidents**: `sentinel_active_incidents`
*   **System Health**: `sentinel_system_health` *(0 = Operational, 1 = Degraded, 2 = Outage)*
*   **Total Requests**: `sentinel_total_requests`
*   **Total Errors**: `sentinel_total_errors`

### Example: Error Rate & Latency Graph
1. Create a **Time series** panel.
2. Add query A: `sentinel_error_rate_percent` (set axis to "Percent").
3. Add query B: `sentinel_avg_latency_ms` (set axis to "ms" and map to the right Y-axis).
4. Set the panel refresh interval to **5s** so it updates live as you inject chaos in the Sentinel UI!
