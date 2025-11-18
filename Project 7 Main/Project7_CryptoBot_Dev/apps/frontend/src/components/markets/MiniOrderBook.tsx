import React, { useMemo } from "react";
import { useLiveMarketStore } from "../../stores/liveMarketStore";

interface Props {
  symbol: string;
}

export function MiniOrderBook({ symbol }: Props) {
  const trades = useLiveMarketStore((state) => state.feedBySymbol[symbol] ?? []);

  const { bids, asks } = useMemo(() => {
    const recent = trades.slice(-40);
    const bidLevels = recent.filter((t) => t.side === "buy").slice(-5).reverse();
    const askLevels = recent.filter((t) => t.side === "sell").slice(-5).reverse();
    return { bids: bidLevels, asks: askLevels };
  }, [trades]);

  return (
    <div className="orderbook-card">
      <div className="orderbook-column">
        <h4>Bids</h4>
        {bids.length === 0 && <p className="muted">No bids yet</p>}
        {bids.map((level) => (
          <div key={level.ts} className="orderbook-row bid">
            <span>${level.price.toFixed(2)}</span>
            <span>{level.size.toFixed(4)}</span>
          </div>
        ))}
      </div>
      <div className="orderbook-column">
        <h4>Asks</h4>
        {asks.length === 0 && <p className="muted">No asks yet</p>}
        {asks.map((level) => (
          <div key={level.ts} className="orderbook-row ask">
            <span>${level.price.toFixed(2)}</span>
            <span>{level.size.toFixed(4)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
