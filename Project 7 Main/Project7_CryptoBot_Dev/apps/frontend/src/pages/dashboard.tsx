import React, { useState } from "react";

// Mock data
const backtests = [
  {
    id: "bt-001",
    strategy: "mean_reversion_v2",
    status: "Completed" as const,
    sharpe: 1.8,
    pnl: 8421,
    formula:
      "Buy when price < SMA(20) - 2σ, sell when price crosses above SMA(20). Limit position size to 2% of equity.",
    equation:
      "signal_t = (price_t - SMA20_t) / (2 · σ20_t); enter long when signal_t < -1, exit when price_t > SMA20_t",
  },
  {
    id: "bt-002",
    strategy: "breakout_alpha",
    status: "Running" as const,
    sharpe: null,
    pnl: null,
    formula:
      "Enter long when price breaks above 20-day high with volume > 1.5× average. Trailing stop at 2× ATR.",
    equation:
      "signal_t = 1 if price_t > max(price_{t-19..t}) and volume_t > 1.5 · avgVolume20_t, else 0; stop = entryPrice - 2 · ATR14_t",
  },
];

const providers = [
  { name: "Binance", status: "Healthy" as const, latency: "74 ms" },
  { name: "Polygon", status: "Degraded" as const, latency: "210 ms" },
  { name: "Fallback", status: "Healthy" as const, latency: "92 ms" },
];

const coins = [
  { rank: 1, symbol: "BTC", name: "Bitcoin", volume: "$23.4B", dominance: "51%" },
  { rank: 2, symbol: "ETH", name: "Ethereum", volume: "$12.1B", dominance: "18%" },
  { rank: 3, symbol: "SOL", name: "Solana", volume: "$4.9B", dominance: "4%" },
  { rank: 4, symbol: "XRP", name: "XRP", volume: "$2.7B", dominance: "2%" },
  { rank: 5, symbol: "DOGE", name: "Dogecoin", volume: "$1.3B", dominance: "1%" },
];

