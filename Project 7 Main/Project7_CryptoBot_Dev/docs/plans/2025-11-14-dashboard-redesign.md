# Dashboard Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the legacy dashboard grid with the new `webdesign.md` layout, fully wired to the existing data hooks and ready for production.

**Architecture:** Keep the dashboard as a Pages Router entry point (`src/pages/dashboard.tsx`) and compose the new layout directly there. Reuse the current hooks/store modules (`useDashboardStore`, SWR hooks, Zustand stores) so that every widget renders live data instead of the mock arrays bundled with the design doc. Implement the `/api/chat` handler inside the frontend so the Chat panel can post messages without depending on an external service.

**Tech Stack:** Next.js 14 (Pages Router), React 18 with TypeScript, SWR for data fetching, Zustand stores, Tailwind utility classes, Vitest + Testing Library for unit tests, Docker Compose for runtime verification.

---

### Task 1: Scaffold the redesigned dashboard layout

**Files:**
- Modify: `apps/frontend/src/pages/dashboard.tsx`
- Test: `apps/frontend/src/pages/__tests__/dashboard.layout.test.tsx`

**Step 1: Write the failing test**

Create `apps/frontend/src/pages/__tests__/dashboard.layout.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react";
import DashboardPage from "../../dashboard";

vi.mock("@/services/dashboard/hooks", () => ({
  usePerformanceSummary: () => ({ data: { todayPnlUsd: 0, todayPnlPct: 0, tradesToday: 0, winRateToday: 0, riskUsedPct: 0, equityVsAthPct: 0, maxDrawdownTodayPct: 0, currentStreak: "0" } }),
  useWatchlist: () => ({ data: [], isLoading: false }),
  useBacktestsList: () => ({ data: [], isLoading: false }),
  useBacktestSummary: () => ({ data: null }),
  useGuardrailsState: () => ({ data: null }),
  useSystemStatus: () => ({ data: null }),
  useBalances: () => ({ data: [] })
}));
vi.mock("@/hooks/useLiveQuotes", () => ({ useLiveQuotes: () => ({ quotes: [] }) }));
vi.mock("@/stores/dashboardStore", () => ({
  useDashboardStore: () => ({
    currentSymbol: "BTCUSDT",
    currentTimeframe: "1h",
    tradeEnvironment: "paper",
    setCurrentSymbol: vi.fn(),
    setCurrentTimeframe: vi.fn()
  })
}));

describe("Dashboard layout", () => {
  it("renders the Trading Overview header and sidebar links", () => {
    render(<DashboardPage />);
    expect(screen.getByText(/Trading Overview/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Strategy tester/i })).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd apps/frontend
npm run test -- dashboard.layout.test.tsx
```

Expected: FAIL because the updated layout components do not exist yet.

**Step 3: Write minimal implementation**

Update `apps/frontend/src/pages/dashboard.tsx` to:
- Import `Link` and all hooks/stores listed in the mock above.
- Render the new sidebar, hero, watchlist, strategy tester, chat, and system status sections using placeholder wrappers.
- Keep mock arrays removed; rely on hook outputs even if they return empty lists.

**Step 4: Run the test to verify it passes**

```bash
cd apps/frontend
npm run test -- dashboard.layout.test.tsx
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/frontend/src/pages/dashboard.tsx apps/frontend/src/pages/__tests__/dashboard.layout.test.tsx
git commit -m "feat: scaffold redesigned dashboard layout"
```

---

### Task 2: Wire live data into every dashboard panel

**Files:**
- Modify: `apps/frontend/src/pages/dashboard.tsx`
- Modify: `apps/frontend/src/pages/__tests__/dashboard.layout.test.tsx` (expand mocks/expectations)

**Step 1: Write failing tests for live data mapping**

Extend `dashboard.layout.test.tsx` with two cases:

```typescript
it("shows formatted today PnL and win rate from usePerformanceSummary", () => {
  mockedUsePerformanceSummary.mockReturnValue({ data: { todayPnlUsd: 8421, todayPnlPct: 5.2, tradesToday: 4, winRateToday: 0.75, riskUsedPct: 0.31, equityVsAthPct: 0.9, maxDrawdownTodayPct: 0.12, currentStreak: "3" }});
  render(<DashboardPage />);
  expect(screen.getByText("+$8,421.00")).toBeInTheDocument();
  expect(screen.getByText(/win rate 75.00%/i)).toBeInTheDocument();
});

it("renders watchlist rows from useWatchlist data", () => {
  mockedUseWatchlist.mockReturnValue({ data: [{ symbol: "BTCUSDT", price: 103456, change24hPct: 1.23, exchange: "Binance", volume24h: 0, alertEnabled: false, favorite: false }], isLoading: false });
  render(<DashboardPage />);
  expect(screen.getByText("BTCUSDT")).toBeInTheDocument();
  expect(screen.getByText("$103,456.00")).toBeInTheDocument();
});
```

**Step 2: Run the tests to confirm they fail**

```bash
cd apps/frontend
npm run test -- dashboard.layout.test.tsx
```

Expected: FAIL (text not found yet).

**Step 3: Implement data wiring**

