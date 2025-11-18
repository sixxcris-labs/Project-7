import { useRouter } from "next/router";
import { DataPanel } from "./DataPanel";
import { useGuardrailsState } from "../../services/dashboard/hooks";

export default function GuardrailsPanel() {
  const router = useRouter();
  const { data, error } = useGuardrailsState();
  const state = error ? "error" : data ? "ready" : "loading";

  return (
    <DataPanel
      title="Guardrails"
      state={state}
      actionLabel="Adjust risk"
      onAction={() => router.push("/settings#risk")}
      loadingText="Loading guardrails…"
      errorText="Guardrails unavailable."
      emptyText="No guardrail data yet."
    >
      {data && (
        <div className="panel-body">
          <div className="status-pill">
            {data.guardrailsEnabled ? "Guardrails enabled" : "Guardrails disabled"}
          </div>
          <div className="metric-grid">
            <article className="metric">
              <p className="metric-label">Daily trade limit</p>
              <p className="metric-value">
                {data.dailyTradeLimitUsed} / {data.dailyTradeLimitMax}
              </p>
            </article>
            <article className="metric">
              <p className="metric-label">Max position size (%)</p>
              <p className="metric-value">{data.maxPositionSizePct}%</p>
            </article>
            <article className="metric">
              <p className="metric-label">Largest position today</p>
              <p className="metric-value">{data.largestPositionTodayPct}%</p>
            </article>
          </div>
        </div>
      )}
    </DataPanel>
  );
}