export default function Page() {
  const [selectedBacktestId, setSelectedBacktestId] = useState(backtests[0]?.id);
  const selectedBacktest = backtests.find((bt) => bt.id === selectedBacktestId) ?? null;

  const [chatInput, setChatInput] = useState("");
  const [chatModel, setChatModel] = useState("gpt-5.1-thinking");
  const [chatHistory, setChatHistory] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [isSending, setIsSending] = useState(false);

  // Backtest input state (used to annotate the graph)
  const [btSymbol, setBtSymbol] = useState("BTCUSDT");
  const [btTimeframe, setBtTimeframe] = useState("1h");
  const [btCapital, setBtCapital] = useState(100000);

  // Derived stats from hard-wired data (declare ONCE)
  const completedBacktests = backtests.filter((bt) => bt.status === "Completed");
  const avgSharpe =
    completedBacktests.length > 0
      ? completedBacktests.reduce((sum, bt) => sum + (bt.sharpe ?? 0), 0) /
        completedBacktests.length
      : null;
  const bestPnl =
    completedBacktests.length > 0
      ? Math.max(...completedBacktests.map((bt) => bt.pnl ?? 0))
      : null;

  const roiPct =
    selectedBacktest?.pnl != null && btCapital > 0
      ? (selectedBacktest.pnl / btCapital) * 100
      : null;

  async function handleSendToChatGPT() {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatHistory((h) => [...h, { role: "user", content: userMessage }]);
    setChatInput("");
    setIsSending(true);

    try {
      // This is a placeholder. In your real app, point this at your
      // ChatGPT Actions / backend route that calls OpenAI.
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: chatModel,
          message: userMessage,
          context: {
            selectedBacktest,
            btSymbol,
            btTimeframe,
            btCapital,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const data = await res.json();
      const assistantReply: string = data.reply ?? "(No reply field returned from API)";

      setChatHistory((h) => [
        ...h,
        { role: "assistant", content: assistantReply },
      ]);
    } catch (err) {
      console.error(err);
      setChatHistory((h) => [
        ...h,
        {
          role: "assistant",
          content:
            "There was an error reaching the ChatGPT backend. Check your /api/chat route and API key.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-slate-800/60 bg-slate-950/70 backdrop-blur-xl">
        <div className="px-6 py-6 border-b border-slate-800/60 flex items-center gap-2">
          <div className="h-9 w-9 rounded-2xl bg-emerald-500/15 flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.7)]">
            <span className="text-lg font-bold text-emerald-400">₿</span>
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">CryptoBot</p>
            <p className="text-[11px] text-slate-400">Control Surface</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 text-sm">
          {[
            "Dashboard",
            "Strategies",
            "Risk & Guardrails",
            "Backtests",
            "Settings",
          ].map((item, i) => (
            <button
              key={item}
              className={`w-full text-left px-3 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 text-[13px] ${
                i === 0
                  ? "bg-slate-800/80 text-slate-50 shadow-[0_0_18px_rgba(148,163,184,0.35)]"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
              }`}
            >
              <span className="h-1 w-1 rounded-full bg-emerald-400/80 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
              {item}
            </button>
          ))}
        </nav>

        <div className="px-4 pb-5 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
          <p className="font-medium text-slate-300">Environment</p>
          <p className="mt-1 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/5 px-3 py-1 text-[11px] text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
            Dev • Paper only
          </p>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.18),_transparent_55%)]">
        {/* Header */}
        <header className="border-b border-slate-800/60 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-10">
          <div className="px-4 md:px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Control Center
              </p>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-3 flex-wrap">
                <span>Trading Overview</span>
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-200">
                  v0.7 • Internal
                </span>
                <span className="text-xs md:text-sm font-semibold text-emerald-300">
                  Designed by SixxCris
                </span>
              </h1>
            </div>

            <div className="flex items-center gap-3 flex-nowrap">
              <button className="relative flex items-center gap-2 rounded-full bg-emerald-500/90 px-4 py-1.5 text-xs font-medium text-emerald-950 shadow-[0_0_22px_rgba(16,185,129,0.9)] hover:shadow-[0_0_32px_rgba(16,185,129,1)] transition-all duration-200">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-900 border border-emerald-100" />
                Go • Start Session
                <span className="absolute -inset-px rounded-full border border-emerald-300/40 opacity-60" />
              </button>

              {/* Compact market data providers */}
              <div className="hidden md:flex items-center gap-2 text-[10px]">
                {providers.slice(0, 2).map((p) => (
                  <div
                    key={p.name}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-700/70 bg-slate-900/70 px-2 py-1 text-slate-300"
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        p.status === "Healthy"
                          ? "bg-emerald-400"
                          : p.status === "Degraded"
                          ? "bg-amber-400"
                          : "bg-rose-400"
                      }`}
                    />
                    <span>{p.name}</span>
                    <span className="text-slate-500">{p.latency}</span>
                  </div>
                ))}
              </div>

              <button className="rounded-full border border-slate-700/70 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/80 hover:border-slate-500/80 transition-all duration-200">
                Timeframe: 24h
              </button>

              <div className="flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/70 px-3 py-1.5">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-900 flex items-center justify-center text-[11px] font-semibold">
                  AL
                </div>
                <div className="hidden sm:block">
                  <p className="text-[11px] leading-tight">alice@cryptobot</p>
                  <p className="text-[10px] text-slate-400">Admin</p>
                </div>
              </div>
            </div>
          </div>

          {/* Global status strip */}
          <div className="px-4 md:px-6 pb-3 pt-1 border-t border-slate-800/60 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2">
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-emerald-200 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
                Dev · Paper environment
              </span>
              <span className="hidden sm:inline text-slate-500">
                Guardrails on · Killswitch armed
              </span>
            </div>
            <div className="inline-flex items-center gap-4">
              <span>
                Last sync: <span className="text-slate-200">09:41:23</span>
              </span>
              <span>
                Account equity (paper): <span className="text-slate-200">$100,000</span>
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="px-4 md:px-6 py-6 space-y-6">
          {/* First row: Big PnL card + coins */}
          <section className="grid gap-5 lg:grid-cols-[minmax(0,_2fr)_minmax(0,_1.2fr)]">
            {/* Glass PnL card */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/40 backdrop-blur-2xl p-5 shadow-[0_18px_60px_rgba(15,23,42,0.85)]">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/15 blur-3xl" />
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Today&apos;s Paper PnL
                  </p>
                  <p className="text-3xl md:text-4xl font-semibold">
                    +$8,421
                    <span className="ml-2 text-sm text-emerald-400 align-middle">
                      +12.4%
                    </span>
                  </p>
                  <p className="text-[12px] text-slate-400">
                    3 active strategies · 7 open positions · synthetic fills only
                  </p>
                  <p className="text-[11px] text-emerald-300/90 font-medium mt-1">
                    Paper mode · No real orders are being placed.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3 text-[11px]">
                    <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-emerald-200">
                      Drift safe
                    </span>
                    <span className="rounded-full border border-sky-400/40 bg-sky-500/10 px-2 py-0.5 text-sky-200">
                      Latency OK
                    </span>
                    <span className="rounded-full border border-slate-500/60 bg-slate-700/40 px-2 py-0.5 text-slate-200">
                      Guardrails: 1 killswitch
                    </span>
                  </div>
                </div>

                <div className="hidden sm:flex flex-col items-end gap-2 text-xs">
                  <p className="text-slate-400">Last synthetic fill</p>
                  <p className="text-sm font-medium">09:41:23</p>
                  <p className="text-slate-500">Binance • BTCUSDT</p>
                  <div className="mt-2 flex gap-2">
                    <span className="rounded-xl bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-200 border border-emerald-500/40">
                      Market neutral
                    </span>
                  </div>
                </div>
              </div>

              {/* Fake mini chart */}
              <div className="mt-6 h-20 w-full rounded-2xl bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-purple-500/10 border border-slate-800/60 relative overflow-hidden">
                <div className="absolute inset-0 opacity-60">
                  <svg viewBox="0 0 200 60" className="h-full w-full">
                    <polyline
                      fill="none"
                      stroke="url(#pnlGradient)"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      points="0,40 20,45 40,30 60,35 80,18 100,22 120,10 140,16 160,8 180,12 200,6"
                    />
                    <defs>
                      <linearGradient id="pnlGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="50%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>

            {/* Coins card */}
            <div className="rounded-3xl border border-slate-800/70 bg-slate-900/40 backdrop-blur-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Top coins today
                  </p>
                  <p className="text-sm font-semibold">Most traded by volume (mock data)</p>
                </div>
                <span className="rounded-full border border-slate-600/70 bg-slate-800/60 px-2 py-0.5 text-[10px] text-slate-200">
                  24h view
                </span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/40">
                <table className="min-w-full text-[11px]">
                  <thead className="bg-slate-900/80 text-slate-400">
                    <tr>
                      <th className="text-left px-3 py-2 font-normal">#</th>
                      <th className="text-left px-3 py-2 font-normal">Coin</th>
                      <th className="text-right px-3 py-2 font-normal">Volume</th>
                      <th className="text-right px-3 py-2 font-normal">Dominance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coins.map((c) => (
                      <tr
                        key={c.symbol}
                        className="border-t border-slate-800/80 hover:bg-slate-900/60 transition-colors"
                      >
                        <td className="px-3 py-2 text-[11px] text-slate-400">{c.rank}</td>
                        <td className="px-3 py-2">
                          <div className="text-[12px] font-medium">
                            {c.symbol}
                            <span className="ml-2 text-[11px] text-slate-400">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right text-[11px]">{c.volume}</td>
                        <td className="px-3 py-2 text-right text-[11px]">{c.dominance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button className="mt-auto w-full rounded-2xl border border-slate-700/80 bg-slate-900/70 px-3 py-2 text-[11px] text-slate-200 hover:bg-slate-800/80 hover:border-slate-500/80 transition-all duration-200">
                View full market board →
              </button>
            </div>
          </section>

          {/* Second row: Backtest workbench */}
          <section className="grid gap-5 lg:grid-cols-[minmax(0,_1.5fr)_minmax(0,_2fr)] items-stretch">
            {/* Backtest setup & runs */}
            <div className="rounded-3xl border border-slate-800/70 bg-slate-900/40 backdrop-blur-2xl p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold">Strategy tester</p>
                  <p className="text-[11px] text-slate-400">
                    Configure a run, then inspect performance on the right.
                  </p>
                </div>
                <button className="rounded-full bg-slate-100 text-slate-950 px-3 py-1.5 text-[11px] font-medium shadow-[0_0_18px_rgba(148,163,184,0.6)] hover:shadow-[0_0_26px_rgba(148,163,184,0.9)] transition-all duration-200">
                  New run
                </button>
              </div>

              {/* Presets + input controls */}
              <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
                <span className="text-slate-500 mr-1">Presets:</span>
                <button
                  type="button"
                  onClick={() => {
                    setBtSymbol("BTCUSDT");
                    setBtTimeframe("15m");
                    setBtCapital(25000);
                  }}
                  className="rounded-full border border-slate-700/80 bg-slate-950/70 px-2.5 py-1 hover:border-emerald-400/70 hover:bg-slate-900/80 transition-all"
                >
                  Scalp · BTC 15m · 25k
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBtSymbol("ETHUSDT");
                    setBtTimeframe("4h");
                    setBtCapital(50000);
                  }}
                  className="rounded-full border border-slate-700/80 bg-slate-950/70 px-2.5 py-1 hover:border-sky-400/70 hover:bg-slate-900/80 transition-all"
                >
                  Swing · ETH 4h · 50k
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBtSymbol("BTCUSDT");
                    setBtTimeframe("1d");
                    setBtCapital(100000);
                  }}
                  className="rounded-full border border-slate-700/80 bg-slate-950/70 px-2.5 py-1 hover:border-purple-400/70 hover:bg-slate-900/80 transition-all"
                >
                  Macro · BTC 1D · 100k
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-[11px]">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-400">Pair</label>
                  <select
                    value={btSymbol}
                    onChange={(e) => setBtSymbol(e.target.value)}
                    className="rounded-xl border border-slate-700/80 bg-slate-950/70 px-2 py-1.5 text-[11px] text-slate-100 focus:outline-none focus:border-emerald-400/80"
                  >
                    <option>BTCUSDT</option>
                    <option>ETHUSDT</option>
                    <option>SOLUSDT</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-400">Timeframe</label>
                  <select
                    value={btTimeframe}
                    onChange={(e) => setBtTimeframe(e.target.value)}
                    className="rounded-xl border border-slate-700/80 bg-slate-950/70 px-2 py-1.5 text-[11px] text-slate-100 focus:outline-none focus:border-emerald-400/80"
                  >
                    <option value="15m">15m</option>
                    <option value="1h">1h</option>
                    <option value="4h">4h</option>
                    <option value="1d">1d</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-400">Starting capital (USDT)</label>
                  <input
                    type="number"
                    value={btCapital}
                    onChange={(e) => setBtCapital(Number(e.target.value) || 0)}
                    className="rounded-xl border border-slate-700/80 bg-slate-950/70 px-2 py-1.5 text-[11px] text-slate-100 focus:outline-none focus:border-emerald-400/80"
                  />
                  {btCapital > 250000 && (
                    <p className="text-[10px] text-amber-300 mt-0.5">
                      High starting capital – consider exchange limits and liquidity.
                    </p>
                  )}
                  {btCapital > 0 && btCapital < 5000 && (
                    <p className="text-[10px] text-amber-300 mt-0.5">
                      Very small account – fees and slippage may dominate results.
                    </p>
                  )}
                </div>
              </div>

              {/* Backtest stats derived from current data */}
              <div className="mb-3 flex flex-wrap gap-4 text-[11px] text-slate-400">
                <span>
                  Completed runs: {""}
                  <span className="text-slate-100 font-medium">
                    {completedBacktests.length}
                  </span>
                </span>
                {avgSharpe != null && (
                  <span>
                    Avg Sharpe: {""}
                    <span className="text-slate-100 font-medium">
                      {avgSharpe.toFixed(2)}
                    </span>
                  </span>
                )}
                {bestPnl != null && (
                  <span>
                    Best PnL: {""}
                    <span className="text-emerald-400 font-medium">
                      ${bestPnl.toLocaleString()}
                    </span>
                  </span>
                )}
                {roiPct != null && (
                  <span>
                    ROI on capital: {""}
                    <span className="text-emerald-300 font-medium">
                      {roiPct.toFixed(2)}%
                    </span>
                  </span>
                )}
              </div>

              {/* Runs table + formulas */}
              <div className="overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-950/40 flex flex-col">
                <table className="min-w-full text-[11px]">
                  <thead className="bg-slate-900/80 text-slate-400">
                    <tr>
                      <th className="text-left px-3 py-2 font-normal">Strategy</th>
                      <th className="text-left px-3 py-2 font-normal">Status</th>
                      <th className="text-right px-3 py-2 font-normal">Sharpe</th>
                      <th className="text-right px-3 py-2 font-normal">PnL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backtests.map((bt, idx) => (
                      <tr
                        key={bt.id}
                        onClick={() => setSelectedBacktestId(bt.id)}
                        className={`${
                          idx % 2 === 0 ? "bg-slate-900/40" : "bg-slate-900/20"
                        } cursor-pointer hover:bg-slate-900/70 transition-colors`}
                      >
                        <td className="px-3 py-2">
                          <div className="text-[12px] font-medium">{bt.strategy}</div>
                          <div className="text-[10px] text-slate-500">{bt.id}</div>
                        </td>
                        <td className="px-3 py-2 text-[11px]">
                          {bt.status === "Completed" && (
                            <span className="rounded-full border border-emerald-400/60 bg-emerald-500/10 px-2 py-0.5 text-emerald-100">
                              Completed
                            </span>
                          )}
                          {bt.status === "Running" && (
                            <span className="rounded-full border border-sky-400/60 bg-sky-500/10 px-2 py-0.5 text-sky-100">
                              Running
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {bt.sharpe != null ? bt.sharpe.toFixed(2) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {bt.pnl != null ? `$${bt.pnl.toLocaleString()}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {selectedBacktest && (
                  <div className="border-t border-slate-800/80 bg-slate-950/70 px-3 py-3 text-left text-[11px] space-y-2">
                    <div>
                      <p className="text-slate-400 mb-1">Plain-language description</p>
                      <p className="whitespace-pre-wrap text-slate-100">
                        {selectedBacktest.formula}
                      </p>
                    </div>
                    {selectedBacktest.equation && (
                      <div>
                        <p className="text-slate-400 mb-1">Equation (pseudo)</p>
                        <p className="font-mono whitespace-pre-wrap text-slate-100">
                          {selectedBacktest.equation}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Backtest visualizer */}
            <div className="rounded-3xl border border-slate-800/70 bg-slate-900/40 backdrop-blur-2xl p-5 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] text-slate-400">
                  <span className="text-slate-300 font-medium">Strategy:</span>{" "}
                  <span className="text-slate-100 font-semibold mr-2">
                    {selectedBacktest?.strategy ?? "—"}
                  </span>
                  <span className="text-slate-500">Run:</span>{" "}
                  <span className="text-slate-300">{selectedBacktest?.id ?? "—"}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <button className="border-b-2 border-sky-400 pb-1 text-sky-200">
                    Overview
                  </button>
                  <button className="text-slate-400 hover:text-slate-100">
                    Performance Summary
                  </button>
                  <button className="text-slate-400 hover:text-slate-100">
                    List of Trades
                  </button>
                  <button className="text-slate-400 hover:text-slate-100">
                    Properties
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-300">
                  <span>Deep backtesting</span>
                  <div className="relative inline-flex h-4 w-8 items-center rounded-full bg-slate-700">
                    <div className="h-3 w-3 rounded-full bg-slate-300 translate-x-1" />
                  </div>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/60 px-2 py-0.5 text-[10px] text-emerald-200">
                    BETA
                  </span>
                </div>
              </div>

              {/* Metric row */}
              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 text-[11px] mb-4">
                <div>
                  <p className="text-slate-400">Net profit</p>
                  <p className="text-emerald-400 font-semibold">22 477.81 USDT</p>
                  <p className="text-emerald-400">22.48%</p>
                </div>
                <div>
                  <p className="text-slate-400">Total closed trades</p>
                  <p className="text-slate-100 font-semibold">156</p>
                </div>
                <div>
                  <p className="text-slate-400">Percent profitable</p>
                  <p className="text-emerald-400 font-semibold">42.31%</p>
                </div>
                <div>
                  <p className="text-slate-400">Profit factor</p>
                  <p className="text-slate-100 font-semibold">1.266</p>
                </div>
                <div>
                  <p className="text-slate-400">Max drawdown</p>
                  <p className="text-rose-400 font-semibold">8 605.55 USDT</p>
                  <p className="text-rose-400">8.13%</p>
                </div>
                <div>
                  <p className="text-slate-400">Avg trade</p>
                  <p className="text-emerald-400 font-semibold">144.09 USDT</p>
                  <p className="text-emerald-400">1.38%</p>
                </div>
                <div>
                  <p className="text-slate-400">Avg bars in trades</p>
                  <p className="text-slate-100 font-semibold">60</p>
                </div>
              </div>

              {/* Big equity + drawdown chart */}
              <div className="relative h-56 md:h-72 rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 overflow-hidden">
                {/* Legend */}
                <div className="absolute top-2 left-3 z-10 flex items-center gap-3 text-[10px] text-slate-300 bg-slate-950/60 rounded-full px-2 py-1 border border-slate-700/70">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-4 rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-emerald-400" />
                    Equity curve
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-3 w-1.5 rounded-full bg-purple-700" />
                    Drawdown
                  </span>
                </div>

                <svg viewBox="0 0 200 100" className="w-full h-full">
                  <defs>
                    <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0f172a" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#020617" stopOpacity="0.1" />
                    </linearGradient>
                    <linearGradient id="equityLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="50%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                    <linearGradient id="ddFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4c1d95" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#020617" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>

                  {/* Drawdown bars (stylized) */}
                  <g opacity="0.85">
                    <rect x="4" y="48" width="4" height="40" fill="url(#ddFill)" />
                    <rect x="14" y="52" width="4" height="36" fill="url(#ddFill)" />
                    <rect x="24" y="46" width="4" height="42" fill="url(#ddFill)" />
                    <rect x="36" y="50" width="4" height="38" fill="url(#ddFill)" />
                    <rect x="48" y="44" width="4" height="44" fill="url(#ddFill)" />
                    <rect x="62" y="42" width="4" height="46" fill="url(#ddFill)" />
                    <rect x="78" y="40" width="4" height="48" fill="url(#ddFill)" />
                    <rect x="94" y="46" width="4" height="42" fill="url(#ddFill)" />
                    <rect x="112" y="38" width="4" height="50" fill="url(#ddFill)" />
                    <rect x="132" y="34" width="4" height="54" fill="url(#ddFill)" />
                    <rect x="152" y="36" width="4" height="52" fill="url(#ddFill)" />
                    <rect x="172" y="44" width="4" height="44" fill="url(#ddFill)" />
                    <rect x="188" y="48" width="4" height="40" fill="url(#ddFill)" />
                  </g>

                  {/* Equity area */}
                  <path
                    d="M0 80 L10 78 L20 76 L30 75 L40 74 L50 72 L60 70 L70 69 L80 67 L90 66 L100 64 L110 63 L120 61 L130 60 L140 59 L150 58 L160 57 L170 56 L180 55 L190 54 L200 53 L200 100 L0 100 Z"
                    fill="url(#equityFill)"
                    opacity="0.9"
                  />

                  {/* Equity line */}
                  <polyline
                    fill="none"
                    stroke="url(#equityLine)"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    points="0,80 10,78 20,76 30,75 40,74 50,72 60,70 70,69 80,67 90,66 100,64 110,63 120,61 130,60 140,59 150,58 160,57 170,56 180,55 190,54 200,53"
                  />

                  {/* Vertical markers */}
                  <g stroke="#1e293b" strokeDasharray="3 3" strokeWidth="0.6">
                    <line x1="40" y1="12" x2="40" y2="100" />
                    <line x1="80" y1="12" x2="80" y2="100" />
                    <line x1="120" y1="12" x2="120" y2="100" />
                    <line x1="160" y1="12" x2="160" y2="100" />
                  </g>
                </svg>

                <div className="absolute inset-x-4 bottom-2 flex justify-between text-[10px] text-slate-500">
                  <span>1</span>
                  <span>49</span>
                  <span>97</span>
                  <span>145</span>
                </div>
              </div>

              <p className="mt-3 text-[11px] text-slate-400">
                Mock equity and drawdown for <span className="text-slate-100">{btSymbol}</span> on
                <span className="text-slate-100"> {btTimeframe}</span> with starting capital
                <span className="text-slate-100"> {btCapital.toLocaleString()} USDT</span>. Wire this card
                to your backtest engine to stream real results.
              </p>
            </div>
          </section>

          {/* Ask ChatGPT section */}
          <section className="grid gap-5 lg:grid-cols-[minmax(0,_1.8fr)_minmax(0,_1.2fr)] items-start">
            <div className="rounded-3xl border border-slate-800/70 bg-slate-900/50 backdrop-blur-2xl p-5 flex flex-col gap-4 shadow-[0_12px_40px_rgba(15,23,42,0.8)]">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Ask ChatGPT
                  </p>
                  <p className="text-sm font-semibold">Questions, tips, or new strategies</p>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-slate-400">Model</span>
                  <select
                    value={chatModel}
                    onChange={(e) => setChatModel(e.target.value)}
                    className="rounded-full border border-slate-700/80 bg-slate-950/80 px-3 py-1 pr-6 text-[11px] text-slate-100 focus:outline-none focus:border-emerald-400/80"
                  >
                    <option value="gpt-5.1-thinking">GPT-5.1 Thinking (default)</option>
                    <option value="gpt-4.1">GPT-4.1</option>
                    <option value="gpt-4.1-mini">GPT-4.1 mini</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 text-[11px] md:grid-cols-3">
                <button
                  type="button"
                  onClick={() =>
                    setChatInput(
                      "Explain this strategy in simple terms: " +
                        (selectedBacktest?.strategy ?? "")
                    )
                  }
                  className="rounded-2xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-left hover:border-emerald-400/70 hover:bg-slate-900/80 transition-all duration-200"
                >
                  <p className="font-medium text-slate-100 mb-1">Explain my strategy</p>
                  <p className="text-slate-400">
                    Get a plain-language breakdown of the currently selected backtest.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setChatInput(
                      "Suggest improvements to my risk limits for this paper account. Max daily loss is $5,000."
                    )
                  }
                  className="rounded-2xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-left hover:border-sky-400/70 hover:bg-slate-900/80 transition-all duration-200"
                >
                  <p className="font-medium text-slate-100 mb-1">Risk tips</p>
                  <p className="text-slate-400">
                    Ask for safer max loss, position sizing, and guardrail ideas.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setChatInput(
                      "Propose a new crypto trading strategy I can backtest using BTCUSDT on 1h candles."
                    )
                  }
                  className="rounded-2xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-left hover:border-purple-400/70 hover:bg-slate-900/80 transition-all duration-200"
                >
                  <p className="font-medium text-slate-100 mb-1">New strategy idea</p>
                  <p className="text-slate-400">
                    Get a fresh idea ready to plug into the backtest engine.
                  </p>
                </button>
              </div>

              <div className="space-y-2">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask anything about this dashboard, your strategies, or anything else!"
                  className="min-h-[90px] w-full resize-none rounded-2xl border border-slate-700/80 bg-slate-950/70 px-3 py-2 text-[12px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-400/80"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <p>
                    ChatGPT can help explain metrics, suggest parameters, or brainstorm strategies.
                  </p>
                  <button
                    type="button"
                    onClick={handleSendToChatGPT}
                    className="relative inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-[11px] font-medium text-slate-950 shadow-[0_0_18px_rgba(148,163,184,0.6)] hover:shadow-[0_0_26px_rgba(148,163,184,0.9)] transition-all duration-200 disabled:opacity-60"
                    disabled={!chatInput.trim() || isSending}
                  >
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    {isSending ? "Sending..." : "Send to ChatGPT"}
                    <span className="absolute -inset-px rounded-full border border-slate-400/40 opacity-60" />
                  </button>
                </div>
              </div>

              {/* Simple chat history preview */}
              {chatHistory.length > 0 && (
                <div className="mt-3 max-h-40 overflow-y-auto rounded-2xl border border-slate-800/80 bg-slate-950/70 px-3 py-2 space-y-2 text-[11px]">
                  {chatHistory.map((m, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <p
                        className={`font-medium ${
                          m.role === "user" ? "text-sky-300" : "text-emerald-300"
                        }`}
                      >
                        {m.role === "user" ? "You" : "ChatGPT"}
                      </p>
                      <p className="text-slate-200 whitespace-pre-wrap">{m.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-800/70 bg-slate-900/40 backdrop-blur-2xl p-5 text-[11px] flex flex-col gap-3">
              <p className="text-sm font-semibold mb-1">How this works</p>
              <p className="text-slate-400">
                This panel prepares questions for ChatGPT using your current context (selected
                backtest, environment, and risk posture). The "Send to ChatGPT" button calls your
                <span className="text-slate-200"> /api/chat </span>
                backend route, which should in turn call the OpenAI API or a ChatGPT Action and
                return the model&apos;s reply.
              </p>
              <p className="text-slate-500">
                Right now this is a <span className="text-slate-200">frontend preview</span> – to
                make it live, implement the <span className="text-slate-200">/api/chat</span> route
                in your app with your preferred OpenAI model and any safety or logging you need.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
