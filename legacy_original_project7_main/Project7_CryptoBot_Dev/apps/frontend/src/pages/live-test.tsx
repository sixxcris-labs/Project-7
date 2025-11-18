import { useEffect, useState } from "react";
import { useMarketStream } from "../hooks/useMarketStream";
import { LiveTickerGrid } from "../components/markets/LiveTickerGrid";
import { MiniOrderBook } from "../components/markets/MiniOrderBook";
import { TradeTape } from "../components/markets/TradeTape";

const DEFAULT_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];

export default function LiveTestPage() {
  const { status, subscribe, unsubscribe } = useMarketStream();
  const [selectedSymbol, setSelectedSymbol] = useState(DEFAULT_SYMBOLS[0]);

  useEffect(() => {
    DEFAULT_SYMBOLS.forEach((symbol) =>
      subscribe({ exchange: "binance", channel: "trades", symbol }),
    );
    return () => {
      DEFAULT_SYMBOLS.forEach((symbol) =>
        unsubscribe({ exchange: "binance", channel: "trades", symbol }),
      );
    };
  }, [subscribe, unsubscribe]);

  return (
    <div className="live-page">
      <header className="live-header">
        <div>
          <p className="muted">Labs</p>
          <h1>Live Market Stream</h1>
        </div>
        <span className={`status-pill ${status}`}>WS: {status}</span>
      </header>

      <LiveTickerGrid symbols={DEFAULT_SYMBOLS} />

      <section className="live-controls">
        <label htmlFor="symbol">Active Symbol</label>
        <select
          id="symbol"
          value={selectedSymbol}
          onChange={(event) => setSelectedSymbol(event.target.value)}
        >
          {DEFAULT_SYMBOLS.map((symbol) => (
            <option key={symbol} value={symbol}>
              {symbol}
            </option>
          ))}
        </select>
        <div className="button-row">
          <button
            type="button"
            onClick={() => subscribe({ exchange: "binance", channel: "trades", symbol: selectedSymbol })}
          >
            Subscribe
          </button>
          <button
            type="button"
            onClick={() =>
              unsubscribe({ exchange: "binance", channel: "trades", symbol: selectedSymbol })
            }
          >
            Unsubscribe
          </button>
        </div>
      </section>

      <div className="live-panels">
        <MiniOrderBook symbol={selectedSymbol} />
        <TradeTape symbol={selectedSymbol} />
      </div>
    </div>
  );
}
