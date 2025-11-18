import React from 'react';
import { useExecution } from '../lib/api';
import { BinanceStatusCard } from '../components/monitoring/BinanceStatusCard';
import OrderForm from '../components/orderTicket/OrderForm';

export default function ExecutionTCA() {
  const { data, isLoading, error, mutate } = useExecution();
  return (
    <div className="panel">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h2>Execution & TCA</h2>
        <button className="user-menu" onClick={() => mutate()} aria-label="Refresh execution data">Refresh</button>
      </div>
      <div className="muted">
        {isLoading && 'Loading execution dashboards…'}
        {error && 'Unable to load execution data'}
        {!data && !isLoading && !error && 'Filters: date, venue, strategy, symbol (placeholder)'}
      </div>
      <h3 style={{marginTop:12}}>KPIs</h3>
      <ul>
        <li>Average IS — {data?.summary?.avgIs?.toFixed(2) ?? '—'} bps</li>
        <li>Fill rate — {data?.summary ? `${Math.round(data.summary.fillRate * 100)}%` : '—'}</li>
        <li>Total orders — {data?.summary?.totalOrders ?? '—'}</li>
      </ul>
      <h3>Meta-orders</h3>
      <table className="table">
        <thead>
          <tr><th>Time</th><th>Symbol</th><th>Side</th><th>Notional</th><th>Venue</th><th>IS</th><th>Fees</th><th>Impact</th></tr>
        </thead>
        <tbody>
          {data?.metaOrders?.length ? data.metaOrders.map((order) => (
            <tr key={`${order.time}-${order.symbol}-${order.side}`}>
              <td>{order.time}</td>
              <td>{order.symbol}</td>
              <td>{order.side}</td>
              <td>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(order.notional)}</td>
              <td>{order.venue}</td>
              <td>{order.isBps.toFixed(2)}</td>
              <td>{order.feesBps.toFixed(2)}</td>
              <td>{order.impactBps.toFixed(2)}</td>
            </tr>
          )) : (
            <tr><td colSpan={8} className="muted">No meta-orders loaded</td></tr>
          )}
        </tbody>
      </table>
      <BinanceStatusCard symbol="BTC-USDT" />
      <OrderForm />
    </div>
  );
}
