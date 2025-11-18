import React from 'react';
import { useMarketData } from '../../hooks/useMarketData';
import { useTradingAccount } from '../../hooks/useTradingAccount';

const tradingEnabled = /^true$/i.test(process.env.NEXT_PUBLIC_BINANCE_TRADING_ENABLED || 'false');

export interface BinanceStatusCardProps {
  symbol?: string;
}

export function BinanceStatusCard({ symbol = 'BTC-USDT' }: Readonly<BinanceStatusCardProps>) {
  const { orderBook, trades, isLoading, error } = useMarketData(symbol);
  const { data: account, error: acctError } = useTradingAccount();

  const lastPrice = trades?.[0]?.price ?? orderBook?.bids?.[0]?.price;
  const lastUpdate = orderBook ? new Date(orderBook.ts).toLocaleTimeString() : 'waiting';

  return (
    <div className="panel" style={{ marginTop: 20 }}>
      <h3>Binance Status</h3>
      <p className="muted">Symbol: {symbol}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <strong>Trading</strong>
          <div className={tradingEnabled ? 'green' : 'muted'}>
            {tradingEnabled ? 'Enabled (env)' : 'Read-only (env)'}
          </div>
        </div>
        <div>
          <strong>Market</strong>
          <div>{lastPrice ? `$${lastPrice.toFixed(2)}` : 'waiting for data'}</div>
        </div>
        <div>
          <strong>Orderbook</strong>
          <div>{lastUpdate}</div>
        </div>
      </div>
      <div className="muted" style={{ marginTop: 12 }}>
        {isLoading && 'Refreshing Binance data…'}
        {error && 'Unable to load market data; check backend log.'}
        {acctError && 'Account lookup failed; check keys.'}
        {account && <span>Account balances: {account.balances.length} assets</span>}
      </div>
    </div>
  );
}
