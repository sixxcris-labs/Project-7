# Project 7 – Consolidated Multi‑Agent Trading Plans
This file consolidates the active implementation plans so Codex/devs only need **one** entry point.
It pulls from:
- `apps/frontend/docs/trading_precheck_and_plan.md`
- `apps/frontend/docs/plans/2025-02-14-multi-agent-trading-frontend.md`
- `apps/backend/docs/multi_agent_backend_implementation.md`

---

## 1. Trading Dashboard – Precheck & Implementation Plan (Frontend / Flow)

> Source: `apps/frontend/docs/trading_precheck_and_plan.md`

# Multi‑Agent Trading Dashboard – Precheck & Implementation Plan

## 1. Confirmation: dashboard baseline

- The **CryptoBot Control Surface** dashboard you attached (the dark glassmorphism layout with sidebar, PnL card, backtest workbench, and ChatGPT panel) is the **correct baseline main dashboard**.
- We will keep this as the main `/dashboard` view and add a **separate `/trading` page** for the multi‑agent → plan → risk → paper/live flow.
- Codex should treat `/dashboard` as the **visual home screen** and `/trading` as the **decision/approval workspace**.

## 2. Pre‑flight checklist (run before editing files)

Have Codex (or the dev) confirm each item:

1. **Repo layout**
   - Root contains: `Project7_CryptoBot_Dev/apps/frontend`.
   - Inside `apps/frontend`:
     - `package.json` with Next/React.
     - `src/pages/dashboard.tsx` (or equivalent) already builds.

2. **Core shared pieces exist**
   - `src/stores/dashboardStore.ts` – exposes `currentSymbol`, `tradeEnvironment`, and setters.
   - `src/hooks/useLiveQuotes.ts` – returns `{ quotes, status }` for an array of symbols.
   - `src/components/dashboard/DataPanel.tsx` – panel wrapper with `state` prop (`"loading" | "ready" | "empty" | "error"`).
   - `src/components/ui/Button.tsx` – base button component.
   - `src/lib/api.ts` – exports `apiGet`, `apiPost`, and `swrFetcher`.

3. **Backend endpoints (or stubs) available**
   - `/api/agents/run-analysis`
   - `/api/agents/generate-trade-plan`
   - `/api/risk/validate-trade-plan`
   - `/api/trades/approve-paper`
   - `/api/trades/approve-live`
   - `/api/portfolio/positions`
   - `/api/history/trades`
   - `/api/system/live-trading-status`
   - If they are not implemented yet, keep the frontend but **stub the backend** to avoid 500s.

4. **TypeScript & linting**
   - `tsconfig.json` present and `npm run lint` passes on current main branch.
   - No custom TypeScript path aliases conflict with these new relative imports.

If any of these fail, fix them **before** wiring the new trading page.

---

## 3. Implementation plan (for Codex to follow)

### Step 1 – Drop in the new files

From this bundle into your repo (paths are relative to `Project7_CryptoBot_Dev/apps/frontend`):

- `docs/trading_precheck_and_plan.md`  
  – This file. Keep it in Git as the canonical frontend spec.

- `src/services/api/tradingFlowApi.ts`  
  – Frontend API wrapper for all multi‑agent + risk + positions/history endpoints.

- `src/stores/tradingSessionStore.ts`  
  – Zustand store that owns the full pipeline state and async actions.

- `src/components/trading/TradingDashboard.tsx`  
  – Main UI for the multi‑agent → plan → risk → approvals view.

- `src/pages/trading.tsx`  
  – Next.js page that mounts `TradingDashboard` at the `/trading` route.

- `src/pages/dashboard.tsx`  
  – Optional: the styled CryptoBot dashboard baseline you provided.  
    - If a different `dashboard.tsx` already exists, **do not overwrite automatically**; have Codex compare and merge the styling you want.

Codex should copy the files in exactly as‑is, then resolve any import paths if your project structure differs.

### Step 2 – Wire navigation (if needed)

In whatever component renders your sidebar/top nav (often `src/components/layout/Sidebar.tsx` or similar):

- Add a nav item pointing to `/trading` labelled e.g. **“Trading Flow”** or **“Multi‑Agent Trading”**.
- Do **not** remove the existing “Dashboard” entry.

This makes `/dashboard` = overview and `/trading` = decision pipeline.

### Step 3 – Sanity build

Have Codex run:

```bash
cd Project7_CryptoBot_Dev/apps/frontend
npm install
npm run lint
npm run build
```

Fix any type/import errors until `npm run build` succeeds.

---

## 4. Pipeline coverage checklist (“nothing missing”)

The multi‑agent pipeline has 5 main actions. Each one must have a **backend endpoint, frontend API function, store method, and UI button**:

1. **Run multi‑agent analysis**
   - Backend: `POST /api/agents/run-analysis`
   - FE API: `runAnalysis(body)` in `tradingFlowApi.ts`
   - Store: `runAnalysis()` in `tradingSessionStore.ts`
   - UI: “Run agents / analyze” button in `TradingDashboard` header

