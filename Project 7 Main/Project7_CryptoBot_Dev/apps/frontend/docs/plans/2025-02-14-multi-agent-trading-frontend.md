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
