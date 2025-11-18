import React, { useEffect, useState } from "react";
import type { WhaleSummary } from "../../../../../packages/common/src/types/polymarketWhales";

type TimeRange = "1h" | "24h";

interface ApiResponse {
  whales: WhaleSummary[];
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

export const PolymarketWhalesWidget: React.FC = () => {
  const [whales, setWhales] = useState<WhaleSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("1h");
  const [expandedTrader, setExpandedTrader] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchWhales() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_BASE}/api/whale-watch/polymarket?limit=50`
        );
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json: ApiResponse = await res.json();
        if (!isMounted) return;

        const now = Date.now();
        const cutoffMs =
          timeRange === "1h" ? now - 3_600_000 : now - 86_400_000;

        const filtered = json.whales.filter((w) => w.lastSeen >= cutoffMs);
        setWhales(filtered);
      } catch (err) {
        if (!isMounted) return;
        setError((err as Error).message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void fetchWhales();
    const interval = setInterval(fetchWhales, 15_000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [timeRange]);

  return (
    <div className="panel" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--md)" }}>
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>Polymarket Whales</h2>
        <div style={{ display: "inline-flex", borderRadius: "999px", border: "1px solid var(--border)", overflow: "hidden", fontSize: "12px" }}>
          <button
            style={{
              padding: "6px 12px",
              background: timeRange === "1h" ? "var(--accent)" : "transparent",
              color: timeRange === "1h" ? "#fff" : "var(--text)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onClick={() => setTimeRange("1h")}
          >
            Last 1h
          </button>
          <button
            style={{
              padding: "6px 12px",
              background: timeRange === "24h" ? "var(--accent)" : "transparent",
              color: timeRange === "24h" ? "#fff" : "var(--text)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onClick={() => setTimeRange("24h")}
          >
            Last 24h
          </button>
        </div>
      </div>

      {loading && (
        <p style={{ fontSize: "12px", color: "var(--muted)" }}>Loading whales…</p>
      )}
      {error && (
        <p style={{ fontSize: "12px", color: "var(--danger)" }}>
          Error loading whales: {error}
        </p>
      )}
      {!loading && !error && whales.length === 0 && (
        <p style={{ fontSize: "12px", color: "var(--muted)" }}>No whales detected yet.</p>
      )}

      {!loading && !error && whales.length > 0 && (
        <div style={{ marginTop: "var(--md)" }}>
          <table className="table" style={{ width: "100%", fontSize: "12px" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--muted)" }}>
                <th style={{ padding: "8px 4px" }}>Wallet</th>
                <th style={{ padding: "8px 4px" }}>Total Notional</th>
                <th style={{ padding: "8px 4px" }}>Last Seen</th>
                <th style={{ padding: "8px 4px" }}>Markets</th>
                <th style={{ padding: "8px 4px", textAlign: "right" }}>Explorer</th>
              </tr>
            </thead>
            <tbody>
              {whales.map((w) => (
                <React.Fragment key={w.trader}>
                  <tr
                    style={{
                      cursor: "pointer",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--panelAlt)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                    onClick={() =>
                      setExpandedTrader(
                        expandedTrader === w.trader ? null : w.trader
                      )
                    }
                  >
                    <td style={{ padding: "8px 4px", fontFamily: "monospace", fontSize: "11px", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {w.trader}
                    </td>
                    <td style={{ padding: "8px 4px" }}>
                      {w.totalNotional.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td style={{ padding: "8px 4px" }}>
                      {new Date(w.lastSeen).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: "8px 4px" }}>
                      {w.markets.slice(0, 3).join(", ")}
                      {w.markets.length > 3 && "…"}
                    </td>
                    <td style={{ padding: "8px 4px", textAlign: "right" }}>
                      <a
                        href={w.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ textDecoration: "underline", color: "var(--accent)" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        View
                      </a>
                    </td>
                  </tr>
                  {expandedTrader === w.trader && (
                    <tr>
                      <td colSpan={5} style={{ paddingBottom: "var(--md)" }}>
                        <div style={{ marginTop: "var(--sm)", borderRadius: "12px", border: "1px solid var(--border)", padding: "var(--md)", background: "var(--cardAlt)" }}>
                          <p style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "var(--sm)" }}>
                            Sample trades
                          </p>
                          <div style={{ maxHeight: "160px", overflowY: "auto" }}>
                            <table className="table" style={{ width: "100%", fontSize: "11px" }}>
                              <thead>
                                <tr style={{ color: "var(--muted)" }}>
                                  <th style={{ padding: "4px" }}>Time</th>
                                  <th style={{ padding: "4px" }}>Market</th>
                                  <th style={{ padding: "4px" }}>Side</th>
                                  <th style={{ padding: "4px" }}>Price</th>
                                  <th style={{ padding: "4px" }}>Size</th>
                                  <th style={{ padding: "4px" }}>Notional</th>
                                </tr>
                              </thead>
                              <tbody>
                                {w.sampleTrades.map((t) => (
                                  <tr key={t.txHash}>
                                    <td style={{ padding: "4px" }}>
                                      {new Date(
                                        t.timestamp
                                      ).toLocaleTimeString()}
                                    </td>
                                    <td style={{ padding: "4px" }}>{t.marketId}</td>
                                    <td style={{ padding: "4px", textTransform: "capitalize" }}>
                                      {t.side}
                                    </td>
                                    <td style={{ padding: "4px" }}>
                                      {t.price.toLocaleString()}
                                    </td>
                                    <td style={{ padding: "4px" }}>
                                      {t.size.toLocaleString()}
                                    </td>
                                    <td style={{ padding: "4px" }}>
                                      {t.notional.toLocaleString(undefined, {
                                        maximumFractionDigits: 2,
                                      })}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
