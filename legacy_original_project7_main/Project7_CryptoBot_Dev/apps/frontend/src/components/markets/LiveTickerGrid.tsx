import React from "react";
import { useLiveMarketStore } from "../../stores/liveMarketStore";

interface Props {
  symbols: string[];
}

export function LiveTickerGrid({ symbols }: Props) {
  const latestBySymbol = useLiveMarketStore((state) => state.latestBySymbol);
  return (
    <div className="ticker-grid">
      {symbols.map((symbol) => {
        const tick = latestBySymbol[symbol];
        return (
          <div className="ticker-card" key={symbol}>
            <header>
              <h3>{symbol}</h3>
              <span className={`pill ${tick?.side ?? ""}`}>
                {tick ? tick.side.toUpperCase() : "—"}
              </span>
            </header>
            <div className="ticker-price">
              {tick ? `$${tick.price.toFixed(2)}` : "Waiting..."}
            </div>
            <div className="ticker-meta">
              <span>{tick ? new Date(tick.ts).toLocaleTimeString() : "—"}</span>
              <span>{tick ? `${tick.size.toFixed(4)}` : ""}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
