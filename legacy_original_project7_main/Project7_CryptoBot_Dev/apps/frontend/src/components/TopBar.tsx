import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useHealth, apiPost } from "../lib/api";
import { useDashboardStore } from "../stores/dashboardStore";
import { useSystemStatus } from "../services/dashboard/hooks";
import { toggleMarketDataIngestion } from "../services/dashboard/actions";

const timeframeOptions = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;

const statusClassMap = {
  ok: "dot ok",
  degraded: "dot warn",
  down: "dot err",
} as const;
type StatusClassKey = keyof typeof statusClassMap;

export default function TopBar() {
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
  const [liveTogglePending, setLiveTogglePending] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [timezoneModalOpen, setTimezoneModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    setSymbolInput(currentSymbol);
  }, [currentSymbol]);

  const applySymbol = () => {
    const trimmed = symbolInput.trim().toUpperCase();
    if (trimmed && trimmed !== currentSymbol) {
      setCurrentSymbol(trimmed);
    }
  };

  const handleLiveToggle = async () => {
    if (liveTogglePending) return;
    setLiveTogglePending(true);
    try {
      await toggleMarketDataIngestion(!liveDataEnabled);
      setLiveDataEnabled(!liveDataEnabled);
    } catch (err) {
      console.error("Failed to toggle market data ingestion", err);
    } finally {
      setLiveTogglePending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiPost("/api/auth/logout");
    } catch (err) {
      console.error("Logout failed", err);
    }
    router.push("/");
  };

  const backendStatus: StatusClassKey = health.healthy ? "ok" : "down";
  const mdStatus: StatusClassKey = systemStatus.data?.marketData?.status ?? "down";
  const exchangeStatus: StatusClassKey = systemStatus.data?.exchange?.status ?? "down";

  return (
    <>
      <header className="dashboard-topbar">
        <div className="topbar-left">
          <div className="symbol-search">
            <label htmlFor="symbol-search">Symbol</label>
            <div className="symbol-search-row">
              <input
                id="symbol-search"
                className="input"
                value={symbolInput}
                onChange={(event) => setSymbolInput(event.target.value)}
                onBlur={applySymbol}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applySymbol();
                  }
                }}
              />
              <button type="button" className="symbol-apply" onClick={applySymbol}>
                Apply
              </button>
            </div>
          </div>

          <div className="timeframe-pills" role="group" aria-label="Timeframe switcher">
            {timeframeOptions.map((option) => {
              const active = currentTimeframe === option;
              return (
                <button
                  key={option}
                  type="button"
                  className={`pill ${active ? "pill-active" : ""}`}
                  onClick={() => setCurrentTimeframe(option)}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <div className="env-toggle" role="group" aria-label="Environment toggle">
            <button
              type="button"
              className={`pill ${tradeEnvironment === "paper" ? "pill-active" : ""}`}
              onClick={() => setTradeEnvironment("paper")}
            >
              Paper
            </button>
            <button
              type="button"
              className={`pill ${tradeEnvironment === "live" ? "pill-active" : ""}`}
              onClick={() => {
                setTradeEnvironment("live");
              }}
              disabled
              title="Live environment coming soon"
            >
              Live (disabled)
            </button>
          </div>

          <button
            type="button"
            className={`pill live-toggle ${liveDataEnabled ? "pill-active" : ""}`}
            onClick={handleLiveToggle}
            disabled={liveTogglePending}
            aria-pressed={liveDataEnabled}
          >
            {liveTogglePending ? "Updating…" : liveDataEnabled ? "Live data on" : "Live data off"}
          </button>
        </div>

        <div className="topbar-right">
          <div className="status-pill">
            <span className={statusClassMap[backendStatus]} aria-hidden="true" />
            Backend
          </div>
          <div className="status-pill">
            <span className={statusClassMap[mdStatus]} aria-hidden="true" />
            Market data
          </div>
          <div className="status-pill">
            <span className={statusClassMap[exchangeStatus]} aria-hidden="true" />
            Exchange
          </div>

          <button
            type="button"
            className="notifications-button"
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              if (!notificationsOpen) {
                setNotificationsCount(notificationsCount + 1);
              }
            }}
            aria-label="Notifications"
          >
            <span>Notifications</span>
            {notificationsCount > 0 && (
              <span className="badge badge-positive">{notificationsCount}</span>
            )}
          </button>

          <div className="avatar-menu">
            <button
              type="button"
              className="avatar-button"
              onClick={() => setUserMenuOpen((open) => !open)}
              aria-label="User menu"
            >
              <span>Profile</span>
            </button>
            {userMenuOpen && (
              <div className="avatar-dropdown">
                <button type="button" onClick={() => router.push("/settings")}>
                  Profile
                </button>
                <button type="button" onClick={() => setTimezoneModalOpen(true)}>
                  Timezone
                </button>
                <button type="button" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {notificationsOpen && (
        <section className="drawer notifications-drawer">
          <header>
            <h4>Notifications</h4>
            <button type="button" onClick={() => setNotificationsOpen(false)}>
              Close
            </button>
          </header>
          <ul>
            <li>New backtest result ready for STRAT-002.</li>
            <li>Live data ingestion is {liveDataEnabled ? "running" : "paused"}.</li>
            <li>System status sync completed at {systemStatus.data?.marketData.updatedAt ?? "–"}.</li>
          </ul>
        </section>
      )}

      {timezoneModalOpen && (
        <section className="modal timezone-modal">
          <div className="modal-content">
            <header>
              <h4>Choose timezone</h4>
              <button type="button" onClick={() => setTimezoneModalOpen(false)}>
                Close
              </button>
            </header>
            <select defaultValue="UTC">
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Europe/London">Europe/London</option>
              <option value="Asia/Singapore">Asia/Singapore</option>
            </select>
          </div>
        </section>
      )}
    </>
  );
}
