# PROJECT7_V3 – Final Upgrades Plan

This document consolidates all implementation plans from the legacy docs and maps them onto the **current V3 repo layout**:

- Root workspace: `apps/backend`, `apps/frontend`
- Quant microservice: `services/quant`
- Paper trading store and flow: `apps/backend/src/services/*`, `apps/backend/src/routes/tradingFlow.ts`

It assumes you want a **multi‑agent trading pipeline** with:

- Frontend `/dashboard` (overview) and `/trading` (agents → plan → risk → approvals).
- Backend REST API implementing the trading flow and risk sentinel.
- A quant service that provides stubbed but structured analysis/plan outputs (already present).

The steps below are ordered for implementation.

---

## 1. Repo & Runtime Pre‑flight

1. Confirm Node and Python:
   - `node -v` (LTS 18+)
   - `python --version` (3.10+)
2. From repo root (`PROJECT7_V3_complete`), install JS deps:
   - `npm install`
3. Verify workspaces build:
   - `npm run build`
4. Copy `.env.example` to `.env` and adjust:
   - `NEXT_PUBLIC_BACKEND_URL=http://localhost:3001`
   - `PORT=3001`
   - `PAPER_DATA_PATH=./data/paper_state.json`
   - `QUANT_API_URL=http://localhost:8100`
   - `BINANCE_TRADING_ENABLED=false` (keep live trading disabled for now).

Outcome: monorepo boots, env is configured, and no base build errors.

---

## 2. Quant Microservice – Verify & Integrate

Files:
- `services/quant/app.py`
- `services/quant/requirements.txt`

Steps:
1. Create/activate a virtualenv in `services/quant` and install:
   - `pip install -r requirements.txt`
2. Start the service:
   - `uvicorn app:app --host 0.0.0.0 --port 8100 --reload`
3. Smoke‑test endpoints:
   - `POST /analysis` with `{ "symbol": "BTCUSDT", "timeframe": "1h", "capital": 100000 }`
   - `POST /trade-plan/generate` with `{ "analysisId": "demo-1", "symbol": "BTCUSDT", "timeframe": "1h", "capital": 100000 }`
4. Confirm responses match backend expectations:
   - `analysis` returns `{ summary, signals: [{ name, value, weight }] }`
   - `trade-plan/generate` returns a plan with `entries`, `exitRules`, and `meta.lastPrice`.

Outcome: quant service is live and can be called by the backend’s `MultiAgentService`.

---

## 3. Backend – Multi‑Agent Trading Flow

Files (V3 already contains a minimal implementation):
- `apps/backend/src/index.ts`
- `apps/backend/src/routes/tradingFlow.ts`
- `apps/backend/src/services/multiAgent/MultiAgentService.ts`
- `apps/backend/src/services/risk/RiskService.ts`
- `apps/backend/src/services/trading/TradeApprovalService.ts`
- `apps/backend/src/services/store/PaperStore.ts`
- `apps/backend/src/types.ts`

### 3.1 Align With Legacy Backend Plan

Source plans:
- `legacy_original_project7_main/Project7_CryptoBot_Dev/apps/backend/docs/multi_agent_backend_implementation.md`
- `legacy_original_project7_main/Project7_CryptoBot_Dev/PROJECT7_CONSOLIDATED_PLAN.md` (backend sections)

Steps:
1. Compare V3 routes to planned ones:
   - Already implemented:  
     - `POST /api/agents/run-analysis`  
     - `POST /api/agents/generate-trade-plan`  
     - `POST /api/risk/validate-trade-plan`  
     - `POST /api/trades/approve-paper`  
     - `GET  /api/portfolio`
   - Planned but **not yet implemented** in V3:
     - `GET  /api/risk/profiles`
     - `GET  /api/risk/user-settings`
     - `POST /api/risk/user-settings`
     - `POST /api/trades/approve-live`
     - `GET  /api/history/trades`
     - `GET  /api/system/live-trading-status`
2. Decide scope for V3:
   - Keep V3 focused on **paper trading**, portfolio, and basic risk checks.
   - Defer full live trading endpoints (`approve-live`, live status) until later unless required.

### 3.2 Backend Implementation Order

1. **State & Types (PaperStore)**
   - Verify `PaperStore.ts` covers:
     - Analyses, plans, riskChecks, approvals
     - Portfolio equity, positions, history
     - Guardrails (`killSwitch`, `liveEnabled`)
   - If you want history endpoints later, extend `PaperStore` with helpers:
     - `listTrades()` to read `portfolio.history`
2. **MultiAgentService + Quant Integration**
   - Confirm `MultiAgentService.runAnalysis` posts to `${QUANT_API_URL}/analysis`.
   - Confirm `MultiAgentService.generatePlan` posts to `${QUANT_API_URL}/trade-plan/generate`.
   - Keep existing fallback behavior (stub analysis/plan when quant is down).
3. **RiskService**
   - Keep current validation logic:
     - Enforce `maxPositionPct` and `maxDailyLossPct` against portfolio equity.
     - Enforce `requireKillSwitch` against `guardrails.killSwitch`.
   - Optionally add `getProfiles()` with three profiles:
     - `risky`, `neutral`, `conservative`.
4. **TradeApprovalService**
   - Keep `approvePaper` behavior:
     - Compute quantity from `plan.capital * qtyPct / price`.
     - Append trade into `PaperStore` history.
   - Do **not** wire real exchange execution; paper mode only.
5. **Route Layer – tradingFlow**
   - Confirm `apps/backend/src/routes/tradingFlow.ts`:
     - Parses and validates using `zod` schemas.
     - Persists analysis/plan/riskCheck to `PaperStore`.
     - Blocks approve‑paper if risk check missing or not `ok`.
   - Do **not** add duplicate routes; extend this module only when needed.

