import React, { useState } from 'react';
import { useRouter } from 'next/router';

const tabs = ['Performance', 'Risk', 'Execution Sim', 'Diagnostics'] as const;

export default function BacktestDetail() {
  const { query } = useRouter();
  const id = String(query.id || 'backtest');
  const [tab, setTab] = useState<(typeof tabs)[number]>('Performance');

  return (
    <div className="panel">
      <h2>Backtest {id}</h2>
      <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className="user-menu" aria-pressed={tab === t}>{t}</button>
        ))}
      </div>
      {tab === 'Performance' && (
        <div>
          <div className="muted">Equity curve & drawdown — placeholder</div>
          <table className="table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Sharpe</td><td>—</td></tr>
              <tr><td>DSR</td><td>—</td></tr>
              <tr><td>Sortino</td><td>—</td></tr>
              <tr><td>Max DD</td><td>—</td></tr>
              <tr><td>CVaR</td><td>—</td></tr>
            </tbody>
          </table>
        </div>
      )}
      {tab === 'Risk' && (
        <div className="muted">Risk metrics — placeholder</div>
      )}
      {tab === 'Execution Sim' && (
        <div>
          <div className="muted">IS, fees, impact — placeholder</div>
        </div>
      )}
      {tab === 'Diagnostics' && (
        <div className="muted">Logs & params — placeholder</div>
      )}
    </div>
  );
}

