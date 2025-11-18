# PROJECT7_V3 – Multi-Agent Crypto “Trading Firm in a Box”

A full-stack **LLM-powered multi-agent crypto trading lab** that mimics a real hedge fund (analysts → research → trader → risk → portfolio manager), runs in **paper trading mode first**, and is controlled through a **Next.js “Control Surface” dashboard**.

> **Status:** `Experimental • Paper only`  
> **Mode:** `Research / Backtesting • NOT live money`  

---

## Table of Contents

- [What is this?](#what-is-this)
- [Core Ideas](#core-ideas)
- [System Architecture](#system-architecture)
  - [Agents](#agents)
  - [Data & Tools Layer](#data--tools-layer)
  - [Orchestration Graph](#orchestration-graph)
  - [Execution Engine Integration](#execution-engine-integration)
  - [Backtesting & Simulation](#backtesting--simulation)
- [Dashboard (Next.js Control Surface)](#dashboard-nextjs-control-surface)
  - [Layout & Navigation](#layout--navigation)
  - [Header & Global Status Strip](#header--global-status-strip)
  - [PnL / Account Card](#pnl--account-card)
  - [Top Coins Card](#top-coins-card)
  - [Strategy Tester / Backtest Workbench](#strategy-tester--backtest-workbench)
  - [Backtest Visualizer](#backtest-visualizer)
  - [Ask ChatGPT Panel](#ask-chatgpt-panel)
  - [“How This Works” Explainer Card](#how-this-works-explainer-card)
- [End-to-End Lifecycle](#end-to-end-lifecycle)
- [Conceptual Project Layout](#conceptual-project-layout)
- [Roadmap](#roadmap)
- [Safety & Disclaimer](#safety--disclaimer)

---

## What is this?

**PROJECT7_V3** evolves a single “crypto bot” into a **multi-agent trading platform** that behaves like a small hedge fund:

- **Analyst agents** ingest and summarize on-chain, sentiment, news, technicals, and fundamentals.
- **Researcher agents** (bull vs bear vs optional neutral) debate trade ideas.
- A **Trader agent** turns the debate into a concrete trade plan.
- A **Risk committee** stress-tests and adjusts that plan.
- A **Fund / Portfolio Manager agent** gives final approval and hands a clean order to the existing execution engine.
- A **Next.js dashboard** lets you monitor everything, run backtests, and chat with an LLM about strategies and risk.

Everything is **paper trading first**, with hooks ready for **real execution later** behind clear guardrails.

---

## Core Ideas

- **“Trading firm in a box”**: Model the roles and workflows of an actual fund (analyst → research → trader → risk → PM).
- **LLM multi-agent system**: Each role is an agent with its own prompts, tools, and perspective.
- **Paper trading by default**: Use real-world-like flows without risking capital.
- **Backtest-first philosophy**: Run the full multi-agent stack on historical data before enabling any live mode.
- **Dark, glassy control surface**: A Next.js dashboard designed as a **lab**, not just a charting UI.
- **Existing bot–friendly**: The multi-agent module plugs into your current execution engine via a simple interface.

---

## System Architecture

At a high level, the backend is a **modular multi-agent system** coordinated by an **orchestration graph** (LangGraph-style).

### Agents

#### Analyst Agents

Dedicated analyst agents transform noisy inputs into structured summaries. Each produces **JSON-like reports** with key metrics, risk flags, and short natural-language explanations.

- **On-Chain Analyst**
  - Active addresses, transaction volume, gas fees
  - Staking flows, token velocity, etc.
  - Sources: on-chain analytics APIs (e.g., Glassnode, CryptoQuant, DeFiLlama)

- **Sentiment Analyst**
  - Twitter/X, Reddit, Discord, Telegram
  - Converts crypto slang into normalized sentiment scores / tags

- **News & Event Analyst**
  - Crypto news feeds (CoinDesk, CoinTelegraph, The Block, etc.)
  - Macro calendars: FOMC, CPI, major regulatory events
  - Flags listings/delistings, hacks, regulatory moves, and other shocks

- **Technical Analyst**
  - Builds indicator bundles over price/volume:
    - MA/EMA, RSI, MACD, Bollinger Bands, ATR, etc.
  - Uses CEX APIs (Binance, Coinbase) and DEX data (e.g., Uniswap subgraphs)

- **Fundamental Analyst (optional)**
  - Tokenomics, emission schedules, protocol revenues
  - Treasury health, GitHub activity, ecosystem traction (e.g., Messari, Token Terminal)

Each agent outputs something like:

```jsonc
{
  "asset": "BTCUSDT",
  "timeframe": "1h",
  "signals": {
    "trend": "bullish",
    "momentum": "strong",
    "liquidity": "high"
  },
  "risk_flags": ["elevated leverage", "clustered liquidation levels"],
  "notes": "Short squeeze conditions building above recent local highs."
}

Researcher Agents (Bull vs Bear)
	•	Bullish Researcher
	•	Argues why a given asset should go up based on all analyst reports.
	•	Bearish Researcher
	•	Argues why it should go down.
	•	They debate over 1–N rounds, critiquing each other’s reasoning.
	•	Optional Neutral / Macro Researcher injects macro-level risks and long-term cycle context.

Outputs:
	•	Debate transcript
	•	Structured summary:
	•	Key bullish drivers
	•	Key bearish drivers
	•	Unknowns / uncertainties
	•	Overall bias: bullish | bearish | neutral

Trader Agent
Acts like a head trader:
	•	Inputs:
	•	Aggregated analyst reports
	•	Research debate summary
	•	Current portfolio state & risk limits
	•	Outputs:
	•	Action: BUY | SELL | HOLD | CLOSE
	•	Asset & market: e.g. BTCUSDT spot or derivative
	•	Position size: based on fixed-fractional, Kelly-style, or custom sizing rules
	•	Risk parameters: stop loss, take profit, max position %
	•	Timing / execution hints: immediate vs staged entries
	•	Human-readable rationale for logging & audit

Risk Management Agents
A risk committee of personas:
	•	Risk-seeking
	•	Risk-neutral
	•	Risk-averse / conservative

They take the trader’s plan and:
	•	Check volatility, liquidity, leverage, concentration, correlation
	•	Adjust:
	•	Reduce size in high-volatility or low-liquidity conditions
	•	Tighten stops under heightened risk
	•	Reject additional leverage if portfolio is already stretched
	•	Annotate the plan with risk comments & overrides, e.g.:

“Reduce exposure from 3% to 1.5% of equity due to elevated perpetual funding rates and thin order book depth.”

Fund / Portfolio Manager Agent
Final gate before any order hits the execution engine:
	•	Reads:
	•	Trader plan
	•	Risk adjustments and comments
	•	Portfolio context & risk limits
	•	Decides:
	•	Approve (possibly with tweaks)
	•	Reject outright
	•	(Future) Request revision / send back
	•	On approval, emits a clean execution order:

{
  "symbol": "BTCUSDT",
  "side": "BUY",
  "quantity": 0.5,
  "type": "MARKET",
  "stop_loss": 64000,
  "take_profit": 69000,
  "max_position_pct": 0.03,
  "mode": "paper"
}


⸻

Data & Tools Layer

All agents call into a shared tool layer:
	•	Market data
	•	Real-time & historical OHLCV from CEX/DEX and aggregators
	•	On-chain analytics
	•	REST/SDK connectors to on-chain platforms and custom ETL
	•	Social, news, macro
	•	Twitter/X, Reddit, Telegram/Discord bots
	•	RSS feeds for crypto news
	•	Macro event calendars
	•	Indicators & analytics
	•	ta-lib, pandas-ta, or custom indicator libraries
	•	LLM orchestration
	•	LangGraph-like graph
	•	Wrappers for OpenAI / Anthropic / local models
	•	Caching and memory where appropriate
	•	Storage & logging
	•	DB (SQL/NoSQL) to store:
	•	Trade decisions & orders
	•	Agent outputs & debate logs
	•	Data snapshots used per decision
	•	Backtest runs & metrics

⸻

Orchestration Graph

The orchestration graph is the brain wiring of the system.

Entry points:
	•	“Evaluate BTCUSDT now”
	•	“Run full daily cycle on portfolio”

High-level sequence:
	1.	Fetch data → run analyst agents
	2.	Aggregate and pass to researcher debate
	3.	Pass results to Trader agent
	4.	Pass trade plan to Risk committee
	5.	Pass risk-adjusted plan to PM agent
	6.	Emit clean execution order → execution engine

Shared state:
	•	Current market snapshot
	•	Portfolio & risk limits
	•	Historical performance and decisions

Conditional logic:
	•	Missing / degraded data → fall back to simple logic or “no-trade”
	•	Volatility above threshold → auto-downsize or require stronger conviction
	•	Circuit breakers / killswitches for extreme conditions

The architecture is modular by design: add/remove agents, swap models, or plug in new data sources without rewriting the core graph.

⸻

Execution Engine Integration

The multi-agent stack does not replace your existing trading bot; it sits on top of it.
	•	Execution engine responsibilities:
	•	Place orders via exchange APIs
	•	Manage WebSocket subscriptions
	•	Track fills, positions, and account balances
	•	Multi-agent system talks to the engine through a simple order schema (see JSON example above).
	•	Modes:
	•	paper – simulate orders, maintain virtual PnL & positions
	•	(Future) live – real orders, only when explicitly enabled & gated

For now, the emphasis is firmly on paper trading:
	•	All orders are simulated
	•	Guardrails and killswitch remain active
	•	Every step is logged for future analysis & backtesting

⸻

Backtesting & Simulation

Before enabling any live trading, the system is meant to run the full multi-agent loop on historical data:
	•	Replayed inputs:
	•	Market data (price, volume, orderbook snapshots if available)
	•	On-chain metrics
	•	Historical sentiment/news (where datasets exist)
	•	Key metrics:
	•	Cumulative & annualized returns
	•	Sharpe ratio, Sortino, etc.
	•	Maximum drawdown
	•	Hit rate, profit factor
	•	Trade frequency and distribution
	•	Average trade metrics (R-multiple, duration, etc.)
	•	Comparisons:
	•	Multi-agent strategy performance vs existing baseline/bot
	•	Complexity tax vs gain in robustness and risk-adjusted returns

⸻

Dashboard (Next.js Control Surface)

The frontend is a Next.js / React dashboard that acts as a Control Surface over the multi-agent backend and backtest engine.

Layout & Navigation

Theme: full-screen dark, glassy UI.
	•	Left Sidebar
	•	Brand block: CryptoBot – Control Surface with a neon emerald vibe
	•	Navigation:
	•	Dashboard
	•	Strategies
	•	Risk & Guardrails
	•	Backtests
	•	Settings
	•	Environment pill at the bottom:
	•	Dev • Paper only
	•	Green status dot + subtle glow → clearly not live money
	•	Right Main Panel
	•	Trading Overview: PnL, account info, market snapshot
	•	Strategy tester & backtest workbench
	•	Backtest visualizer
	•	Ask-ChatGPT panel

⸻

Header & Global Status Strip

Across the top of the main content:
	•	Title area
	•	Eyebrow: Control Center
	•	Trading Overview as main heading
	•	Version chip: v0.7 • Internal
	•	Attribution: Designed by SixxCris
	•	Right-side controls
	•	Go • Start Session button – kicks off a paper-trading multi-agent session
	•	Provider status pills (e.g., Binance, Polygon) with latency & health colors
	•	Timeframe selector: e.g. Timeframe: 24h
	•	User pill: avatar + email + role

Global status strip (just under the header):
	•	Environment: Dev · Paper environment
	•	Guardrails: Guardrails on · Killswitch armed
	•	Last sync time
	•	Paper account equity (e.g. $100,000)

⸻

PnL / Account Card

First row – left large card:
	•	Today’s paper PnL:
	•	Example: +$8,421 (+12.4%)
	•	Metadata:
	•	Active strategies count
	•	Open positions count
	•	Explicit line:
	•	“Paper mode · No real orders are being placed.”
	•	Badges:
	•	Drift safe / Latency OK / Guardrails: 1 killswitch
	•	Side details:
	•	Last synthetic fill time
	•	Venue & pair (e.g. Binance • BTCUSDT)
	•	Exposure style (Market neutral, Directional, etc.)
	•	Decorative mini-chart:
	•	Stylized equity curve (hook for a real timeseries feed later)

⸻

Top Coins Card

First row – right card:
	•	“Top coins today” table:
	•	Rank
	•	Symbol
	•	Name
	•	Volume
	•	Dominance
	•	24h view chip
	•	“View full market board →” CTA

Later, this will connect to a market scanner / quotes API.

⸻

Strategy Tester / Backtest Workbench

Second row – left card:

Tracks configuration for a strategy/backtest:
	•	Pair (e.g. BTCUSDT)
	•	Timeframe (1h, 4h, 1d, etc.)
	•	Starting capital (default 100000)

UI elements:
	•	Preset buttons:
	•	Scalp / Swing / Macro
	•	Inputs:
	•	Pair symbol
	•	Timeframe selector
	•	Capital input + validation/warnings
	•	Backtests table (mock initially):
	•	Status (Completed / Running)
	•	Sharpe, PnL
	•	Natural language description and pseudo-equation
	•	Clicking a row:
	•	Selects a run
	•	Updates the Backtest visualizer and ChatGPT context

⸻

Backtest Visualizer

Second row – right card:
	•	Tabbed interface:
	•	Overview
	•	Performance
	•	Trades
	•	Properties
	•	Metrics grid (examples):
	•	Net profit & %
	•	Total closed trades
	•	% profitable
	•	Profit factor
	•	Max drawdown
	•	Avg trade & bars in trades
	•	Chart:
	•	Equity curve
	•	Drawdown bars beneath it

Everything here is designed to be driven by real backtest metrics later.

⸻

Ask ChatGPT Panel

Bottom left – Ask ChatGPT:
	•	Displays:
	•	Chat history
	•	Selected model
	•	Input area
	•	Seed buttons:
	•	Explain my strategy
	•	Risk tips
	•	New strategy idea
	•	Sends POST /api/chat with:

{
  "model": "gpt-…",
  "message": "Explain why my BTCUSDT swing strategy has such a high max drawdown.",
  "context": {
    "selectedBacktestId": "...",
    "symbol": "BTCUSDT",
    "timeframe": "4h",
    "capital": 100000
  }
}

The backend implements /api/chat to call OpenAI (or another LLM) and return { reply }.

⸻

“How This Works” Explainer Card

Bottom right – Documentation / explainer section:
	•	Clarifies that:
	•	This dashboard is currently a frontend preview and lab interface.
	•	/api/chat and data endpoints must be implemented server-side.
	•	You can add logging, safety hooks, and context shaping on the backend.

⸻

End-to-End Lifecycle
	1.	Open the dashboard (Dev • Paper only).
	2.	Configure or choose a strategy in the Strategy tester.
	3.	Backend multi-agent system:
	•	Runs analyst agents (on-chain, sentiment, news, technicals, fundamentals).
	•	Runs researcher debate (bull vs bear, optional neutral).
	•	Builds a trade plan via the Trader agent.
	•	Runs it through the Risk committee.
	•	Sends it to the Portfolio Manager agent for approval.
	4.	Execution (paper mode):
	•	Approved orders are simulated by the execution engine.
	•	Virtual portfolio, positions, and PnL are updated.
	5.	Dashboard updates:
	•	PnL, positions, and backtest metrics refresh.
	6.	You talk to ChatGPT about:
	•	Strategy design
	•	Risk posture
	•	Ideas for new variants or constraints
	7.	All:
	•	Data snapshots
	•	Debates & narratives
	•	Trades & outcomes
…are logged for analysis, research, and future backtesting.

⸻

Conceptual Project Layout

This is a suggested structure for organizing the project. Adapt to match your existing repo.

project7_v3/
  backend/
    agents/
      analysts/
      researchers/
      trader/
      risk/
      pm/
    orchestration/
      graph.ts
      state.ts
    tools/
      market_data/
      onchain/
      sentiment/
      news/
      indicators/
    execution/
      interface.ts      # thin layer to existing bot
    backtesting/
      engine.ts
      runners/
    storage/
      models/
      migrations/
  frontend/
    app/                # Next.js app router
      dashboard/
      backtests/
      settings/
    components/
      layout/
      cards/
      charts/
      chat/
    lib/
      api/
      hooks/
  docs/
    architecture.md
    agents.md
    risk_model.md
  README.md


⸻

Roadmap
	•	Wire real data sources (market, on-chain, sentiment, news)
	•	Implement LangGraph-style orchestration with pluggable agents
	•	Persist agent debates & decisions for long-term analysis
	•	Connect Strategy tester to the real backtest engine
	•	Drive Backtest visualizer charts from backend metrics
	•	Implement /api/chat with rich context injection
	•	Add robust safety / risk guardrails (circuit breakers, limits)
	•	Design controlled path from paper to live mode

⸻

Safety & Disclaimer

This project is a research & experimentation lab:
	•	Not financial advice.
	•	Not production-ready for real capital by default.
	•	All flows are built paper first; any live trading integration must be explicitly implemented, tested, and governed with strict risk controls.

⸻

One-sentence summary:
PROJECT7_V3 is a multi-agent LLM crypto trading lab where a simulated trading firm (analysts, researchers, trader, risk, PM) sits on top of rich data pipelines, feeds decisions into your existing bot’s execution engine in paper mode, and is orchestrated and inspected through a dark, glassy Next.js dashboard for PnL, backtests, and direct ChatGPT interaction—engineered from day one to evolve into a production-grade live system.

