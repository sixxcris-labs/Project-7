import { useState } from "react";
import {
  explainGuardrailsWarning,
  updateGuardrails,
  useGuardrailsState,
} from "../../services/dashboard/hooks";

export default function MindSafetyWidget() {
  const { data, error, mutate } = useGuardrailsState();
  const [isToggling, setIsToggling] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const guardrailsEnabled = data?.guardrailsEnabled ?? false;

  const toggleGuardrails = async () => {
    if (!data) return;
    setIsToggling(true);
    try {
      await updateGuardrails({ guardrailsEnabled: !guardrailsEnabled });
      await mutate();
    } catch (err) {
      console.error("Unable to toggle guardrails", err);
    } finally {
      setIsToggling(false);
    }
  };

  const handleExplain = async () => {
    try {
      const response = await explainGuardrailsWarning();
      setWarning(typeof response === "string" ? response : "Guardrail explained.");
    } catch (err) {
      console.error(err);
      setWarning("Could not explain guardrails right now.");
    }
  };

  return (
    <section className="widget-card">
      <header className="widget-header">
        <div>
          <p className="widget-label">Safety band</p>
          <h2>Mind Safety / Guardrails</h2>
        </div>
        <div className="widget-controls">
          <button type="button" className="pill" onClick={toggleGuardrails} disabled={isToggling}>
            {guardrailsEnabled ? "Guardrails enabled" : "Enable guardrails"}
          </button>
          <button type="button" className="link-button" onClick={handleExplain}>
            Explain this warning
          </button>
        </div>
      </header>

      {!data && !error && <p className="widget-empty">Loading guardrails…</p>}
      {error && <p className="widget-error">Cannot load guardrails.</p>}

      {data && (
        <div className="metric-grid">
          <article className="metric">
            <p className="metric-label">Daily trade limit used</p>
            <p className="metric-value">
              {data.dailyTradeLimitUsed} / {data.dailyTradeLimitMax}
            </p>
          </article>
          <article className="metric">
            <p className="metric-label">Max position size (%)</p>
            <p className="metric-value">{data.maxPositionSizePct}%</p>
          </article>
          <article className="metric">
            <p className="metric-label">Largest position today (%)</p>
            <p className="metric-value">{data.largestPositionTodayPct}%</p>
          </article>
          <article className="metric">
            <p className="metric-label">Behavior flag</p>
            <p className="metric-value">{data.behaviorFlag || "Normal"}</p>
          </article>
        </div>
      )}

      {warning && <p className="widget-note">{warning}</p>}
    </section>
  );
}
