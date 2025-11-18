# Multi‑Agent Trading Backend – Architecture & Implementation Guide

> Scope: This document is the single source of truth for implementing the multi‑agent → trade‑plan → risk → paper/live trading backend on top of the existing Fastify Node backend in `backend/`.
>
> It is designed to line up 1:1 with the frontend trading dashboard and shared type definitions.

No additional external recommendations are required outside this file; it already includes the full plan, pre‑checks, and implementation steps.

---

## 0. Goals

- Keep the existing execution engine and market‑data stack intact (Binance adapters, TradingService, MarketDataService).
- Add a new orchestration layer that:
  - Runs LLM‑based multi‑agent analysis.
  - Generates a structured trade plan.
  - Applies risk checks and approvals for paper and live.
- Expose a stable REST API surface that matches the frontend contract:

- `POST /api/agents/run-analysis`
- `POST /api/agents/generate-trade-plan`
- `GET  /api/risk/profiles`
- `GET  /api/risk/user-settings`
- `POST /api/risk/user-settings`
- `POST /api/risk/validate-trade-plan`
- `POST /api/trades/approve-paper`
- `POST /api/trades/approve-live`
- `GET  /api/portfolio/positions`
- `GET  /api/history/trades`
- `GET  /api/system/live-trading-status`

This guide assumes the Fastify app in `src/index.ts` is the entrypoint and that `@common/types` exists at the monorepo level for shared DTOs.

---

## 1. Existing Backend Overview (What We’re Building On)

### 1.1 Fastify Bootstrap

- `src/index.ts`
  - Creates a Fastify app with CORS and metrics.
  - Registers existing route plugins:

    - `authRoutes` at `/api/auth`
    - `billingRoutes` at `/api/billing`
    - `dashboardRoutes` at `/api`
    - `tradingRoutes` at `/api`
    - `systemRoutes` at `/api`
    - `apiRoutes` at `/api`
    - `tcaRoutes` at `/api`
    - `whaleWatchRoutes` (no prefix)

- Market data infra is bootstrapped here as well:

  - `MarketDataService`, `QuoteService`, Binance & Polygon WebSocket clients, and `marketStreamPlugin`.

### 1.2 Trading & Guardrails

- `src/api/trading.ts`
  - Exposes `/api/trading/orders` and related endpoints on top of `TradingService`.
- `src/routes/guardrails.ts`
  - Exposes a read‑only `/api/guardrails/state` with hard‑coded risk rule examples.
- `src/services/trading/TradingService.ts`
  - Normalizes symbols and sends orders to Binance.

Execution logic already exists; we only need to build a decision & risk layer in front of it, not a new execution engine.

---

## 2. New Backend Modules & Responsibilities

All new backend logic for the multi‑agent pipeline lives under `src/services` and `src/api`:

```text
backend/
  src/
    api/
      tradingFlow.ts            # multi‑agent, risk, approvals, portfolio, history, live status
    services/
      multiAgent/
        MultiAgentService.ts    # orchestration of analyst / researcher / trader agents
      risk/
        RiskService.ts          # risk profiles, user settings, trade‑plan validation
      portfolio/
        PortfolioService.ts     # paper/live positions + trade history
      trading/
        TradeApprovalService.ts # paper/live approval & live‑trading status on top of TradingService
  docs/
    multi_agent_backend_implementation.md
```

### 2.1 MultiAgentService

**File:** `src/services/multiAgent/MultiAgentService.ts`

Purpose:

- Provide backend‑side orchestration for the agent roles defined in the architecture blueprint (on‑chain, sentiment, news, technical, researchers, trader, risk team, portfolio manager).
- For v0, this service returns deterministic stub data so the frontend and pipeline can be wired without any LLM dependencies.
- Later, this service becomes a wrapper around your LLM / LangGraph agent graph.

Key methods:

- `runAnalysis(input: RunAnalysisInput): Promise<MultiAgentAnalysisResult>`
- `generateTradePlan(args: GenerateTradePlanArgs): Promise<TradePlan>`

### 2.2 RiskService

**File:** `src/services/risk/RiskService.ts`

Purpose:

- Centrally manage risk profiles, user risk settings, and trade‑plan validation.
- For v0, everything is in‑memory; later this becomes a DB‑backed risk engine.

Key methods:

- `getProfiles(): RiskProfile[]`
- `getUserSettings(userId: string): Promise<UserRiskSettings>`
- `saveUserSettings(userId: string, settings: UserRiskSettings): Promise<UserRiskSettings>`
- `validateTradePlan(args: ValidateTradePlanArgs): Promise<RiskValidationResult>`

### 2.3 PortfolioService

**File:** `src/services/portfolio/PortfolioService.ts`

Purpose:

- Provide paper/live positions and trade history to the trading dashboard.
- For v0, returns a static example portfolio; later, plug into your real persistence (DB or exchange).

Key methods:

- `getPositions(userId: string): Promise<Position[]>`
- `getTradeHistory(userId: string, filters: TradeHistoryFilters): Promise<TradeHistoryResult>`

### 2.4 TradeApprovalService

**File:** `src/services/trading/TradeApprovalService.ts`

Purpose:

- Sits between the multi‑agent trade plan and the existing TradingService.
- Authorizes and triggers paper or live trades.

Key methods:

- `getLiveTradingStatus(userId: string): Promise<LiveStatus>`
- `approvePaperTrade(args: ApproveTradeArgs): Promise<ApproveTradeResult>`
- `approveLiveTrade(args: ApproveLiveTradeArgs): Promise<ApproveTradeResult>`

---

## 3. New API Plugin – tradingFlowRoutes

