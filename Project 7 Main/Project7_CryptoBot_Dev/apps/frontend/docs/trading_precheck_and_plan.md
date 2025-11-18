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
