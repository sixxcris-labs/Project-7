import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { usePerformanceSummary } from "../../services/dashboard/hooks";
import type { TimeRange } from "@common/types/dashboard";

const ranges: TimeRange[] = ["today", "week", "month"];

export default function DailyPerformanceWidget() {
  const router = useRouter();
  const [range, setRange] = useState<TimeRange>("today");
  const { data, error } = usePerformanceSummary(range);
  const loading = !data && !error;

  const metrics = useMemo(
    () => [
      { label: "Today PnL (USD)", value: data?.todayPnlUsd?.toLocaleString("en-US", { style: "currency", currency: "USD" }) ?? "—" },
      { label: "Today PnL (%) vs yesterday equity", value: data?.todayPnlPct != null ? `${data.todayPnlPct.toFixed(2)}%` : "—" },
      { label: "Weekly PnL (USD)", value: data?.weeklyPnlUsd?.toLocaleString("en-US", { style: "currency", currency: "USD" }) ?? "—" },
      { label: "Weekly PnL (%)", value: data?.weeklyPnlPct != null ? `${data.weeklyPnlPct.toFixed(2)}%` : "—" },
      { label: "Win rate today (%)", value: data?.winRateToday != null ? `${data.winRateToday.toFixed(1)}%` : "—" },
      { label: "Number of trades today", value: data?.tradesToday ?? "—" },
      { label: "Risk used vs budget (%)", value: data?.riskUsedPct != null ? `${data.riskUsedPct.toFixed(1)}%` : "—" },
      { label: "Equity vs ATH (%)", value: data?.equityVsAthPct != null ? `${data.equityVsAthPct.toFixed(1)}%` : "—" },
      { label: "Max drawdown today (%)", value: data?.maxDrawdownTodayPct != null ? `${data.maxDrawdownTodayPct.toFixed(1)}%` : "—" },
      { label: "Current streak", value: data?.currentStreak ?? "—" },
    ],
    [data],
  );

  return (
    <section className="widget-card">
      <header className="widget-header">
        <div>
          <p className="widget-label">Top strip</p>
          <h2>Daily Performance</h2>
        </div>
        <div className="widget-controls">
          {ranges.map((option) => (
            <button
              key={option}
              type="button"
              className={`pill ${range === option ? "pill-active" : ""}`}
              onClick={() => setRange(option)}
            >
              {option === "today" ? "Today" : option === "week" ? "This Week" : "This Month"}
            </button>
          ))}
        </div>
      </header>

      {loading && <p className="widget-empty">Loading performance…</p>}
      {error && <p className="widget-error">Failed to load performance.</p>}

      {!loading && !error && (
        <div className="metric-grid">
          {metrics.map((metric) => (
            <article key={metric.label} className="metric">
              <p className="metric-label">{metric.label}</p>
              <p className="metric-value">{metric.value}</p>
            </article>
          ))}
        </div>
      )}

      <div className="widget-actions">
        <button
          type="button"
          className="pill-secondary"
          onClick={() => router.push(`/activity?range=${range}`)}
        >
          Show trade list
        </button>
        <button
          type="button"
          className="pill-secondary"
          onClick={() => router.push("/settings#risk")}
        >
          Adjust risk budget
        </button>
      </div>
    </section>
  );
}
