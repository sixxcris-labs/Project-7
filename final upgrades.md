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

- [x] Under `apps/frontend/src`, create `legacy-ui/`.
- [x] From legacy frontend, copy only components that clearly improve UX:
  - Buttons/primitives (`components/ui/Button.tsx`)
  - Dashboard visuals (`components/dashboard/*`)
  - Trading visuals that match the existing four-step flow
- [x] Fix imports until `npm run dev` is clean (no new stores/routes).

### 2.2 Upgrade `/dashboard`

- [x] Wrap with existing `Layout`.
- [x] Replace basic content with `legacy-ui` cards approximating the CryptoBot control surface.
- [x] Wire to existing backend data only (health, portfolio snapshot, simple stats).

### 2.3 Upgrade `/trading`

- [x] Keep store logic (`tradingSessionStore.ts`) and existing APIs.
- [x] Replace `<pre>` JSON with structured cards/panels from `legacy-ui`.
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

- [x] Create `apps/backend/src/services/marketData/MarketDataService.ts` using legacy code as reference.
- [x] Expose `GET /api/market-data/quotes?symbols=...`.
- [x] Use the legacy Polygon guide (`docs/polygon-live-stream.md`) if enabling WebSocket streaming (env vars, reconnect logic).

Use this endpoint only to power small "live quotes" widgets on `/dashboard`.

### 3.3 Execution skeleton under hard off-switch

- [x] Port execution logic to `apps/backend/src/services/execution/TradingService.ts` (no direct route).
- [x] Create `LiveTradeApprovalService` that:
  - Checks `BINANCE_TRADING_ENABLED`.
  - Checks `guardrails` (`killSwitch`, `liveEnabled`).
  - Never executes if `BINANCE_TRADING_ENABLED=false`.
- [x] Wire `POST /api/trades/approve-live` inside `tradingFlow.ts`, but keep it behind config flags and a minimal UI (or none).

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

- [x] Keep routes `/analysis` and `/trade-plan/generate`.
- [x] Swap internals only (call legacy strategy modules, apply policy logic for sizing/weighting).

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
  - [x] `GET /api/risk/profiles`
  - [x] `GET /api/risk/user-settings`
  - [x] `POST /api/risk/user-settings`
