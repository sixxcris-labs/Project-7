import { useAdminMetrics } from "../services/dashboard/hooks";

export default function AdminPage() {
  const { data, error } = useAdminMetrics();

  return (
    <div className="page-grid">
      <h1>Admin / Ops</h1>
      <div className="panel">
        {error && <p className="widget-error">Admin metrics unavailable.</p>}
        {!data && !error && <p className="widget-empty">Loading admin dashboard…</p>}
        {data && (
          <div className="metric-grid">
            <article className="metric">
              <p className="metric-label">Live uptime (min)</p>
              <p className="metric-value">{data.uptimeMinutes}</p>
            </article>
            <article className="metric">
              <p className="metric-label">Queued jobs</p>
              <p className="metric-value">{data.queuedJobs}</p>
            </article>
            <article className="metric">
              <p className="metric-label">Active users</p>
              <p className="metric-value">{data.activeUsers}</p>
            </article>
            <article className="metric">
              <p className="metric-label">Live deployments</p>
              <p className="metric-value">{data.liveDeployments}</p>
            </article>
          </div>
        )}
      </div>
    </div>
  );
}
