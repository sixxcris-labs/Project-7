import { useActivity } from "../services/dashboard/hooks";

export default function ActivityPage() {
  const { data, error } = useActivity();

  return (
    <div className="page-grid">
      <h1>Activity / Orders</h1>
      <div className="panel">
        {error && <p className="widget-error">Activity feed failed to load.</p>}
        {!data && !error && <p className="widget-empty">Loading activity…</p>}
        {data && (
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Symbol</th>
                <th>Type</th>
                <th>Side</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id}>
                  <td>{new Date(row.ts).toLocaleTimeString()}</td>
                  <td>{row.symbol}</td>
                  <td>{row.type}</td>
                  <td>{row.side}</td>
                  <td>{row.qty}</td>
                  <td>{row.price}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