2. **Generate trade plan**
   - Backend: `POST /api/agents/generate-trade-plan`
   - FE API: `generateTradePlan(body)` in `tradingFlowApi.ts`
   - Store: `generateTradePlan()` in `tradingSessionStore.ts`
   - UI: “Generate plan” button

3. **Validate risk**
   - Backend: `POST /api/risk/validate-trade-plan`
   - FE API: `validateTradePlan(body)` in `tradingFlowApi.ts`
   - Store: `validateRisk()` in `tradingSessionStore.ts`
   - UI: “Validate risk” button

4. **Approve paper trade**
   - Backend: `POST /api/trades/approve-paper`
   - FE API: `approvePaperTrade(body)` in `tradingFlowApi.ts`
   - Store: `approvePaper()` in `tradingSessionStore.ts`
   - UI: “Approve paper trade” button

5. **Approve live trade**
   - Backend: `POST /api/trades/approve-live`
   - FE API: `approveLiveTrade(body)` in `tradingFlowApi.ts`
   - Store: `approveLive(confirmations)` in `tradingSessionStore.ts`
   - UI: “Approve live trade” button + 2 confirmation checkboxes

Before shipping, have Codex verify that **each row above exists and compiles**.

---

## 5. Final verification checklist

Right before merging / deploying:

1. `/dashboard` loads and looks like the CryptoBot Control Surface you expect.
2. `/trading` loads with:
   - Config header (symbol, side, size, timeframe, mode).
   - Three main panels: multi‑agent analysis, trade plan, risk & approvals.
   - Positions + recent trades row.
3. Button flow works end‑to‑end in paper mode:
   - Run agents → plan → risk → approve paper.
4. Live mode is visible but **blocked** if `liveStatus.enabled === false`.
5. No TypeScript errors, and `npm run build` completes successfully.

“Measure twice, deploy once.”  

---

## Runtime verification (2025‑11‑18)

- **Backend start:** `cd apps/backend && NODE_ENV=development NODE_OPTIONS='--experimental-specifier-resolution=node' node --loader ts-node/esm src/index.ts`
- **API base:** `http://localhost:8080`
- **Endpoint checks:**
  - `curl -X POST "$API_BASE/api/agents/run-analysis" -H 'Content-Type: application/json' -d '{"symbol":"BTC-USDT","side":"long","sizeNotional":1000,"timeframe":"1h","strategyProfile":"swing","riskProfileId":"moderate"}'`
  - `curl "$API_BASE/api/risk/profiles"`
  - `curl "$API_BASE/api/portfolio/positions"`
  - `curl "$API_BASE/api/system/live-trading-status"`
- **Frontend smoke test:** `cd apps/frontend && npm run dev`, then `curl http://localhost:3000/trading` (200) confirmed TradingDashboard rendered and no runtime crashes in dev logs.


---

## 2. Multi-Agent Trading Frontend Implementation Plan (2025‑02‑14)

> Source: `apps/frontend/docs/plans/2025-02-14-multi-agent-trading-frontend.md`

# Multi-Agent Trading Frontend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire the new multi-agent trading workflow into the frontend with `/dashboard` as the overview and `/trading` as the full agent → plan → risk → approvals flow.

**Current Status:** Frontend + backend integrations are complete, temporary bundles are removed, and runtime verification now runs cleanly (`NODE_ENV=development NODE_OPTIONS='--experimental-specifier-resolution=node' node --loader ts-node/esm src/index.ts` + `npm run dev` in apps/frontend). `/trading` responds with 200 and the stub endpoints at `http://localhost:8080` match `tradingFlowApi` expectations.

**Architecture:** Integrated TradingDashboard (API layer, Zustand store, components, page) sits alongside the existing dashboard. Navigation, store wiring, and backend stubs are ready; next step is runtime verification.

**Tech Stack:** Next.js 14 (pages router), React, Zustand, TypeScript, SWR, custom UI components, REST APIs (stubbed).

---

## Section A – Pre-flight Checklist

### [x] Task A1: Verify Repo Layout & Shared Dependencies

**Files:**
- Inspect: `apps/frontend/package.json`
- Inspect: `apps/frontend/src/pages/dashboard.tsx`
- Inspect: `apps/frontend/src/stores/dashboardStore.ts`
- Inspect: `apps/frontend/src/hooks/useLiveQuotes.ts`
- Inspect: `apps/frontend/src/components/dashboard/DataPanel.tsx`
- Inspect: `apps/frontend/src/components/ui/Button.tsx`
- Inspect: `apps/frontend/src/lib/api.ts`

**Step 1:** Confirm `apps/frontend` contains `package.json` with Next/React scripts (`dev`, `lint`, `build`).

