# PROJECT7_V3 – Final Upgrades & Merge Plan

This document is the **single source of truth** for finishing and improving the PROJECT7_V3 multi‑agent crypto stack. It merges:

- The current V3 apps:
  - Backend: `apps/backend`
  - Frontend: `apps/frontend`
  - Quant microservice: `services/quant`
- The best parts of the legacy project:
  - `legacy_original_project7_main/Project7_CryptoBot_Dev/*`

The goal is a **rich multi‑agent trading SaaS**:

- Paper trading as the safe baseline.
- Optional live trading behind strict risk gating.
- A polished dashboard + trading workspace.

Additional references (read‑only, for intent and detail only):

- Product/UX narrative: `docs/GPTPRO_source/GPTPRO/Comprehensive summary request.pdf`
- Legacy live quotes: `legacy_original_project7_main/Project7_CryptoBot_Dev/docs/polygon-live-stream.md`

Use these for context, but implement using this plan.

---

## Priority 0 – Global Precheck (Must Pass Before Coding)

From repo root: `c:\Users\CM996874\Downloads\PROJECT7_V3_complete`.

1. **Tooling**
   - `node -v` → Node 18+ recommended.
   - `python --version` → Python 3.10+ recommended.
2. **Install JS dependencies**
   - From root: `npm install`
3. **Environment file**
   - Copy `./.env.example` → `./.env`.
   - In `./.env` set:
     - `NEXT_PUBLIC_BACKEND_URL=http://localhost:3001`
     - `PORT=3001`
     - `PAPER_DATA_PATH=./data/paper_state.json`
     - `QUANT_API_URL=http://localhost:8100`
     - `BINANCE_TRADING_ENABLED=false`
4. **Workspace build sanity**
   - From root: `npm run build`
   - Confirm:
     - `apps/backend` builds.
     - `apps/frontend` builds.

Fix failures here before changing code.

---

## Priority 1 – Quant Microservice (`services/quant`)

Files:

- `services/quant/app.py`
- `services/quant/requirements.txt`

Steps:

1. In `services/quant`:
   - Create/activate a virtualenv.
   - Install: `pip install -r requirements.txt`.
2. Start the service:
   - `uvicorn app:app --host 0.0.0.0 --port 8100 --reload`
3. Smoke‑test:
   - `POST http://localhost:8100/analysis` with  
     `{ "symbol": "BTCUSDT", "timeframe": "1h", "capital": 100000 }`
   - `POST http://localhost:8100/trade-plan/generate` with  
     `{ "analysisId": "demo-1", "symbol": "BTCUSDT", "timeframe": "1h", "capital": 100000 }`
4. Confirm responses match backend expectations:
   - `/analysis` → `{ summary, signals: [{ name, value, weight }] }`.
   - `/trade-plan/generate` → plan with `entries`, `exitRules`, `meta.lastPrice`.

Outcome: quant service is live and ready for backend integration.

---

## Priority 2 – Backend Trading Flow (`apps/backend`)

Core files:

- `apps/backend/src/index.ts`
- `apps/backend/src/routes/tradingFlow.ts`
- `apps/backend/src/services/multiAgent/MultiAgentService.ts`
- `apps/backend/src/services/risk/RiskService.ts`
- `apps/backend/src/services/trading/TradeApprovalService.ts`
- `apps/backend/src/services/store/PaperStore.ts`
- `apps/backend/src/types.ts`

### 2.1 Implemented vs Planned Endpoints

Ensure these exist in `apps/backend/src/routes/tradingFlow.ts`:

- Implemented in V3:
  - `POST /api/agents/run-analysis`
  - `POST /api/agents/generate-trade-plan`
  - `POST /api/risk/validate-trade-plan`
  - `POST /api/trades/approve-paper`
  - `GET  /api/portfolio`
- Planned (later phases):
  - `GET  /api/risk/profiles`
  - `GET  /api/risk/user-settings`
  - `POST /api/risk/user-settings`
  - `POST /api/trades/approve-live`
  - `GET  /api/history/trades`
  - `GET  /api/system/live-trading-status`

Keep these as the primary trading API; extend this module instead of adding parallel routes.

### 2.2 Backend Implementation Order

1. **PaperStore & types**
   - In `apps/backend/src/services/store/PaperStore.ts` verify:
     - `analyses`, `plans`, `riskChecks`, `approvals` maps.
     - `portfolio` with `equity`, `positions`, `history`.
     - `guardrails` with `killSwitch`, `liveEnabled`.
   - For future history APIs, add helpers (e.g. `listTrades()` reading `portfolio.history`).

