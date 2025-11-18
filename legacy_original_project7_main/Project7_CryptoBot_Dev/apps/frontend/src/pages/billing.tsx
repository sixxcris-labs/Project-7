import { useBilling } from "../services/dashboard/hooks";

export default function BillingPage() {
  const { data, error } = useBilling();

  return (
    <div className="page-grid">
      <h1>Billing</h1>
      <div className="panel">
        {error && <p className="widget-error">Billing info unavailable.</p>}
        {!data && !error && <p className="widget-empty">Loading billing summary…</p>}
        {data && (
          <>
            <p>
              Period: <strong>{data.period}</strong>
            </p>
            <p>
              Spend: <strong>${data.spend.toFixed(2)}</strong> · Budget:{" "}
              <strong>${data.budget.toFixed(2)}</strong>
            </p>
            <p>
              Remaining: <strong>${data.remaining.toFixed(2)}</strong>
            </p>
            {data.alerts.length > 0 && (
              <div>
                <h3>Alerts</h3>
                <ul>
                  {data.alerts.map((alert) => (
                    <li key={alert}>{alert}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