**Step 2:** Ensure `src/pages/dashboard.tsx` renders the CryptoBot Control Surface (no unmerged placeholder).

**Step 3:** Ensure shared store/hook/component files listed above exist and compile; skim for exported names used by the bundle (e.g., `useDashboardStore`, `useLiveQuotes`, `DataPanel`).

**Verification:** No missing files; `npm run lint` passes on main branch.

---

### [x] Task A2: Confirm Backend Endpoint Availability or Stubs

**Files:**
- Inspect/Stub: `apps/backend` equivalent endpoints (or document stub status)

**Step 1:** For each endpoint described in `docs/trading_precheck_and_plan.md` (run-analysis, generate-trade-plan, validate-trade-plan, approve-paper, approve-live, fetch positions/history/live-status), check if a real backend route exists.

**Step 2:** If missing, note that stubs will be created (user handling backend later). Ensure FE knows responses to expect (per `tradingFlowApi.ts` interfaces).

**Verification:** Document which endpoints are live vs stubbed before frontend integration.

---

## Section B – Bundle Integration

### [x] Task B1: TradingFlow API Layers Integrated

**Files:**
- `apps/frontend/docs/trading_precheck_and_plan.md`
- `apps/frontend/src/services/api/tradingFlowApi.ts`

**Status:** Docs + API client live in repo; imports resolved to in-repo modules.

---

### [x] Task B2: Trading Session Store Added

**Files:**
- `apps/frontend/src/stores/tradingSessionStore.ts`

**Status:** Store imports in-repo modules and compiles cleanly.

---

### [x] Task B3: Trading Dashboard Component & Page Live

**Files:**
- `apps/frontend/src/components/trading/TradingDashboard.tsx`
- `apps/frontend/src/pages/trading.tsx`

**Status:** `/trading` renders the integrated TradingDashboard component.

---

### [x] Task B4: Dashboard Preserved & Navigation Updated

**Files:**
- `apps/frontend/src/pages/dashboard.tsx`
- `apps/frontend/src/components/SideNav.tsx`

**Status:** Control surface restored; SideNav includes `/trading`.

---

## Section C – Verification & Stubs Alignment

### [x] Task C1: Backend Runtime Verification

**Notes:** Started backend locally via `NODE_ENV=development NODE_OPTIONS='--experimental-specifier-resolution=node' node --loader ts-node/esm src/index.ts` and confirmed `curl http://localhost:8080/` returned 200 before running endpoint tests.

---

### [x] Task C2: Run Project Lint/Build

**Files:**
- Whole frontend project

**Step 1:** From `apps/frontend`, run `npm install` (if new deps were added) and `npm run lint`.

**Step 2:** Run `npm run build` to ensure the new files compile with Next.js.

**Step 3:** Document any outstanding TODOs (e.g., waiting on backend) in the PR/plan.

---

### [x] Task C3: Manual `/trading` UI Verification

**Files:**
- `src/pages/trading.tsx`

**Step 1:** Start dev server `npm run dev` and hit `http://localhost:3000/trading` (curl or browser).

**Step 2:** Walk through the flow: set symbol/size/timeframe, click each button in order. Confirm panel states update (loading/ready/error) according to store logic. Ensure live-mode checkboxes appear only when environment is “live”.

**Step 3:** Visit `/dashboard` to ensure no regressions in the main control surface.

---

## Section D – Backend Trading Flow Integration (Source of Truth: `apps/backend`)

### [x] Task D1: Backend Docs & Services Integrated

**Files:** `apps/backend/docs/multi_agent_backend_implementation.md`, `src/services/multiAgent/*`, `src/services/risk/*`, `src/services/portfolio/*`, `src/services/trading/TradeApprovalService.ts`

**Status:** Files live in repo; lint/build pass.

---

### [x] Task D2: TradingFlow API Plugin Registered

**Files:** `apps/backend/src/api/tradingFlow.ts`, `apps/backend/src/index.ts`

**Status:** Plugin registered with Fastify.

---

### [x] Task D3: Backend Endpoint Verification

**Notes:** With backend running at `http://localhost:8080`, verified:
`curl -X POST "$API_BASE/api/agents/run-analysis" ...`, `curl $API_BASE/api/risk/profiles`, `curl $API_BASE/api/portfolio/positions`, `curl $API_BASE/api/system/live-trading-status` – all returned 200 + stub JSON matching `tradingFlowApi`.

---

**Plan complete and saved to `apps/frontend/docs/plans/2025-02-14-multi-agent-trading-frontend.md`. Two execution options:**

1. Subagent-Driven (this session) – use superpowers:subagent-driven-development; I can run each task sequentially here.
2. Parallel Session – spin a dedicated session using superpowers:executing-plans for implementation.

Let me know which execution path you prefer.


---

## 3. Multi‑Agent Trading Backend Implementation Plan

> Source: `apps/backend/docs/multi_agent_backend_implementation.md`

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
