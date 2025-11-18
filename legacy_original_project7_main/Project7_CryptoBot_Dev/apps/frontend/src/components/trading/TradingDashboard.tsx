import React, { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import { useDashboardStore } from "../../stores/dashboardStore";
import { useLiveQuotes } from "../../hooks/useLiveQuotes";
import { DataPanel, type PanelState } from "../dashboard/DataPanel";
import { Button } from "../ui/Button";
import { swrFetcher } from "../../lib/api";
import { useTradingSessionStore } from "../../stores/tradingSessionStore";
import type { Position, Trade } from "../../services/api/tradingFlowApi";

function formatUsd(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value >= 0 ? "" : "-";
  const abs = Math.abs(value);
  const fractionDigits = abs < 1 ? 4 : 2;
  return `${sign}$${abs.toLocaleString(undefined, {
    maximumFractionDigits: fractionDigits,
  })}`;
}

function formatPct(
  value: number | null | undefined,
  opts: { withSign?: boolean } = {}
): string {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = opts.withSign ? (value > 0 ? "+" : value < 0 ? "−" : "") : "";
  const abs = opts.withSign ? Math.abs(value) : value;
  return `${sign}${abs.toFixed(2)}%`;
}

export default function TradingDashboard() {
  const {
    symbol,
    side,
    notional,
    timeframe,
    environment,
    step,
    isBusy,
    errorMessage,
    agents,
    combinedSummary,
    tradePlan,
    riskResult,
    liveStatus,
    setSymbol,
    setSide,
    setNotional,
    setTimeframe,
    setEnvironment,
    loadLiveStatus,
    runAnalysis,
    generateTradePlan,
    validateRisk,
    approvePaper,
    approveLive,
    resetSession,
  } = useTradingSessionStore();

  const dashboardSymbol = useDashboardStore((s) => s.currentSymbol);
  const setDashboardSymbol = useDashboardStore((s) => s.setCurrentSymbol);
  const dashboardEnv = useDashboardStore((s) => s.tradeEnvironment);
  const setDashboardEnv = useDashboardStore((s) => s.setTradeEnvironment);

  // Initial sync from dashboard store into trading session
  useEffect(() => {
    if (!symbol && dashboardSymbol) {
      setSymbol(dashboardSymbol);
    }
    if (environment !== dashboardEnv) {
      setEnvironment(dashboardEnv);
    }
    loadLiveStatus();
  }, [
    symbol,
    dashboardSymbol,
    environment,
    dashboardEnv,
    setSymbol,
    setEnvironment,
    loadLiveStatus,
  ]);

  const activeSymbol = symbol || dashboardSymbol || "BTC-USDT";

  const { quotes, status: quotesStatus } = useLiveQuotes([activeSymbol]);
  const quote = quotes[0];
  const quotePrice =
    quote &&
    (quote.lastPrice ??
      quote.mid ??
      quote.bid ??
      quote.ask ??
      null);

  const {
    data: positions,
    error: positionsError,
    mutate: refreshPositions,
  } = useSWR<Position[]>("/api/portfolio/positions", swrFetcher);

  const {
    data: history,
    error: historyError,
  } = useSWR<{ items: Trade[]; total: number }>(
    "/api/history/trades?limit=20",
    swrFetcher
  );

  const positionsState: PanelState = positionsError
    ? "error"
    : positions
    ? positions.length
      ? "ready"
      : "empty"
    : "loading";

  const historyState: PanelState = historyError
    ? "error"
    : history
    ? history.items.length
      ? "ready"
      : "empty"
    : "loading";

  const analysisState: PanelState = useMemo(() => {
    if (isBusy && step === "analysis") return "loading";
    if (agents.length > 0) return "ready";
    if (step === "error") return "error";
    return "empty";
  }, [agents.length, isBusy, step]);

  const planState: PanelState = useMemo(() => {
    if (isBusy && step === "plan") return "loading";
    if (tradePlan) return "ready";
    if (step === "error") return "error";
    return "empty";
  }, [tradePlan, isBusy, step]);

  const riskState: PanelState = useMemo(() => {
    if (isBusy && step === "risk") return "loading";
    if (riskResult) return "ready";
    if (step === "error") return "error";
    return "empty";
  }, [riskResult, isBusy, step]);

  const canApprovePaper =
    !!tradePlan &&
    !!riskResult &&
    riskResult.approved &&
    environment === "paper";

  const canApproveLive =
    !!tradePlan &&
    !!riskResult &&
    riskResult.approved &&
    environment === "live" &&
    !!liveStatus?.enabled;

  const [ackRisk, setAckRisk] = useState(false);
  const [ackMode, setAckMode] = useState(false);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-lg sm:text-xl font-semibold text-slate-50">
            Multi-Agent Trading Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Configure a trade idea, let agents analyze the setup, review the
            plan and risk, then approve for paper or live execution.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Mode</span>
            <div className="inline-flex rounded-full bg-slate-900/80 border border-slate-700/70 p-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setEnvironment("paper");
                  setDashboardEnv("paper");
                }}
                className={`px-3 py-1 rounded-full ${
                  environment === "paper"
                    ? "bg-emerald-500 text-slate-950 font-medium"
                    : "text-slate-300"
                }`}
              >
                Paper
              </button>
              <button
                type="button"
                onClick={() => {
                  setEnvironment("live");
                  setDashboardEnv("live");
                }}
                className={`px-3 py-1 rounded-full ${
                  environment === "live"
                    ? "bg-rose-500 text-slate-950 font-medium"
                    : "text-slate-300"
                }`}
              >
                Live
              </button>
            </div>
            {liveStatus && (
              <span
                className={`text-[11px] px-2 py-1 rounded-full border ${
                  liveStatus.enabled
                    ? "border-emerald-400 text-emerald-300"
                    : "border-amber-400 text-amber-300"
                }`}
              >
                {liveStatus.enabled ? "Live enabled" : "Live disabled"}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Configuration row */}
      <section className="rounded-2xl border border-slate-800/70 bg-slate-950/80 px-4 py-4 space-y-3">
        <div className="grid gap-4 md:grid-cols-4">
          {/* Symbol + price */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              Symbol
            </label>
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
              value={symbol || ""}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                setSymbol(value);
                setDashboardSymbol(value);
              }}
              placeholder="BTC-USDT"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>
                {quotesStatus === "ready" && quotePrice
                  ? formatUsd(quotePrice)
                  : "Price loading…"}
              </span>
              <span className="text-slate-500">—</span>
            </div>
          </div>

          {/* Side */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              Direction
            </label>
            <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900/80 p-1 text-xs">
              <button
                type="button"
                onClick={() => setSide("long")}
                className={`px-3 py-1.5 rounded-md ${
                  side === "long"
                    ? "bg-emerald-500/90 text-slate-950 font-medium"
                    : "text-slate-200"
                }`}
              >
                Long
              </button>
              <button
                type="button"
                onClick={() => setSide("short")}
                className={`px-3 py-1.5 rounded-md ${
                  side === "short"
                    ? "bg-rose-500/90 text-slate-950 font-medium"
                    : "text-slate-200"
                }`}
              >
                Short
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              High-level intent the agents should optimize around.
            </p>
          </div>

          {/* Size */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              Size (notional, USD)
            </label>
            <input
              type="number"
              className="w-full rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
              value={Number.isFinite(notional) ? notional : ""}
              onChange={(e) => setNotional(Number(e.target.value) || 0)}
              min={0}
            />
            <p className="text-[11px] text-slate-400">
              Used for risk and sizing in the trade plan.
            </p>
          </div>

          {/* Timeframe */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              Timeframe
            </label>
            <select
              className="w-full rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <option value="15m">15m – Scalping</option>
              <option value="1h">1h – Intraday</option>
              <option value="4h">4h – Swing</option>
              <option value="1d">1d – Position</option>
            </select>
            <p className="text-[11px] text-slate-400">
              Guides how agents think about horizon and targets.
            </p>
          </div>
        </div>

        {/* Primary pipeline buttons */}
        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            type="button"
            className="text-xs bg-cyan-500 hover:bg-cyan-400"
            onClick={runAnalysis}
            disabled={isBusy}
          >
            {step === "analysis" && isBusy
              ? "Running agents…"
              : "Run agents / analyze"}
          </Button>
          <Button
            type="button"
            className="text-xs bg-slate-800 hover:bg-slate-700"
            onClick={generateTradePlan}
            disabled={isBusy || !agents.length}
          >
            {step === "plan" && isBusy ? "Creating plan…" : "Generate plan"}
          </Button>
          <Button
            type="button"
            className="text-xs bg-slate-800 hover:bg-slate-700"
            onClick={validateRisk}
            disabled={isBusy || !tradePlan}
          >
            {step === "risk" && isBusy ? "Checking risk…" : "Validate risk"}
          </Button>
          <Button
            type="button"
            className="text-xs bg-slate-900 hover:bg-slate-800 border border-slate-600"
            onClick={resetSession}
            disabled={isBusy}
          >
            Reset session
          </Button>
          {errorMessage && (
            <span className="text-[11px] text-rose-300">{errorMessage}</span>
          )}
        </div>
      </section>

      {/* Panels grid */}
      <section className="grid gap-4 lg:grid-cols-3">
        {/* Multi-Agent Analysis */}
        <DataPanel
          title="Multi-agent analysis"
          state={analysisState}
          loadingText="Agents are analyzing the setup…"
          emptyText="Run agents to see analysis."
        >
          {combinedSummary && (
            <p className="text-sm text-slate-200 mb-3">{combinedSummary}</p>
          )}
          {agents.length > 0 && (
            <ul className="space-y-2 text-xs">
              {agents.map((agent) => (
                <li
                  key={agent.id}
                  className="flex items-start justify-between gap-2 rounded-md border border-slate-700/70 bg-slate-900/70 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-slate-100">
                      {agent.name}
                      {agent.role && (
                        <span className="ml-2 text-[11px] text-slate-400">
                          ({agent.role})
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-300">
                      {agent.shortSummary}
                    </p>
                  </div>
                  <span
                    className={`mt-0.5 inline-flex h-6 items-center rounded-full px-2 text-[10px] font-medium ${
                      agent.status === "done"
                        ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
                        : agent.status === "running"
                        ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/40"
                        : agent.status === "error"
                        ? "bg-rose-500/15 text-rose-300 border border-rose-500/40"
                        : "bg-slate-700/40 text-slate-200 border border-slate-600/60"
                    }`}
                  >
                    {agent.status === "done"
                      ? "Done"
                      : agent.status === "running"
                      ? "Running"
                      : agent.status === "error"
                      ? "Error"
                      : "Idle"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DataPanel>

        {/* Trade plan */}
        <DataPanel
          title="Trade plan"
          state={planState}
          loadingText="Building a coherent trade plan…"
          emptyText="Generate a plan after analysis."
        >
          {tradePlan && (
            <div className="space-y-3 text-xs text-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wide">
                    {tradePlan.symbol}
                  </p>
                  <p className="text-sm font-semibold">
                    {tradePlan.side === "long" ? "Long" : "Short"} idea
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-slate-400">Size</p>
                  <p className="text-sm font-semibold">
                    {formatUsd(tradePlan.sizeNotional)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-md bg-slate-900/80 border border-slate-700/70 p-2">
                  <p className="text-[11px] text-slate-400">Entry</p>
                  {tradePlan.entries.map((e, idx) => (
                    <p key={idx} className="text-xs">
                      {formatUsd(e.price)} · {e.type} · {e.size.toFixed(4)}
                    </p>
                  ))}
                </div>
                <div className="rounded-md bg-slate-900/80 border border-slate-700/70 p-2">
                  <p className="text-[11px] text-slate-400">Stop</p>
                  <p className="text-xs">
                    {formatUsd(tradePlan.stopLoss.price)}
                    {tradePlan.stopLoss.trailing ? " (trailing)" : ""}
                  </p>
                </div>
                <div className="rounded-md bg-slate-900/80 border border-slate-700/70 p-2">
                  <p className="text-[11px] text-slate-400">Targets</p>
                  {tradePlan.targets.map((t, idx) => (
                    <p key={idx} className="text-xs">
                      {formatUsd(t.price)} · {t.size.toFixed(4)}
                    </p>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  R multiple:{" "}
                  <span className="text-slate-100">
                    {tradePlan.expectedRMultiple.toFixed(2)}R
                  </span>
                </span>
                <span>
                  Confidence:{" "}
                  <span className="text-slate-100">
                    {(tradePlan.confidenceScore * 100).toFixed(0)}%
                  </span>
                </span>
                <span>
                  Horizon:{" "}
                  <span className="text-slate-100">
                    {tradePlan.timeHorizon}
                  </span>
                </span>
              </div>

              <div className="rounded-md bg-slate-900/80 border border-slate-700/70 p-2">
                <p className="text-[11px] text-slate-400 mb-1">Rationale</p>
                <p className="text-[11px] text-slate-200">
                  {tradePlan.rationale}
                </p>
              </div>
            </div>
          )}
        </DataPanel>

        {/* Risk & approvals */}
        <DataPanel
          title="Risk checks & approvals"
          state={riskState}
          loadingText="Running risk checks…"
          emptyText="Validate risk once a plan is ready."
        >
          <div className="space-y-3 text-xs">
            {riskResult && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Status</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      riskResult.approved
                        ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
                        : "bg-amber-500/15 text-amber-200 border border-amber-500/40"
                    }`}
                  >
                    {riskResult.approved ? "Approved" : "Requires attention"}
                  </span>
                </div>

                {riskResult.metrics && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-md bg-slate-900/80 border border-slate-700/70 p-2">
                      <p className="text-[11px] text-slate-400">Risk %</p>
                      <p className="text-sm">
                        {formatPct(riskResult.metrics.riskPct)}
                      </p>
                    </div>
                    <div className="rounded-md bg-slate-900/80 border border-slate-700/70 p-2">
                      <p className="text-[11px] text-slate-400">
                        DD @ stop
                      </p>
                      <p className="text-sm">
                        {formatPct(
                          riskResult.metrics.maxDrawdownIfStopped
                        )}
                      </p>
                    </div>
                    <div className="rounded-md bg-slate-900/80 border border-slate-700/70 p-2">
                      <p className="text-[11px] text-slate-400">Portfolio</p>
                      <p className="text-sm">
                        {riskResult.metrics.portfolioValueUsd
                          ? formatUsd(
                              riskResult.metrics.portfolioValueUsd
                            )
                          : "—"}
                      </p>
                    </div>
                  </div>
                )}

                {riskResult.violations.length > 0 && (
                  <div className="rounded-md bg-slate-900/80 border border-slate-700/70 p-2 space-y-1">
                    <p className="text-[11px] text-slate-400 mb-1">
                      Violations
                    </p>
                    <ul className="space-y-1">
                      {riskResult.violations.map((v) => (
                        <li
                          key={v.code}
                          className="flex items-start gap-2 text-[11px]"
                        >
                          <span
                            className={
                              v.severity === "error"
                                ? "text-rose-400"
                                : "text-amber-300"
                            }
                          >
                            ●
                          </span>
                          <span className="text-slate-200">
                            {v.message}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            <div className="h-px bg-slate-800/80" />

            {/* Approvals */}
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="text-xs bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40"
                  onClick={approvePaper}
                  disabled={!canApprovePaper || isBusy}
                >
                  Approve paper trade
                </Button>
                <Button
                  type="button"
                  className="text-xs bg-rose-500 hover:bg-rose-400 disabled:opacity-40"
                  onClick={() =>
                    approveLive({
                      acknowledgedRisk: ackRisk,
                      acknowledgedMode: ackMode,
                    })
                  }
                  disabled={!canApproveLive || isBusy}
                >
                  Approve live trade
                </Button>
              </div>

              {environment === "live" && (
                <div className="space-y-1 text-[11px] text-slate-300">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-3 w-3 rounded border-slate-600 bg-slate-900"
                      checked={ackRisk}
                      onChange={(e) => setAckRisk(e.target.checked)}
                    />
                    <span>
                      I understand this trade can lose capital.
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-3 w-3 rounded border-slate-600 bg-slate-900"
                      checked={ackMode}
                      onChange={(e) => setAckMode(e.target.checked)}
                    />
                    <span>
                      I confirm this is **live** execution, not paper.
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </DataPanel>
      </section>

      {/* Positions & history */}
      <section className="grid gap-4 lg:grid-cols-2">
        <DataPanel
          title="Open positions"
          state={positionsState}
          loadingText="Loading positions…"
          emptyText="No open positions for now."
          actionLabel="Refresh"
          onAction={() => refreshPositions()}
        >
          {positions && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-[11px] text-slate-400">
                  <tr>
                    <th className="py-1 text-left font-medium">Symbol</th>
                    <th className="py-1 text-right font-medium">Side</th>
                    <th className="py-1 text-right font-medium">Qty</th>
                    <th className="py-1 text-right font-medium">Entry</th>
                    <th className="py-1 text-right font-medium">Mark</th>
                    <th className="py-1 text-right font-medium">P&amp;L</th>
                    <th className="py-1 text-right font-medium">Mode</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] text-slate-200">
                  {positions.map((p) => (
                    <tr
                      key={p.id}
                      className="border-t border-slate-800/80"
                    >
                      <td className="py-1">{p.symbol}</td>
                      <td className="py-1 text-right">
                        <span
                          className={
                            p.side === "long"
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }
                        >
                          {p.side}
                        </span>
                      </td>
                      <td className="py-1 text-right">
                        {p.quantity.toFixed(4)}
                      </td>
                      <td className="py-1 text-right">
                        {formatUsd(p.entryPrice)}
                      </td>
                      <td className="py-1 text-right">
                        {formatUsd(p.currentPrice)}
                      </td>
                      <td className="py-1 text-right">
                        <span
                          className={
                            p.unrealizedPnl >= 0
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }
                        >
                          {formatUsd(p.unrealizedPnl)}
                        </span>
                      </td>
                      <td className="py-1 text-right">
                        <span className="uppercase text-slate-400">
                          {p.mode}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DataPanel>

        <DataPanel
          title="Recent trades"
          state={historyState}
          loadingText="Loading recent trades…"
          emptyText="No recent trades to show."
        >
          {history && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-[11px] text-slate-400">
                  <tr>
                    <th className="py-1 text-left font-medium">Time</th>
                    <th className="py-1 text-left font-medium">Symbol</th>
                    <th className="py-1 text-right font-medium">Side</th>
                    <th className="py-1 text-right font-medium">Qty</th>
                    <th className="py-1 text-right font-medium">Avg px</th>
                    <th className="py-1 text-right font-medium">P&amp;L</th>
                    <th className="py-1 text-right font-medium">Mode</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] text-slate-200">
                  {history.items.map((t) => (
                    <tr
                      key={t.id}
                      className="border-t border-slate-800/80"
                    >
                      <td className="py-1">
                        {new Date(
                          t.closedAt ?? t.openedAt
                        ).toLocaleString()}
                      </td>
                      <td className="py-1">{t.symbol}</td>
                      <td className="py-1 text-right">
                        <span
                          className={
                            t.side === "long"
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }
                        >
                          {t.side}
                        </span>
                      </td>
                      <td className="py-1 text-right">
                        {t.quantity.toFixed(4)}
                      </td>
                      <td className="py-1 text-right">
                        {formatUsd(t.avgPrice)}
                      </td>
                      <td className="py-1 text-right">
                        <span
                          className={
                            t.realizedPnl >= 0
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }
                        >
                          {formatUsd(t.realizedPnl)}
                        </span>
                      </td>
                      <td className="py-1 text-right">
                        <span className="uppercase text-slate-400">
                          {t.mode}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DataPanel>
      </section>
    </div>
  );
}
