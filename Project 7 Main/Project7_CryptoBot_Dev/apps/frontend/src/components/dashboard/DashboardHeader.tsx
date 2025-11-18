import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

import { useHealth } from "../../lib/api";
import { toggleMarketDataIngestion } from "../../services/dashboard/actions";
import { useSystemStatus } from "../../services/dashboard/hooks";
import { useDashboardStore } from "../../stores/dashboardStore";

const timeframeOptions = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;

export default function DashboardHeader() {
  const router = useRouter();
  const health = useHealth({ refreshInterval: 15000 });
  const systemStatus = useSystemStatus();

  const currentSymbol = useDashboardStore((state) => state.currentSymbol);
  const setCurrentSymbol = useDashboardStore((state) => state.setCurrentSymbol);
  const currentTimeframe = useDashboardStore((state) => state.currentTimeframe);
  const setCurrentTimeframe = useDashboardStore((state) => state.setCurrentTimeframe);
  const tradeEnvironment = useDashboardStore((state) => state.tradeEnvironment);
  const setTradeEnvironment = useDashboardStore((state) => state.setTradeEnvironment);
  const liveDataEnabled = useDashboardStore((state) => state.liveDataEnabled);
  const setLiveDataEnabled = useDashboardStore((state) => state.setLiveDataEnabled);
  const notificationsCount = useDashboardStore((state) => state.notificationsCount);
  const setNotificationsCount = useDashboardStore((state) => state.setNotificationsCount);

  const [symbolInput, setSymbolInput] = useState(currentSymbol);
  const [livePending, setLivePending] = useState(false);

  useEffect(() => {
    setSymbolInput(currentSymbol);
  }, [currentSymbol]);

  const applySymbol = () => {
    const trimmed = symbolInput.trim().toUpperCase();
    if (trimmed) setCurrentSymbol(trimmed);
  };

  const toggleLive = async () => {
    if (livePending) return;
    setLivePending(true);
    try {
      await toggleMarketDataIngestion(!liveDataEnabled);
      setLiveDataEnabled(!liveDataEnabled);
    } catch {
      // swallow errors; UI will remain unchanged if API fails
    } finally {
      setLivePending(false);
    }
  };

  const backendStatus = health.healthy ? "ok" : "down";
  const marketStatus = systemStatus.data?.marketData?.status ?? "down";
  const exchangeStatus = systemStatus.data?.exchange?.status ?? "down";

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  let liveButtonLabel = "";
  if (livePending) {
    liveButtonLabel = "Updating…";
  } else if (liveDataEnabled) {
    liveButtonLabel = "Live data on";
  } else {
    liveButtonLabel = "Live data off";
  }

  return (
    <div className="dashboard-header">
      <div className="header-left">
        <div className="brand">
          <span>Favorite Mistake</span>
          <span className="status-pill">
            {tradeEnvironment === "paper" ? "Paper" : "Live"}
          </span>
          <button className="panel-cta" type="button" onClick={toggleLive} disabled={livePending}>
            {liveButtonLabel}
          </button>
          <div className="status-pill">
            {backendStatus === "ok" ? "Backend" : "Backend down"}
          </div>
          <div className="status-pill">
            {marketStatus === "ok" ? "Market" : "Markets degraded"}
          </div>
          <div className="status-pill">
            {exchangeStatus === "ok" ? "Exchange" : "Exchange lag"}
          </div>
        </div>
      </div>

      <div className="header-center">
        <div className="symbol-search-row">
          <input
            className="input"
            aria-label="Symbol"
            value={symbolInput}
            onChange={(event) => setSymbolInput(event.target.value)}
            onBlur={applySymbol}
            onKeyDown={(event) => event.key === "Enter" && applySymbol()}
          />
          <button className="panel-cta" type="button" onClick={applySymbol}>
            Select
          </button>
        </div>
        <div className="timeframe-pills">
          {timeframeOptions.map((option) => (
            <button
              key={option}
              className={`pill ${currentTimeframe === option ? "pill-active" : ""}`}
              type="button"
              onClick={() => setCurrentTimeframe(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="header-right">
        <button
          className="panel-cta"
          type="button"
          onClick={() => setNotificationsCount(notificationsCount + 1)}
        >
          🔔 {notificationsCount}
        </button>
        <select
          className="input"
          value={tradeEnvironment}
          onChange={(event) =>
            setTradeEnvironment(event.target.value as typeof tradeEnvironment)
          }
        >
          <option value="paper">Paper</option>
          <option value="live">Live</option>
        </select>
        <button className="panel-cta" type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
