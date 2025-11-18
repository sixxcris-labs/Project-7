import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { DataPanel } from "./DataPanel";
import { usePerformanceSummary } from "../../services/dashboard/hooks";

type RangeLabel = {
  label: string;
  value: "today" | "week" | "month";
};

const ranges: RangeLabel[] = [
  { label: "Today", value: "today" },
  { label: "This week", value: "week" },
  { label: "This month", value: "month" },
];

export default function DailyPerformancePanel() {
  const router = useRouter();
  const [range, setRange] = useState<"today" | "week" | "month">("today");
  const { data, error } = usePerformanceSummary(range);
  const state = error ? "error" : data ? "ready" : "loading";

  const metrics = useMemo(() => {
    if (!data) return [];
    return [
      { label: "Today PnL (USD)", value: data.todayPnlUsd.toLocaleString("en-US", { style: "currency", currency: "USD" }) },
      { label: "Win rate today (%)", value: `${data.winRateToday.toFixed(1)}%` },
      { label: "Trades today", value: data.tradesToday },
      { label: "Risk used (%)", value: `${data.riskUsedPct.toFixed(1)}%` },
      { label: "Equity vs ATH (%)", value: `${data.equityVsAthPct.toFixed(1)}%` },
    ];
  }, [data]);

  return (
    <DataPanel
      title="Daily Performance"
      state={state}
      actionLabel="Show trade list"
      onAction={() => router.push(`/activity?range=${range}`)}
      loadingText="Loading performance…"
      errorText="Performance snapshot unavailable."
      emptyText="No performance data yet."
    >
      <div className="panel-controls">
        {ranges.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`pill ${range === option.value ? "pill-active" : ""}`}
            onClick={() => setRange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="metric-grid">
        {metrics.map((metric) => (
          <article key={metric.label} className="metric">
            <p className="metric-label">{metric.label}</p>
            <p className="metric-value">{metric.value}</p>
          </article>
        ))}
      </div>
    </DataPanel>
  );
}
