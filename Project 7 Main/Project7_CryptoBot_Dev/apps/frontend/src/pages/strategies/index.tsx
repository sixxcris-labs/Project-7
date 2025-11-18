import React from 'react';
import Link from 'next/link';
import { useStrategies } from '../../lib/api';

export default function StrategiesList() {
  const { data, error, isLoading, mutate } = useStrategies();

  return (
    <div className="panel">
      <h2 style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span>Strategies</span>
        <button className="user-menu" onClick={() => mutate()} aria-label="Refresh">Refresh</button>
      </h2>
      {isLoading && <div className="muted">Loading…</div>}
      {error && <div className="muted">Failed to load strategies</div>}
      {Array.isArray(data) && (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th><th>Category</th><th>Status</th><th>Last Backtest</th><th>Last DSR</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r: any) => (
              <tr key={r.id || r.name}>
                <td><Link href={`/strategies/${r.id || r.name}`}>{r.name || r.id}</Link></td>
                <td>{r.category ?? '—'}</td>
                <td>{r.status ?? '—'}</td>
                <td>{r.lastBacktest ?? '—'}</td>
                <td>{r.lastDSR ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