- Frontend:
  - [x] UI to select/persist risk profiles per user/session.

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

  - Replace stubs in `MultiAgentService` with LangGraph/LLM pipelines (same response shapes) – **done** via `apps/backend/src/services/ai/*` and GPT tools.
  - Add auth (JWT/OAuth2), multi-tenant persistence (database instead of JSON), CI/CD, monitoring, and observability. *(future backlog)*
  - Integrate Polygon streaming more deeply if desired (beyond Gate 3's minimal widget). *(future backlog)*
  - **Agent-specific copilots:** Each agent (Analyst, Researcher, Trader, Risk, PM) gets its own GPT toolchain with tailored system prompts + allowed tools for best results, reusing the V3 read-only contracts.

> **Gate 5 exit condition:** You have the completed GPT toolkit, a clear definition of "done", plus the backlog file for everything else (auth, multi-tenancy, monitoring). Tests are green and the paper-trading surface can be extended further.
1. Scope & Guardrails

GPT is a read-only copilot for the current V3 paper-trading SaaS:

Explains the /trading 4-step flow (Run Agents → Plan → Risk → Approve Paper). 

final upgrades

Explains /dashboard cards and portfolio state.

Answers questions about paper trades, portfolio, and risk checks using existing APIs.

GPT must not:

Trigger live trading or bypass BINANCE_TRADING_ENABLED=false. 

final upgrades

Change guardrails or flip any “live” switches.

Only V3 contracts are exposed as Actions:

POST /api/agents/run-analysis

POST /api/agents/generate-trade-plan

POST /api/risk/validate-trade-plan

POST /api/trades/approve-paper

GET /api/portfolio 

final upgrades

2. Backend Implementation (apps/backend)
2.1. Add GPT Actions schema

Create apps/backend/src/services/ai/gptTools.ts:

Define tools for read-only inspection over the existing paper flow:

get_portfolio_snapshot → wraps GET /api/portfolio.

simulate_analysis → calls run-analysis with safe demo payloads.

simulate_plan → calls generate-trade-plan without approving.

inspect_risk_check → calls validate-trade-plan with a plan ID.

No tool is allowed to:

Call live execution.

Write to PaperStore beyond what the normal paper flow already does.

(These are simple wrappers around the existing routes in tradingFlow.ts, so contracts stay identical. 

final upgrades

)

2.2. Add GPT orchestration service

Create apps/backend/src/services/ai/GptAssistantService.ts:

Accepts:

workspaceId, userId

Natural language question

Optional context: currentRoute (/dashboard vs /trading), current symbol/timeframe.

Builds a message array:

System: “You are a trading SaaS copilot. Explain the existing 4-step paper trading flow and portfolio, never place live trades.”

Context: brief JSON of route + portfolio snapshot (if cheap to fetch).

User: question.

Calls OpenAI with:

The read-only tools from gptTools.ts.

tool_choice: "auto".

Loop:

If GPT calls a tool, execute the mapped wrapper and append results as tool messages.

Stop when GPT returns a normal assistant message.

Return to caller:

answer (markdown).

toolCallLog (which tools were used, status, short summaries).

2.3. Add a single public endpoint

Add POST /api/ai/ask in apps/backend/src/routes/ai.ts (and mount in main router):

Auth:

Same auth middleware as trading routes.

Inject workspaceId and userId from session.

Request body:

question: string

context?: { route?: "/dashboard" | "/trading"; symbol?: string; timeframe?: string }

Response:

answer: string

toolCallLog: Array<{ name, args, status, shortResult | error }>.

2.4. Hard safety checks

Inside GptAssistantService and tool wrappers:

Never trust workspace IDs from GPT:

Always inject workspaceId from auth when calling PaperStore or existing services.

Add explicit runtime guards so GPT cannot touch live flow:

Reject any tool definition whose name suggests approve_live, enable_live, update_guardrail, etc.

Optionally, assert BINANCE_TRADING_ENABLED === false before executing any action, and log if not. 

final upgrades

Example shell actions (adapt to your process):

# From repo root
cd apps/backend

# Create AI service files
mkdir -p src/services/ai
touch src/services/ai/gptTools.ts
touch src/services/ai/GptAssistantService.ts

# Create AI routes file
mkdir -p src/routes
touch src/routes/ai.ts

# Build & run to verify nothing breaks
npm install
npm run build
npm run dev

3. Frontend Implementation (apps/frontend)
3.1. “Ask GPT” on /dashboard

Inside /dashboard (which is already wired to backend data and portfolio snapshot): 

final upgrades

Add a right-hand or bottom card: “Ask GPT about this account”.

UI elements:

Textarea: question.

Optional toggle: “Include my current portfolio snapshot in context”.

On submit:

Call POST /api/ai/ask with:

question

context.route = "/dashboard"

Render:

Streaming or full answer as markdown.

Collapsible “Data used” panel listing toolCallLog.

3.2. Context-aware GPT on /trading

On /trading (4-step paper flow): 

final upgrades

Add a side panel: “Ask GPT about this step”.

Populate context from the existing store:

Current step (Run Agents, Plan, Risk, or Approve Paper).

Selected symbol, timeframe, and last plan/analysis IDs.

On submit:

Call POST /api/ai/ask with:

question

context including route = "/trading", plus symbol/timeframe.

Render GPT answer near the step, so users can ask:

“What does this risk check mean?”

“Explain the trade plan entries in plain English.”

3.3. Frontend safety & UX rules

Always show a clear note:

“GPT is advisory only and cannot place live trades.”

Do not add any GPT button that says “Execute” / “Trade now”.

Encourage introspective questions:

“Explain this plan / risk / portfolio” vs “Place a trade”.

Example shell actions:

cd apps/frontend

# Ensure deps
npm install

# Run dev server and iterate on UI
npm run dev

4. Phased Rollout (Aligned with Existing Gates)

Keep the GPT work aligned with your existing Gate structure so it doesn’t blow up scope. 

final upgrades

Phase A – After Gate 0 & 1 (V3 green + contracts locked)

Only enable Q&A about:

The 4-step paper flow.

Portfolio snapshot.

Tools hit only the same V3 routes already defined in tradingFlow.ts. 

final upgrades

Phase B – After Gate 2 (frontend merge)

Use upgraded /dashboard and /trading visuals to host GPT cards instead of raw JSON. 

final upgrades

Keep GPT strictly read-only, still no live hooks.

Phase C – After Gate 3–4 (optional)

Once market data service and richer quant internals are stable, you can:

Add read-only GPT tools that summarize market data.

Let GPT explain advanced quant signals returned from /analysis and /trade-plan/generate without changing their contracts. 

final upgrades

Phase D – Beyond This Merge (Future Backlog)

Anything where GPT could orchestrate actions (e.g., call live approval routes, tweak risk profiles) stays in the same Future Backlog bucket as “LLM orchestration & SaaS hardening,” not this merge. 

**Bonus – Docker smoke verification**  
Use the legacy Docker/Kubernetes assets to run a containerized check of the paper-trading stack:

```bash
cd legacy_original_project7_main/Project7_CryptoBot_Dev
docker compose --profile dev up --build
# curl http://localhost:8080/api/agents/run-analysis etc.
docker compose --profile dev down
```

This hit the same `/dashboard`, `/trading`, and `tradingFlow` APIs with containers, keeping your local Node tooling untouched.

final upgrades

If you tell me your exact backend stack (Express, Nest, FastAPI, etc.), I can turn this into concrete code stubs for gptTools, GptAssistantService, and the /api/ai/ask route tailored to your framework.