**File:** `src/api/tradingFlow.ts`

This Fastify plugin exposes all endpoints used by the frontend trading dashboard behind the `/api` prefix.

### 3.1 Route Summary

Under prefix `/api`:

- `POST /agents/run-analysis`
- `POST /agents/generate-trade-plan`
- `GET  /risk/profiles`
- `GET  /risk/user-settings`
- `POST /risk/user-settings`
- `POST /risk/validate-trade-plan`
- `POST /trades/approve-paper`
- `POST /trades/approve-live`
- `GET  /portfolio/positions`
- `GET  /history/trades`
- `GET  /system/live-trading-status`

Each route:

- Validates input using JSON schema where appropriate.
- Pulls a `userId` from `request.user?.sub` when JWT is configured, else falls back to `"demo-user"`.
- Delegates to the services in §2.
- Returns JSON DTOs that match the frontend types.

### 3.2 Wiring Into Fastify

In `src/index.ts` add:

```ts
import { tradingFlowRoutes } from './api/tradingFlow';

// inside buildServer(), after other app.register(...) calls
await app.register(tradingFlowRoutes, { prefix: '/api' });
```

No other bootstrap changes are required.

---

## 4. Type Model (Backend View)

For v0, the backend defines its own interfaces in the new services. In the full monorepo, you should lift these into `@common/types` so both backend and frontend share the same DTOs.

### 4.1 Multi‑Agent Types (Service‑Local)

Defined in `MultiAgentService.ts`:

- `RunAnalysisInput`
- `AgentStatus`, `AgentSummary`
- `MultiAgentAnalysisResult`
- `GenerateTradePlanArgs`, `TradePlan`, `TradeEntryLeg`, `TradeTargetLeg`, `StopLoss`

### 4.2 Risk Types (Service‑Local)

Defined in `RiskService.ts`:

- `RiskProfileId`, `RiskProfile`
- `UserRiskSettings`
- `RiskMetrics`
- `RiskViolation`
- `RiskValidationResult`
- `ValidateTradePlanArgs`

### 4.3 Portfolio Types (Service‑Local)

Defined in `PortfolioService.ts`:

- `Position`
- `Trade`
- `TradeHistoryFilters`
- `TradeHistoryResult`

### 4.4 Live/Approval Types

Defined in `TradeApprovalService.ts`:

- `LiveStatus`
- `ApproveTradeArgs`
- `ApproveTradeResult`
- `ApproveLiveTradeArgs` (extends `ApproveTradeArgs` with `confirmations`)

---

## 5. Pre‑Check List (Before Implementing Anything)

Run these checks once in the backend root (`backend/`):

1. Dependencies & Tooling

   ```bash
   node -v
   cd backend
   npm install
   npm run build
   ```

2. Environment

   - Check `.env` or `.env.example` for:

     - `BINANCE_API_KEY`, `BINANCE_API_SECRET`
     - `BINANCE_TRADING_ENABLED`
     - JWT secret / keys (demo mode is fine for now).

3. Server Starts Cleanly

   ```bash
   cd backend
   npm run dev
   # or:
   npm start
   ```

   - Hit `http://localhost:8080/api/system/status` and confirm JSON response.
   - Hit `http://localhost:8080/api/guardrails/state` and confirm static risk rules come back.

Only proceed once these are all green.

---

## 6. Stub Creation – Files & Commands

The following shell snippet creates all new stub services with safe defaults.

From `backend/` run:

```bash
mkdir -p src/services/multiAgent
mkdir -p src/services/risk
mkdir -p src/services/portfolio

# Multi‑agent orchestration service
cat > src/services/multiAgent/MultiAgentService.ts << 'EOF'
... (content omitted here – see this file in the repo)
EOF

# Risk service
cat > src/services/risk/RiskService.ts << 'EOF'
... (content omitted here – see this file in the repo)
EOF

# Portfolio service
cat > src/services/portfolio/PortfolioService.ts << 'EOF'
... (content omitted here – see this file in the repo)
EOF
```

The actual TypeScript implementations live in the corresponding files created by this guide.

---

## 7. TradingFlow API Plugin

In `src/api/tradingFlow.ts` implement a Fastify plugin that wires all services together:

- Accepts and validates each request.
- Derives `userId`.
- Calls the appropriate service.
- Returns the DTO.

All routes are safe stubs by default, so you can run `npm run dev` and immediately see real JSON responses to every frontend call.

---

## 8. Migration Path to Full Implementation

Once the frontend and backend stubs are confirmed working end‑to‑end:

1. Replace `MultiAgentService` internals with calls into your LLM agent graph and real data sources.
2. Point `RiskService` at your persistent risk configuration and portfolio data.
3. Point `PortfolioService` at your real positions and trade storage (DB or exchange).
4. Wire `TradeApprovalService` into `TradingService` so live approvals place real orders when `BINANCE_TRADING_ENABLED=true`.

This completes the multi‑agent → plan → risk → paper/live backend implementation on top of the existing system.

---

## Runtime verification (2025‑11‑18)

- Started via `cd apps/backend && NODE_ENV=development NODE_OPTIONS='--experimental-specifier-resolution=node' node --loader ts-node/esm src/index.ts`.
- Verified API base `http://localhost:8080` with:
  - `curl -X POST "$API_BASE/api/agents/run-analysis" ...`
  - `curl "$API_BASE/api/risk/profiles"`
  - `curl "$API_BASE/api/portfolio/positions"`
  - `curl "$API_BASE/api/system/live-trading-status"`
- Frontend `/trading` served via `npm run dev` in `apps/frontend` and `curl http://localhost:3000/trading` returned 200 with TradingDashboard HTML.
