import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { DataPanel } from '../legacy-ui';
import { LegacyButton } from '../legacy-ui';
import { tradingFlowApi } from '../lib/tradingFlowApi';

const topCoins = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', volume: '$12.4B', dominance: '42%' },
  { symbol: 'ETHUSDT', name: 'Ethereum', volume: '$6.3B', dominance: '21%' },
  { symbol: 'SOLUSD', name: 'Solana', volume: '$1.1B', dominance: '5%' },
];

const backtests = [
  { name: 'Mean Reversion v2', sharpe: 1.87, pnl: '+12.4%', summary: 'Soft reentry, tight stops' },
  { name: 'Breakout Alpha', sharpe: 2.1, pnl: '+18.9%', summary: 'Momentum bias' },
];

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<{ equity: number } | null>(null);

  useEffect(() => {
    tradingFlowApi.portfolio().then(setPortfolio).catch(() => setPortfolio(null));
  }, []);

  return (
    <Layout>
      <div className="dashboard-header">
        <div>
          <p className="small">Control Center</p>
          <h1>Trading Overview</h1>
        </div>
        <div>
          <span className="status-pill">Dev · Paper environment</span>
        </div>
      </div>

      <div className="dashboard-summary">
        <div>
          <p className="small">Equity</p>
          <strong>${portfolio ? portfolio.equity.toLocaleString(undefined, { maximumFractionDigits: 0 }) : 'Loading...'}</strong>
        </div>
        <div>
          <p className="small">Guardrails</p>
          <strong>Killswitch · Armed</strong>
        </div>
      </div>

      <div className="dashboard-grid">
        <DataPanel title="PnL / Session" state="ready" actionLabel="Start Session" onAction={() => {}}>
          <p>Paper mode · no real orders are placed.</p>
          <p>Last sync in 12 seconds · Binance status OK.</p>
          <LegacyButton variant="primary">Open trading flow</LegacyButton>
        </DataPanel>
        <DataPanel title="Top coins today" state="ready">
          {topCoins.map((coin) => (
            <div key={coin.symbol} className="metric-card">
              <strong>{coin.symbol}</strong>
              <p>{coin.name}</p>
              <p className="small">{coin.volume} · {coin.dominance} dominance</p>
            </div>
          ))}
        </DataPanel>
      </div>

      <div className="dashboard-grid">
        <DataPanel title="Strategy workbench" state="ready" actionLabel="New backtest" onAction={() => {}}>
          {backtests.map((bt) => (
            <div key={bt.name} className="metric-card">
              <strong>{bt.name}</strong>
              <p>{bt.summary}</p>
              <p className="small">Sharpe {bt.sharpe} · PnL {bt.pnl}</p>
            </div>
          ))}
        </DataPanel>
        <DataPanel title="Live watches" state="ready">
          <p className="small">Positions · 0</p>
          <p className="small">Pending orders · 0</p>
          <p className="small">Buy pressure healthy</p>
        </DataPanel>
      </div>
    </Layout>
  );
}
