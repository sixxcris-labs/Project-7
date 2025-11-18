import React from 'react';

export default function RiskLimits() {
  return (
    <div className="grid" style={{gap:16}}>
      <section className="panel">
        <h2>Risk Dashboard</h2>
        <ul>
          <li>CVaR — placeholder</li>
          <li>Max DD — placeholder</li>
          <li>Net exposure — placeholder</li>
          <li>Leverage — placeholder</li>
        </ul>
      </section>
      <section className="panel">
        <h2>Per-strategy / Per-venue</h2>
        <div className="muted">Cards — placeholder</div>
      </section>
      <section className="panel">
        <h2>Limits</h2>
        <table className="table">
          <thead>
            <tr><th>Type</th><th>Value</th><th>Usage</th><th>Owner</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr><td>Notional</td><td>$100k</td><td>42%</td><td>Ops</td><td><button className="user-menu">Edit</button></td></tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}