2. **MultiAgentService ↔ quant integration**
   - In `apps/backend/src/services/multiAgent/MultiAgentService.ts` ensure:
     - `runAnalysis` POSTs to `${QUANT_API_URL}/analysis`.
     - `generatePlan` POSTs to `${QUANT_API_URL}/trade-plan/generate`.
   - Retain fallback behavior when quant is unavailable.

3. **RiskService rules**
   - In `apps/backend/src/services/risk/RiskService.ts` confirm:
     - Planned notional ≤ `maxPositionPct * portfolio.equity`.
     - Estimated loss ≤ `maxDailyLossPct * portfolio.equity`.
     - `requireKillSwitch` enforces `guardrails.killSwitch`.
   - Optionally add `getProfiles()` with three presets:
     - `risky`, `neutral`, `conservative`.

4. **TradeApprovalService**
   - In `apps/backend/src/services/trading/TradeApprovalService.ts`:
     - Compute notional = `plan.capital * qtyPct`.
     - Compute `qty = notional / price`.
     - Append trade via `appendTrade` in `PaperStore.ts`.
   - This stays paper‑only; live execution comes later.

5. **Route wiring – `tradingFlow`**
   - In `apps/backend/src/routes/tradingFlow.ts` ensure:
     - Request bodies are validated with `zod`.
     - `PaperStore` helpers persist analysis, plan, risk checks.
     - `approve-paper` rejects when risk check missing or `status !== 'ok'`.

### 2.3 Backend Runtime Verification

From `apps/backend`:

1. `npm install` (if needed).
2. `npm run build`.
3. `npm run start` (or `npm run dev`).
4. Verify endpoints:
   - `GET  http://localhost:3001/health`
   - `POST http://localhost:3001/api/agents/run-analysis`
   - `POST http://localhost:3001/api/agents/generate-trade-plan`
   - `POST http://localhost:3001/api/risk/validate-trade-plan`
   - `POST http://localhost:3001/api/trades/approve-paper`
   - `GET  http://localhost:3001/api/portfolio`

Outcome: backend exposes a coherent paper‑trading multi‑agent pipeline.

---

## Priority 3 – Frontend Trading Dashboard & Flow (`apps/frontend`)

Files:

- `apps/frontend/src/pages/index.tsx`
- `apps/frontend/src/pages/dashboard.tsx`
- `apps/frontend/src/pages/trading.tsx`
- `apps/frontend/src/pages/_app.tsx`
- `apps/frontend/src/components/Layout.tsx`
- `apps/frontend/src/lib/tradingFlowApi.ts`
- `apps/frontend/src/stores/tradingSessionStore.ts`
- `apps/frontend/src/styles/globals.css`

### 3.1 Current Behavior vs Target

- Current:
  - `/dashboard` – simple dashboard.
  - `/trading` – four steps: Run Agents → Plan → Risk → Approve Paper (JSON panels).
  - `tradingSessionStore.ts` orchestrates the flow.
  - `tradingFlowApi.ts` calls backend APIs.
- Target:
  - `/dashboard` – CryptoBot‑style control surface (glassmorphism UI).
  - `/trading` – rich multi‑agent workspace with panels, portfolio widget, and (later) trade history.

### 3.2 Frontend Implementation Order

1. **Env wiring**
   - Ensure `./.env` has `NEXT_PUBLIC_BACKEND_URL=http://localhost:3001` (or your backend URL).

2. **API client sanity**
   - In `apps/frontend/src/lib/tradingFlowApi.ts`, verify routes match backend.
   - Temporarily remove or stub `liveStatus` until `/api/system/live-trading-status` exists.

3. **Store behavior**
   - Keep sequential logic in `apps/frontend/src/stores/tradingSessionStore.ts`.
   - Optionally add:
     - Error state + messages on failed requests.
     - Loading state surfaced into the UI.

4. **UI polish**
   - In `apps/frontend/src/pages/trading.tsx`:
     - Show `approval` details after paper trade approval.
     - Fetch `tradingFlowApi.portfolio()` and render a small portfolio summary.
   - In `apps/frontend/src/pages/dashboard.tsx`:
     - Replace basic content with upgraded layout/components from the merge plan (see below).

5. **Navigation**
   - Confirm the main layout exposes links to:
     - `/dashboard`
     - `/trading`

### 3.3 Frontend Runtime Verification

From `apps/frontend`:

1. `npm install` (if needed).
2. `npm run dev`.
3. Visit:
   - `http://localhost:3000/dashboard`
   - `http://localhost:3000/trading`
