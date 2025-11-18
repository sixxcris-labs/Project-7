import { useBalances, useConnections } from "../services/dashboard/hooks";

export default function ConnectionsPage() {
  const { data: balances, error: balancesError } = useBalances();
  const { data: connections, error: connectionsError } = useConnections();

  return (
    <div className="page-grid">
      <h1>Connections &amp; Wallets</h1>
      <div className="panel-grid">
        <div className="panel">
          <header className="panel-header">
            <h2>Connections</h2>
          </header>
          {connectionsError && <p className="widget-error">Could not load connections.</p>}
          {!connections && !connectionsError && <p className="widget-empty">Loading connections…</p>}
          {connections && (
            <ul className="timeline-list">
              {connections.map((conn) => (
                <li key={conn.id}>
                  <strong>{conn.name}</strong>
                  <span>{conn.provider}</span>
                  <span className={`connection-pill is-${conn.status}`}>{conn.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="panel">
          <header className="panel-header">
            <h2>Balances</h2>
          </header>
          {balancesError && <p className="widget-error">Could not load balances.</p>}
          {!balances && !balancesError && <p className="widget-empty">Loading balances…</p>}
          {balances && (
            <ul className="timeline-list">
              {balances.map((balance) => (
                <li key={balance.asset}>
                  <strong>{balance.asset}</strong>
                  <span>
                    {balance.available.toFixed(4)} / {balance.total.toFixed(4)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
