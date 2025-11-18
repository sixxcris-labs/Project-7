# PROJECT7_V3 – Final Upgrade Gate Plan (0–5)

This document replaces earlier upgrade notes and is now the **single source of truth** for finishing the PROJECT7_V3 merge. It merges the existing V3 apps (`apps/backend`, `apps/frontend`, `services/quant`) with the best parts of the legacy project (`legacy_original_project7_main/Project7_CryptoBot_Dev/*`) by walking through six concrete gates. Do **not** skip gates.

Use these references for intent/details only:

- Product/UX narrative: `docs/GPTPRO_source/GPTPRO/Comprehensive summary request.pdf`
- Legacy Polygon quotes guide: `legacy_original_project7_main/Project7_CryptoBot_Dev/docs/polygon-live-stream.md`

---

## 0. Define “Done” Before You Start

**Done for this merge =**

1. **Paper‑trading SaaS fully working** with V3 + selected legacy improvements
   - `/trading`: Run Agents → Plan → Risk → Approve Paper → Portfolio updates.
   - `/dashboard`: upgraded UI, reading real backend data (even if minimal).
2. **Quant microservice** stable and wired to the backend via `MultiAgentService`.
3. **Single trading API** at `tradingFlow.ts` (no duplicate routes).
4. **Legacy pulled in only when it clearly improves UX or logic**, no duplicate flows.

Live trading, Polygon streaming, LLM orchestration, Risk Sentinel, and SaaS hardening are **explicitly out of scope for this pass**. Those live in the **Future Backlog** at Gate 5.

---

## Gate 0 – Make V3 Green Before Touching Legacy

**Goal:** Vanilla V3 works end‑to‑end for paper trading; build/test are green. No legacy, no extras.

### 0.1 Workspace & tooling

From repo root (`PROJECT7_V3_complete`):

- [x] `node -v` → Node 18+
- [x] `python --version` → Python 3.10+
- [x] `npm install`

Env file:

- [x] Copy `./.env.example` → `./.env`
- [x] Set:

  ```env
  NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
  PORT=3001
  PAPER_DATA_PATH=./data/paper_state.json
  QUANT_API_URL=http://localhost:8100
  BINANCE_TRADING_ENABLED=false
  ```

Sanity build (whole monorepo):

- [x] `npm run build`
- [x] `apps/backend` builds clean
- [x] `apps/frontend` builds clean

Fix everything here before changing code.

### 0.2 Quant microservice online

In `services/quant`:

- [x] Create/activate virtualenv
- [x] `pip install -r requirements.txt`
- [x] `uvicorn app:app --host 0.0.0.0 --port 8100 --reload` (verified via FastAPI `TestClient`)

Smoke-test:

- [x] `POST /analysis` with `{ "symbol": "BTCUSDT", "timeframe": "1h", "capital": 100000 }`
- [x] `POST /trade-plan/generate` with `{ "analysisId": "demo-1", "symbol": "BTCUSDT", "timeframe": "1h", "capital": 100000 }`

Accept if:

- `/analysis` → `{ summary, signals: [{ name, value, weight }] }`
- `/trade-plan/generate` → `entries`, `exitRules`, `meta.lastPrice` present

### 0.3 Backend – V3 paper flow only

In `apps/backend`:

- [ ] `npm install`
- [ ] `npm run build`
- [ ] `npm run dev`

`apps/backend/src/routes/tradingFlow.ts` should expose **only**:

- `POST /api/agents/run-analysis`
- `POST /api/agents/generate-trade-plan`
- `POST /api/risk/validate-trade-plan`
- `POST /api/trades/approve-paper`
- `GET  /api/portfolio`

Manual smoke test:

- [ ] `GET  http://localhost:3001/health`
- [ ] `POST http://localhost:3001/api/agents/run-analysis`
- [ ] `POST http://localhost:3001/api/agents/generate-trade-plan`
- [ ] `POST http://localhost:3001/api/risk/validate-trade-plan`
- [ ] `POST http://localhost:3001/api/trades/approve-paper`
- [ ] `GET  http://localhost:3001/api/portfolio`

### 0.4 Frontend – V3 paper flow only