4. On `/trading` run:
   - Run Agents → Generate Plan → Validate Risk → Approve Paper.
5. Confirm:
   - Panels or JSON show analysis, plan, risk, approval.
   - No unhandled errors in console or terminal.

Outcome: the V3 frontend exposes the full paper‑trading flow.

---

## Priority 4 – Optional Future Upgrades (Beyond Paper Trading)

These are not required for paper‑trading but are valuable improvements:

1. **Risk profiles & user settings**
   - Backend:
     - `GET /api/risk/profiles`
     - `GET /api/risk/user-settings`
     - `POST /api/risk/user-settings`
   - Frontend:
     - UI to select and persist risk profiles per user/session.

2. **Trade history endpoint & UI**
   - Backend:
     - `GET /api/history/trades` backed by `PaperStore.portfolio.history`.
   - Frontend:
     - Show recent trades on `/trading` and/or `/dashboard`.

3. **Live trading switch & approvals**
   - Backend:
     - `GET /api/system/live-trading-status` using `guardrails.liveEnabled`.
     - `POST /api/trades/approve-live` that:
       - Checks risk and guardrails.
       - Sends orders only when `BINANCE_TRADING_ENABLED=true`.
   - Frontend:
     - Live‑mode toggle and approval UI with confirmation checkboxes.

4. **LLM‑based multi‑agent orchestration**
   - Replace fallback logic in `MultiAgentService` with a LangGraph/LLM pipeline.
   - Keep response shapes stable for the frontend.

5. **Live quotes & Polygon integration (legacy‑inspired)**
   - Env (in `.env` and backend env if separate):
     - `POLYGON_LIVE_ENABLED=true`
     - `POLYGON_API_KEY=your_key_here`
     - `POLYGON_STREAM_URL=wss://socket.polygon.io/crypto`
     - `POLYGON_SYMBOLS=BTC-USD,ETH-USD,SOL-USD,MATIC-USD` (example)
     - `POLYGON_RECONNECT_MIN_MS=5000`
     - `POLYGON_RECONNECT_MAX_MS=60000`
   - Backend:
     - Add a WebSocket client service for Polygon similar to the legacy guide in `polygon-live-stream.md`.
     - Expose `GET /api/market-data/quotes?symbols=...` returning snapshots.
   - Frontend:
     - Use a `useLiveQuotes`‑style hook to hydrate dashboard cards with streaming mid prices.

---

## Merge Plan – Legacy + V3 + Advanced Quant/Risk

The phases below describe how to merge **legacy backend/frontend** and advanced quant/risk into V3, always choosing improvements over redundancy.

### Phase 0 – Choose Hosts

- Backend host: V3 `apps/backend`.
- Frontend host: V3 `apps/frontend`.
- Services:
  - Keep and extend `services/quant`.
  - Add a new `services/risk-sentinel` for live risk gating.

### Phase 1 – Frontend Merge & Dashboard Upgrade

1. **Inventory legacy UI**
   - Inspect `legacy_original_project7_main/Project7_CryptoBot_Dev/apps/frontend`:
     - Layout/nav: `src/components/SideNav.tsx`, layout shells.
     - Dashboard visuals: `src/pages/dashboard.tsx`, `src/components/dashboard/*`.
     - UI primitives: `src/components/ui/Button.tsx`.
     - Trading dashboard: `src/components/trading/TradingDashboard.tsx` (if present).

2. **Stage legacy UI into V3**
   - Under `apps/frontend/src`, create `legacy-ui/`.
   - Copy in only components that clearly improve UX:
     - `components/ui/Button.tsx`.
     - `components/dashboard/DataPanel.tsx` and related dashboard pieces.
     - Any trading components that enhance the `/trading` experience.
   - Fix imports to compile in V3.

3. **Upgrade `/dashboard`**
   - Refactor `apps/frontend/src/pages/dashboard.tsx` to:
     - Use `Layout` and `legacy-ui` components.
     - Approximate the CryptoBot control surface described in the PDF.
   - Keep data dependencies simple at first; wire real metrics later.

4. **Upgrade `/trading`**
   - Refactor `apps/frontend/src/pages/trading.tsx`:
     - Keep store logic (`tradingSessionStore.ts`) and API calls.
     - Replace raw `<pre>` panels with structured cards/panels from `legacy-ui`.
     - Add portfolio + (later) history widgets when backend endpoints exist.

5. **Skip non‑improvements**
   - Do not import legacy `_app.tsx`, routing, or global stores unless they clearly outperform V3 equivalents.

### Phase 2 – Backend Merge: Market Data & Execution

