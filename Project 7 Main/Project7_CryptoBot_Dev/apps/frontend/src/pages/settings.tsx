import React from 'react';

export default function Settings() {
  return (
    <div className="grid" style={{gap:16}}>
      <section className="panel">
        <h2>Tenant Profile</h2>
        <ul>
          <li>Plan — placeholder</li>
          <li>Usage — placeholder</li>
          <li>Billing contact — placeholder</li>
        </ul>
      </section>
      <section className="panel">
        <h2>Billing</h2>
        <ul>
          <li>Stripe status — placeholder</li>
          <li>Next renewal — placeholder</li>
          <li>Invoices — placeholder</li>
        </ul>
      </section>
      <section className="panel">
        <h2>API Keys</h2>
        <button className="user-menu">Generate</button>
        <table className="table" style={{marginTop:8}}>
          <thead><tr><th>Key</th><th>Scope</th><th>Actions</th></tr></thead>
          <tbody><tr><td>••••••</td><td>read</td><td><button className="user-menu">Revoke</button></td></tr></tbody>
        </table>
      </section>
    </div>
  );
}