In `apps/frontend`:

- [ ] `npm install`
- [ ] `npm run dev`

Check:

- [ ] `/dashboard` loads (even if simple)
- [ ] `/trading` shows the four-step flow (Run Agents → Plan → Risk → Approve Paper)

Run the flow once and confirm analysis/plan/risk/approval JSON renders and portfolio endpoint responds.

> **Gate 0 exit condition:** Pure V3 paper trading works end‑to‑end; builds are green; no legacy code involved.

---

## Gate 1 – Lock V3 Backend Contracts (Still V3-only)

**Goal:** Lock trading API contracts and persistence so legacy can attach safely.

### 1.1 Zod contracts at `tradingFlow.ts`

- [x] All endpoints validated with zod schemas.
- [x] Schemas centralized for reuse.
- [x] Add small tests or scripts that hit each endpoint with sample payloads (shape validation only).

### 1.2 PaperStore sanity

- [x] `analyses`, `plans`, `riskChecks`, `approvals` maps exist.
- [x] `portfolio` contains `equity`, `positions`, `history`.
- [x] `guardrails` includes at least `killSwitch`, `liveEnabled`.
- [ ] Optional helper: `listTrades()` to read `portfolio.history` for future APIs.

### 1.3 Quant integration via `MultiAgentService`

- [x] `runAnalysis` POSTs to `${QUANT_API_URL}/analysis`.
- [x] `generatePlan` POSTs to `${QUANT_API_URL}/trade-plan/generate`.
- [x] Fallback behavior exists when quant is down.

> **Gate 1 exit condition:** Backend contracts are locked with zod, PaperStore shape is stable, and `MultiAgentService` is the sole caller of the quant API.

---

## Gate 2 – Frontend Merge (Minimal UX Upgrade)

**Goal:** Upgrade UX using legacy components **without** inventing new flows or APIs.

### 2.1 Create `legacy-ui` staging area

- [ ] Under `apps/frontend/src`, create `legacy-ui/`.
- [ ] From legacy frontend, copy only components that clearly improve UX:
  - Buttons/primitives (`components/ui/Button.tsx`)
  - Dashboard visuals (`components/dashboard/*`)
  - Trading visuals that match the existing four-step flow
- [ ] Fix imports until `npm run dev` is clean (no new stores/routes).

### 2.2 Upgrade `/dashboard`

- [ ] Wrap with existing `Layout`.
- [ ] Replace basic content with `legacy-ui` cards approximating the CryptoBot control surface.
- [ ] Wire to existing backend data only (health, portfolio snapshot, simple stats).

### 2.3 Upgrade `/trading`

- [ ] Keep store logic (`tradingSessionStore.ts`) and existing APIs.
- [ ] Replace `<pre>` JSON with structured cards/panels from `legacy-ui`.
- [ ] After Gate 5 backlog items land, panels can grow (portfolio/history widgets).

> **Gate 2 exit condition:** Frontend still hits the same APIs, but `/dashboard` and `/trading` now use legacy-inspired components for better UX with no new backend dependencies.

---

## Gate 3 – Backend Merge (Market Data & Execution Skeleton)

**Goal:** Bring in only backend pieces that support the current UX: simple live quotes and a safe execution skeleton behind hard off-switches.

### 3.1 Inventory legacy backend once

From `legacy_original_project7_main/Project7_CryptoBot_Dev/apps/backend`:

- [ ] Identify market data services (e.g., Polygon/WebSocket clients).
- [ ] Identify execution service (`TradingService`).
- [ ] Identify guardrails/auth modules.
- [ ] Decide ahead of time what *not* to port (duplicate routes, unused logic).

### 3.2 Market data service (optional but self-contained)

If you want live quotes in this pass:

- [ ] Create `apps/backend/src/services/marketData/MarketDataService.ts` using legacy code as reference.
- [ ] Expose `GET /api/market-data/quotes?symbols=...`.
- [ ] Use the legacy Polygon guide (`docs/polygon-live-stream.md`) if enabling WebSocket streaming (env vars, reconnect logic).

Use this endpoint only to power small “live quotes” widgets on `/dashboard`.

