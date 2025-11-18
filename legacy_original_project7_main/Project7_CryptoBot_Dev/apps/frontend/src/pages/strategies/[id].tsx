import React from 'react';
import { useRouter } from 'next/router';
import { useStrategy } from '../../lib/api';

export default function StrategyDetail() {
  const { query } = useRouter();
  const id = query.id ? String(query.id) : undefined;
  const { data, error, isLoading, mutate } = useStrategy(id);

  return (
    <div className="grid" style={{gap:16}}>
      <section className="panel">
        <h2 style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span>{id || 'strategy'} — Overview</span>
          <button className="user-menu" onClick={() => mutate()} aria-label="Refresh">Refresh</button>
        </h2>
        {isLoading && <p className="muted">Loading…</p>}
        {error && <p className="muted">Failed to load strategy</p>}
        {data && (
          <>
            {data.description && <p className="muted">{data.description}</p>}
            {data.parameters && typeof data.parameters === 'object' && (
              <table className="table">
                <thead><tr><th>Parameter</th><th>Value</th></tr></thead>
                <tbody>
                  {Object.entries<any>(data.parameters).map(([k,v]) => (
                    <tr key={k}><td>{k}</td><td>{String(v)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </section>
      <section className="panel">
        <h2>Regime Summary</h2>
        <div className="muted">{data?.regimes ? 'Data present' : 'Placeholder for regime stats'}</div>
      </section>
      <section className="panel">
        <h2>Backtest Timeline</h2>
        <div className="muted">Timeline / list — placeholder</div>
      </section>
      <section className="panel">
        <h2>Key Metrics</h2>
        <table className="table">
          <tbody>
            <tr><td>Sharpe</td><td>{data?.metrics?.sharpe ?? '—'}</td></tr>
            <tr><td>DSR</td><td>{data?.metrics?.dsr ?? '—'}</td></tr>
            <tr><td>Max DD</td><td>{data?.metrics?.maxDD ?? '—'}</td></tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}
