import React, { useMemo, useState } from 'react';
import useSWR from 'swr';
import PriceChart from '../components/PriceChart';
import { apiGet } from '../lib/api';

type Trade = { ts: number; price: number };

export default function Backtesting() {
  const [symbol, setSymbol] = useState('BTC-USDT');
  const { data, error, isLoading, mutate } = useSWR(
    `/api/trades?symbol=${encodeURIComponent(symbol)}`,
    (key) => apiGet<any>(key),
    { revalidateOnFocus: false }
  );

  const points: Trade[] = useMemo(() => {
    const arr = Array.isArray(data) ? data : [];
    return arr.map((t: any) => ({ ts: Number(t.ts), price: Number(t.price) })).filter((p: any) => Number.isFinite(p.ts) && Number.isFinite(p.price));
  }, [data]);

  return (
    <div className="panel">
      <div className="panel-head">
        <h1>Backtesting</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            aria-label="Symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.trim())}
            placeholder="BTC-USDT"
            className="input"
            style={{ minWidth: 140 }}
          />
          <button className="hero-pill" onClick={() => mutate()} disabled={isLoading}>
            {isLoading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="error">Failed to load: {String(error?.message || error)}</div>
      ) : (
        <div>
          <PriceChart data={points} height={320} />
          <p className="muted" style={{ marginTop: 8 }}>
            {points.length ? `Points: ${points.length}` : 'No data yet — try Refresh or another symbol.'}
          </p>
        </div>
      )}
    </div>
  );
}