### 3.3 Execution skeleton under hard off-switch

- [ ] Port execution logic to `apps/backend/src/services/execution/TradingService.ts` (no direct route).
- [ ] Create `LiveTradeApprovalService` that:
  - Checks `BINANCE_TRADING_ENABLED`.
  - Checks `guardrails` (`killSwitch`, `liveEnabled`).
  - Never executes if `BINANCE_TRADING_ENABLED=false`.
- [ ] Wire `POST /api/trades/approve-live` inside `tradingFlow.ts`, but keep it behind config flags and a minimal UI (or none).

Rules:

- No extra trading routes beyond those in `tradingFlow.ts`.
- No parallel “legacy trading” endpoints.

> **Gate 3 exit condition:** Market data and a safe execution skeleton exist, but paper mode remains the only active path (`BINANCE_TRADING_ENABLED=false` by default).

---

## Gate 4 – Advanced Quant (Legacy Borrowing, Same Contracts)

**Goal:** Make quant smarter using legacy logic without changing any backend/frontend contracts.

### 4.1 Scan legacy quant once

In `legacy_original_project7_main/Project7_CryptoBot_Dev/services/quant`:

- [ ] Identify well-tested strategies and policy/config files.
- [ ] Mark experimental/unclear modules as “do not port”.

### 4.2 Keep V3 FastAPI surface stable

In `services/quant/app.py`:

- [ ] Keep routes `/analysis` and `/trade-plan/generate`.
- [ ] Swap internals only (call legacy strategy modules, apply policy logic for sizing/weighting).

### 4.3 Preserve contracts for backend

- [ ] `/analysis` still returns `{ summary, signals: [{ name, value, weight }] }`.
- [ ] `/trade-plan/generate` still returns `entries`, `exitRules`, `meta.lastPrice`.
- [ ] Re-run Gate 0.2 / Gate 1 tests to confirm nothing broke.

> **Gate 4 exit condition:** Backend and frontend are unaware anything changed; they simply receive richer, more realistic analysis/plan payloads.

---

## Gate 5 – Stop. Everything Else Is Future Backlog.

**Goal:** Declare this merge “done”, then capture everything else cleanly so scope doesn’t creep.

At this point you have:

- Clean V3 core + selected legacy UI.
- Coherent multi-agent paper flow.
- Optional market data and execution skeleton.
- Optional smarter quant internals.

**Do not start** on the items below until you intentionally move beyond “merge done”. Instead, track them (and reference docs) in `docs/FUTURE_BACKLOG.md`.

### 5.1 Risk profiles & user settings

- Backend:
  - `GET /api/risk/profiles`
  - `GET /api/risk/user-settings`
  - `POST /api/risk/user-settings`
- Frontend:
  - UI to select/persist risk profiles per user/session.

### 5.2 Trade history endpoint & UI

- Backend:
  - `GET /api/history/trades` backed by `PaperStore.portfolio.history`.
- Frontend:
  - Show recent trades on `/trading` and/or `/dashboard`.

### 5.3 Live trading switch & approvals (real money)

- Backend:
  - `GET /api/system/live-trading-status` using `guardrails.liveEnabled`.
  - `POST /api/trades/approve-live` that checks risk + guardrails and only executes when `BINANCE_TRADING_ENABLED=true`.
- Frontend:
  - Live-mode toggle and approval UI with extra confirmation.

### 5.4 Risk Sentinel microservice

- New service: `services/risk-sentinel` (FastAPI).
- Node client: `apps/backend/src/services/risk/RiskSentinelClient.ts`.
- Used only in live approvals (paper stays local).

### 5.5 LLM orchestration & SaaS hardening

- Replace stubs in `MultiAgentService` with LangGraph/LLM pipelines (same response shapes).
- Add auth (JWT/OAuth2), multi-tenant persistence (database instead of JSON), CI/CD, monitoring, and observability.
- Integrate Polygon streaming more deeply if desired (beyond Gate 3’s minimal widget).

> **Gate 5 exit condition:** You have a clear, limited definition of “done” for this merge, plus a clean backlog for everything else. The workspace is stable, tests are green, and you can iterate from a solid paper-trading foundation.
