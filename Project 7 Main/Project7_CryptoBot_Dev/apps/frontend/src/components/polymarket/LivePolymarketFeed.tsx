import React, { useEffect, useState } from "react";
import type { WhaleSummary } from "../../../../../packages/common/src/types/polymarketWhales";
import styles from "./LivePolymarketFeed.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

interface ApiResponse {
  whales: WhaleSummary[];
}

export const LivePolymarketFeed: React.FC = () => {
  const [recentTrades, setRecentTrades] = useState<
    Array<{
      trader: string;
      marketId: string;
      side: "buy" | "sell";
      price: number;
      size: number;
      notional: number;
      timestamp: number;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchTrades() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/whale-watch/polymarket?limit=20`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json: ApiResponse = await res.json();
        if (!isMounted) return;

        // Extract all sample trades from whales and sort by timestamp
        const allTrades = json.whales
          .flatMap((whale) =>
            whale.sampleTrades.map((trade) => ({
              trader: whale.trader,
              marketId: trade.marketId,
              side: trade.side,
              price: trade.price,
              size: trade.size,
              notional: trade.notional,
              timestamp: trade.timestamp,
            }))
          )
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 15); // Show last 15 trades

        setRecentTrades(allTrades);
      } catch (err) {
        if (!isMounted) return;
        setError((err as Error).message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void fetchTrades();
    const interval = setInterval(fetchTrades, 5000); // Refresh every 5 seconds

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <section className={styles.feedPanel} aria-label="Live Polymarket Feed">
      <div className={styles.feedHeader}>
        <h2>Live Polymarket Feed</h2>
        <div className={styles.feedStatus}>
          {loading ? (
            <span className={styles.statusDot} style={{ background: "#ffb020" }} />
          ) : error ? (
            <span className={styles.statusDot} style={{ background: "#ff6b6b" }} />
          ) : (
            <span className={styles.statusDot} style={{ background: "#3ddc97" }} />
          )}
          <span className={styles.statusText}>
            {loading ? "Loading..." : error ? "Error" : "Live"}
          </span>
        </div>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          Error loading feed: {error}
        </div>
      )}

      {!loading && !error && recentTrades.length === 0 && (
        <div className={styles.emptyMessage}>
          No recent trades detected. Waiting for activity...
        </div>
      )}

      {!loading && !error && recentTrades.length > 0 && (
        <div className={styles.tradesList}>
          {recentTrades.map((trade, idx) => (
            <div key={`${trade.trader}-${trade.timestamp}-${idx}`} className={styles.tradeRow}>
              <div className={styles.tradeLeft}>
                <div className={styles.tradeMarket}>{trade.marketId}</div>
                <div className={styles.tradeTrader}>
                  {trade.trader.slice(0, 6)}...{trade.trader.slice(-4)}
                </div>
              </div>
              <div className={styles.tradeCenter}>
                <span
                  className={`${styles.tradeSide} ${
                    trade.side === "buy" ? styles.tradeSideBuy : styles.tradeSideSell
                  }`}
                >
                  {trade.side.toUpperCase()}
                </span>
                <span className={styles.tradePrice}>
                  ${trade.price.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                </span>
              </div>
              <div className={styles.tradeRight}>
                <div className={styles.tradeNotional}>
                  ${trade.notional.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div className={styles.tradeTime}>
                  {new Date(trade.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