1. **Inventory legacy backend**
   - Check `legacy_original_project7_main/Project7_CryptoBot_Dev/apps/backend/src` for:
     - Market data services (Polygon/Binance).
     - Execution services (`TradingService`).
     - Guardrails/risk routes.
     - Auth/user layers.

2. **Keep `tradingFlow.ts` as orchestrator**
   - Continue to use `apps/backend/src/routes/tradingFlow.ts` for:
     - Analysis → plan → risk → approvals (paper + live).

3. **Add market data service**
   - Create `apps/backend/src/services/marketData/MarketDataService.ts` using legacy code as a reference.
   - Expose `GET /api/market-data/quotes?symbols=...`.
   - Use this endpoint to drive live quote widgets on the dashboard.

4. **Add execution under feature flags**
   - Port `TradingService` to `apps/backend/src/services/execution/TradingService.ts`.
   - Create `apps/backend/src/services/trading/LiveTradeApprovalService.ts` that:
     - Checks `BINANCE_TRADING_ENABLED` and `guardrails`.
     - Calls the Risk Sentinel (Phase 4) before executing.
   - Implement `POST /api/trades/approve-live` in `tradingFlow.ts` to delegate to `LiveTradeApprovalService`.

5. **Skip legacy duplicates**
   - Avoid copying legacy APIs that duplicate V3 trading routes without clear advantage.

### Phase 3 – Advanced Quant Engine

1. **Inventory legacy quant**
   - Scan `legacy_original_project7_main/Project7_CryptoBot_Dev/services/quant`:
     - Strategy modules.
     - Config files (e.g. `src/crypto_quant_ai/config/policy.yml`).
     - Datasets and utilities.

2. **Keep V3 quant API**
   - Preserve `services/quant/app.py` routes `/analysis` and `/trade-plan/generate`.
   - Replace the internal stub logic with:
     - Calls into legacy quant strategies.
     - Policy‑driven sizing and signal weighting.

3. **Preserve contracts for backend**
   - Ensure outputs still match the V3 expected shapes so `MultiAgentService` remains stable.

4. **Bring only tested strategies**
   - Port strategies that are well‑defined and add value; leave experiments behind.

### Phase 4 – Risk Sentinel Microservice

1. **Create `services/risk-sentinel`**
   - Structure:
     - `services/risk-sentinel/app.py`
     - `services/risk-sentinel/sentinel/risk_sentinel.py`
     - `services/risk-sentinel/sentinel/risk_config.yaml`
     - `services/risk-sentinel/requirements.txt`
   - Port the core of the legacy crypto safety module into `risk_sentinel.py`.
   - FastAPI endpoints:
     - `GET /health`
     - `POST /evaluate` with wallet/profile + order context.

2. **Add backend client**
   - New file: `apps/backend/src/services/risk/RiskSentinelClient.ts`.
   - Env: `RISK_SENTINEL_URL` (default `http://localhost:8082`).
   - Method: `evaluateOrderRisk(order, ctx)` → `{ decision, reason, adjustedQty?, appliedRules?, profileId? }`.

3. **Integrate into live approvals**
   - Paper:
     - Keep using `RiskService.validate` + `PaperStore.guardrails`.
   - Live:
     - In `tradingFlow.ts` `approve-live`:
       - Call `RiskSentinelClient.evaluateOrderRisk`.
       - Enforce `BLOCK`/`REDUCE`/`ALLOW` before `LiveTradeApprovalService`.

4. **Avoid duplicated rules**
   - Keep the complex rule logic in Python; Node delegates rather than reimplementing.

### Phase 5 – SaaS Hardening (High‑Value Only)

1. **Auth & multi‑tenancy**
   - Add auth (JWT/OAuth) to `apps/backend`.
   - Partition portfolio/plan/risk data per user or tenant; move persistence from JSON to DB.

2. **Persistent database**
   - Introduce a database (e.g. Postgres) for:
     - Analyses, trade plans, risk checks, approvals, portfolio.
   - Replace JSON persistence in `PaperStore.ts` with repositories.

3. **CI/CD & infra**
   - Dockerfiles for:
     - `apps/backend`, `apps/frontend`, `services/quant`, `services/risk-sentinel`.
   - CI pipelines and k8s/docker‑compose manifests for the V3 layout.

4. **Monitoring & security**
   - Add logging, metrics, and error tracking.
   - Add rate limiting and security headers to `apps/backend`.

Throughout all phases, use the PDF and legacy docs as design inspiration, but treat this file (`final upgrades.md`) plus the actual V3 code as the canonical implementation guide. 

