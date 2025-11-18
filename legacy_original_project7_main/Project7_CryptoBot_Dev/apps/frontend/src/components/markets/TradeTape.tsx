import React from "react";
import { useLiveMarketStore } from "../../stores/liveMarketStore";

interface Props {
  symbol: string;
}

export function TradeTape({ symbol }: Props) {
  const trades = useLiveMarketStore((state) => state.feedBySymbol[symbol] ?? []);

  return (
    <div className="trade-tape-card">
      <h4>Trade Tape</h4>
      <ul>
        {trades.slice(-30).reverse().map((trade) => (
          <li key={trade.ts} className={trade.side}>
            <span>{new Date(trade.ts).toLocaleTimeString()}</span>
            <span>${trade.price.toFixed(2)}</span>
            <span>{trade.size.toFixed(4)}</span>
          </li>
        ))}
      </ul>
      {trades.length === 0 && <p className="muted">Waiting for trades…</p>}
    </div>
  );
}