In `dashboard.tsx`:
- Collect SWR data using the real hooks (performance, watchlist, backtests, guardrails, system status, balances, live quotes).
- Replace all mock arrays (`backtests`, `coins`) and static labels with derived values from hooks.
- Compute aggregated metrics (`completedBacktests`, `avgSharpe`, `accountEquity`, etc.) and pass them into the JSX.
- Ensure the sidebar uses `next/link` and the symbol/timeframe selectors call `setCurrentSymbol` / `setCurrentTimeframe`.

**Step 4: Update tests to satisfy new props**

Make sure the mocks used in the tests return all required fields; rerun the test suite:

```bash
cd apps/frontend
npm run test -- dashboard.layout.test.tsx
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/frontend/src/pages/dashboard.tsx apps/frontend/src/pages/__tests__/dashboard.layout.test.tsx
git commit -m "feat: wire live data into dashboard panels"
```

---

### Task 3: Implement `/api/chat` and connect the Chat panel

**Files:**
- Create: `apps/frontend/src/pages/api/chat.ts`
- Test: `apps/frontend/src/pages/api/__tests__/chat.test.ts`
- Modify: `.env.local.example` (document `OPENAI_API_KEY`)

**Step 1: Write the failing API test**

Create `apps/frontend/src/pages/api/__tests__/chat.test.ts`:

```typescript
import handler from "../chat";
import type { NextApiRequest, NextApiResponse } from "next";

const mockOpenAI = { responses: { create: vi.fn() } };
vi.mock("openai", () => ({ OpenAI: vi.fn(() => mockOpenAI) }));

function buildRes() {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  return { status, json } as unknown as NextApiResponse;
}

describe("POST /api/chat", () => {
  it("returns reply text from OpenAI", async () => {
    mockOpenAI.responses.create.mockResolvedValue({ output: [{ content: [{ text: { value: "hi" } }] }] });
    const req = { method: "POST", body: { model: "gpt-4.1", message: "Hello" } } as NextApiRequest;
    const res = buildRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.status.mock.calls[0][1].json).toHaveBeenCalledWith({ reply: "hi" });
  });
});
```

**Step 2: Run the test to watch it fail**

```bash
cd apps/frontend
npm run test -- pages/api/__tests__/chat.test.ts
```

Expected: FAIL because `chat.ts` does not exist.

**Step 3: Implement the API route**

Create `apps/frontend/src/pages/api/chat.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { model, message, context } = req.body;
    const result = await client.responses.create({
      model: model ?? "gpt-4.1-mini",
      input: `Dashboard context: ${JSON.stringify(context ?? {})}\nUser: ${message}`,
    });
    const reply = result.output?.[0]?.content?.[0]?.text?.value ?? "(No reply field returned from API)";
    return res.status(200).json({ reply });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Chat backend failure" });
  }
}
```

Add `OPENAI_API_KEY=` to `apps/frontend/.env.local.example`.

**Step 4: Run tests**

```bash
cd apps/frontend
npm run test -- pages/api/__tests__/chat.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/frontend/src/pages/api/chat.ts apps/frontend/src/pages/api/__tests__/chat.test.ts apps/frontend/.env.local.example
git commit -m "feat: add /api/chat proxy for dashboard assistant"
```

---

### Task 4: Validate integration and styling

**Files:**
- Modify: `apps/frontend/tailwind.config.js` (ensure `content` globs include `src/pages/**/*` if missing)
- Modify: `apps/frontend/src/styles/global.css` (optional global tweaks)

**Step 1: Run lint & type checks**

```bash
cd apps/frontend
npm run lint
npm run typecheck
```

Ensure both succeed.

**Step 2: Run full Vitest suite**

```bash
cd apps/frontend
npm run test
```

Expected: PASS.

**Step 3: Manual UI smoke test**

```bash
cd apps/frontend
npm run dev
```

Visit `http://localhost:3000/dashboard`, confirm:
- Sidebar links navigate via Pages Router
- PnL card updates as mocked data changes
- Watchlist rows show formatted price and change
- Strategy tester selectors update store values
- Chat panel posts to `/api/chat` and shows responses

Stop dev server afterwards.

**Step 4: Commit**

```bash
git add apps/frontend/tailwind.config.js apps/frontend/src/styles/global.css
git commit -m "chore: align tailwind globs for redesigned dashboard"
```

---

### Task 5: End-to-end verification with Docker

**Files:**
- None (runtime verification)

**Step 1: Build containers**

```bash
cd Project7_CryptoBot_Dev
docker compose build
```

Ensure frontend/backend images build successfully.

**Step 2: Run stack**

```bash
cd Project7_CryptoBot_Dev
docker compose up frontend backend -d
```

Verify logs:

```bash
docker compose logs frontend backend --tail=100
```

Expected: both services report healthy startup with no crashes.

**Step 3: Hit dashboard via Dockerized frontend**

Open `http://localhost:3000/dashboard` (Docker port) and confirm UI loads with live data.

**Step 4: Shutdown stack**

```bash
docker compose down
```

**Step 5: Commit**

No file changes; skip commit unless Docker adjustments were required.

---

Plan complete and saved to `docs/plans/2025-11-14-dashboard-redesign.md`. Two execution options:

1. Subagent-Driven (this session) – I dispatch a fresh subagent per task with reviews between tasks for fast iteration.
2. Parallel Session (separate) – Open a new session with executing-plans, run tasks in batches with checkpoints.

Which approach?