### 3.3 Backend Runtime Verification

1. From `apps/backend`:
   - `npm install` (if not already)
   - `npm run build`
   - `npm run start` (or `npm run dev` during development)
2. Smoke‑test:
   - `GET  http://localhost:3001/health`
   - `POST http://localhost:3001/api/agents/run-analysis`
   - `POST http://localhost:3001/api/agents/generate-trade-plan`
   - `POST http://localhost:3001/api/risk/validate-trade-plan`
   - `POST http://localhost:3001/api/trades/approve-paper`
   - `GET  http://localhost:3001/api/portfolio`

Outcome: backend delivers a full **paper trading** multi‑agent pipeline aligned to the legacy plan, minus live‑trading endpoints.

---

## 4. Frontend – Trading Dashboard & Flow

Files (V3 implementation):
- `apps/frontend/src/pages/dashboard.tsx`
- `apps/frontend/src/pages/trading.tsx`
- `apps/frontend/src/components/Layout.tsx`
- `apps/frontend/src/lib/tradingFlowApi.ts`
- `apps/frontend/src/stores/tradingSessionStore.ts`
- `apps/frontend/src/styles/globals.css`

Source plans:
- `legacy_original_project7_main/Project7_CryptoBot_Dev/apps/frontend/docs/trading_precheck_and_plan.md`
- `legacy_original_project7_main/Project7_CryptoBot_Dev/apps/frontend/docs/plans/2025-02-14-multi-agent-trading-frontend.md`
- `docs/GPTPRO_source/GPTPRO/PROJECT7_CONSOLIDATED_PLAN.md` (frontend sections)

### 4.1 Map Plan → V3 Reality

Planned:
- `/dashboard` = CryptoBot control surface.
- `/trading` = multi‑agent flow with:
  - Run analysis
  - Generate plan
  - Validate risk
  - Approve paper
  - Approve live (optional)
  - Portfolio & recent trades row.

Implemented in V3:
- `dashboard.tsx` – simpler dashboard (no full glassmorphism UI yet).
- `trading.tsx` – linear four‑step flow:
  - Run Agents → Plan → Risk → Approve Paper.
- `tradingSessionStore.ts` – Zustand store with:
  - `runAgents`, `generatePlan`, `validateRisk`, `approvePaper`, `reset`.
- `tradingFlowApi.ts` – FE client for:
  - `/api/agents/run-analysis`
  - `/api/agents/generate-trade-plan`
  - `/api/risk/validate-trade-plan`
  - `/api/trades/approve-paper`
  - `/api/portfolio`, `/api/live/status` (live status backend route still TODO).

Decision:
- Treat V3 as the **minimal implementation** of the legacy frontend plan.
- Future upgrades can:
  - Enhance `/dashboard` UI to match the original CryptoBot design.
  - Add positions/history widgets on `/trading` using `/api/portfolio` and (later) history endpoints.

### 4.2 Frontend Implementation Order

1. **Env Wiring**
   - Ensure `.env` has `NEXT_PUBLIC_BACKEND_URL` pointing to backend.
2. **API Client Review**
   - Confirm `tradingFlowApi` base URL and paths align with backend:
     - Update or remove `liveStatus` call until backend `/api/live/status` exists.
3. **Zustand Store Behavior**
   - Keep current state machine (sequential steps).
   - Optionally:
     - Add error handling state and UI to show failures from backend.
4. **UI Polish**
   - Evolve `dashboard.tsx` toward the CryptoBot Control Surface design (optional, purely visual).
   - On `trading.tsx`, add:
     - A small portfolio summary using `tradingFlowApi.portfolio()`.
     - Render `approval` result when a paper trade is approved.
5. **Navigation**
   - If you later add a more complex layout, keep `/dashboard` and `/trading` as distinct routes.

### 4.3 Frontend Runtime Verification

1. From `apps/frontend`:
   - `npm install` (if not already)
   - `npm run dev`
2. Navigate to:
   - `http://localhost:3000/dashboard` – confirm dashboard loads.
   - `http://localhost:3000/trading` – walk the full flow:
     - Run Agents → Generate Plan → Validate Risk → Approve Paper.
3. Confirm:
   - JSON panes show analysis, plan, risk result, and approval.
   - No unhandled exceptions in browser console or terminal.

Outcome: frontend delivers the multi‑agent trading flow described in the legacy plans, adapted to the simplified V3 backend API.

---

## 5. Optional Future Upgrades (From Legacy Plans)

These align with the more advanced legacy docs but are **not yet implemented** in V3:

1. **Risk Profiles & User Settings**
   - Add `/api/risk/profiles` and `/api/risk/user-settings` endpoints.
   - Persist per‑user risk settings instead of passing ad‑hoc profiles from the frontend.
2. **Trade History Endpoint & UI**
   - Add `/api/history/trades` backed by `PaperStore.portfolio.history`.
   - Show recent trades on `/trading` and/or `/dashboard`.
3. **Live Trading Switch & Approvals**
   - Implement `/api/system/live-trading-status` using `guardrails.liveEnabled`.
   - Add `/api/trades/approve-live` that:
     - Checks risk/guardrails.
     - Sends orders to a real exchange only when `BINANCE_TRADING_ENABLED=true`.
   - Update frontend to show live approval UI with confirmation checkboxes.
4. **LLM‑Based Multi‑Agent Orchestration**
   - Replace quant stubs with a LangGraph/LLM pipeline inside `MultiAgentService`.
   - Keep existing response shape for frontend compatibility.

These can be implemented incrementally after the core paper‑trading pipeline is stable.

