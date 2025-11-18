Builds pass (npm run build under apps/backend and apps/frontend) but almost every surface uses stubs. Dashboard (apps/frontend/src/pages/dashboard.tsx (lines 1-160)) renders mock arrays, owns its own sidebar/header, and ignores the shared layout/state stores. The trading flow page mounts (trading.tsx (lines 1-5)) but the pipeline cannot complete because the front-end calls don’t match the backend contracts and the backend services return placeholder data.
Why the “new dashboard” is not really loading

The global layout (apps/frontend/src/components/Layout.tsx (lines 4-13)) always renders SideNav + TopBar, then injects whatever page component returns. The new dashboard page also renders its own sidebar/header (lines 128‑210), so you see the legacy chrome surrounding a second, hard-coded chrome—hence “it doesn’t load into the dash”.
None of the new dashboard widgets bind to stores/APIs; everything in dashboard.tsx is computed from mock arrays declared at the top (lines 3‑75). The existing shared hooks (usePerformanceSummary, useGuardrailsState, etc.) that the rest of the app and the tests rely on are never imported, so the live state never hydrates.
Tests under apps/frontend/src/__tests__/dashboard.layout.test.tsx still try to mock store-driven hooks, meaning the test suite is exercising an older component tree, not this new static page. That’s another symptom that the new layout was dropped in without being wired to the rest of the app.
Blocking technical issues in the multi-agent pipeline

Risk validation payload mismatch – Backend requires the full plan object (apps/backend/src/api/tradingFlow.ts (lines 132-149)), but the store only sends { tradePlanId, mode } (apps/frontend/src/stores/tradingSessionStore.ts (lines 191-214)). Fastify responds 400, so the “Validate risk” step will never succeed.

Approval payload mismatch – /trades/approve-paper and /trades/approve-live both require { tradePlanId, riskCheckId, plan } plus confirmations (tradingFlow.ts (lines 160-210)). The front-end only passes tradePlanId and riskCheckId for paper (lines 224‑247) and omits both plan and confirmations for live (lines 255‑299). These buttons will always throw validation errors.

Stubbed services – The “agents” response is five hard-coded entries returned by MultiAgentService (apps/backend/src/services/multiAgent/MultiAgentService.ts (lines 46-88)) and the trade plan is a fixed BTC example (lines 90‑123). Risk checks (services/risk/RiskService.ts (lines 1-88)) and portfolio data (services/portfolio/PortfolioService.ts (lines 1-66)) are equally static, so you can never progress from mock output to actionable trades.

Paper/live gating – TradeApprovalService.getLiveTradingStatus simply checks BINANCE_TRADING_ENABLED and returns enabled: false otherwise (apps/backend/src/services/trading/TradeApprovalService.ts (lines 23-39)). With .env defaulting to false, the front-end always surfaces “Live trading disabled”, blocking the final button even if the payload issues were fixed.

Quant service unused – Docker injects QUANT_API_URL everywhere (docker-compose.yml (lines 18-77)), and the Python quant microservice exposes health/TCA/SOR endpoints (services/quant/src/crypto_quant_ai/api_service.py (lines 1-63)), but the backend only hits it for a /strategies/backtest/echo health check (apps/backend/src/routes/strategies.ts (lines 55-82)). No agent, backtest, or trade approval actually uses quant outputs.

No persistence – Portfolio, history, guardrails, strategies, billing, news, etc. all come from arrays defined in apps/backend/src/routes/dashboard.ts (lines 1-190). There are no DB writes/read paths wired through db/ or packages/common. As soon as you refresh, everything resets, so you cannot track real paper positions.

4-layer architecture assessment (requested “A” items)

Layer	What exists	What’s missing
Research & Backtest	Quant service contains alpha/backtest engines (services/quant/src/crypto_quant_ai/alpha/*.py, backtest/engine.py) and Docker runs it.	No wiring from frontend “Strategies/LLM Lab” to quant APIs; no RBI/RBI Parallel/Million agent definitions; no prompt editing workspace or automated feed from strategies endpoints into backtests.
Signal & Market Intel	Market streams, Binance/Polygon adapters, guardrails service, Whale Watch stubs (apps/backend/dist/.../market-data & routes/whaleWatch).	No explicit agents for Volume, Whale, Sentiment, Chart, Funding, etc.; the MultiAgentService stub doesn’t enumerate them; there’s no per-agent IO schema in docs/code.
Execution & Risk	Fastify routes exist for plan/risk/approval (tradingFlow.ts), risk profiles (RiskService), OMS placeholders, and quant execution modules (e.g. services/quant/src/crypto_quant_ai/execution/oms_async.py).	No UI for plan/risk/approve that enforces “plan → risk → approvals” with gating per environment (TradingDashboard handles buttons but not guardrail toggles or per-agent costs). No regime or position-sizing agents, no guardrail kill switch wiring, and approvals never flow to exchanges.
Distribution & Ops	Sidebar items mention “Chat”, “Admin/Ops”. Chat uses /api/chat which just echoes input (apps/frontend/src/pages/api/chat.ts (lines 1-33)).	No content production agents (Video/Clips/Real-Time Clips, Phone, Focus, Compliance) or pipelines to summarize trades, no distributions to end-users, and no spec mapping those agents to this layer.
Additionally, PROJECT7_CONSOLIDATED_PLAN.md only restates the trading dashboard rollout (lines 1‑176) and backend plan (lines 225‑340). There’s no “Section 1.5 4-layer architecture”, no “1.6 Agent Catalog”, no mention of profiles/capital buckets, trading-flow UX specs, guardrail controls, or distribution surfaces. Those sections must be added to that doc to make it the “master spec” you described.

Product/SaaS gaps (requested “B” items)

Auth/users/orgs – /api/auth/login implements demo-only login and returns a hardcoded token when JWT isn’t configured (apps/backend/src/routes/auth.ts (lines 4-53)). There’s no RBAC, no org boundary, and no API key issuance.

Admin/Ops – apps/frontend/src/pages/admin.tsx (lines 1-32) renders four numbers from /api/admin/metrics, which themselves are constants (routes/dashboard.ts (lines 154-190)). There’s no kill switch, queue visibility, feature flags, or environment toggles.

Security & secrets – Secrets are plain env vars (.env.example, docker-compose.yml); there’s no mention of vault/KMS, rotation, or masking in logs. Sensitive payloads (exchange keys) do not exist anywhere, so there’s nothing securing them.

Observability – Prometheus config exists (monitoring/prometheus/prometheus.yml (lines 1-14)), but the backend only exposes default metrics via collectDefaultMetrics (apps/backend/src/metrics.ts (lines 1-11)). There are no agent-level metrics, PnL metrics, alerting hooks, or traces.

Model/prompt lifecycle – No repo files mention prompt versioning or evaluation harnesses. Agents are mocked; no prompt/test directories exist.

Testing & CI/CD – Frontend has a single outdated Vitest file; backend has a few Vitest stubs under apps/backend/test, but there’s no CI config, integration tests, or replay harness.

Compliance & audit – No retention policy, export endpoints, or per-user audit logs exist anywhere, and there’s no compliance doc outside of quant-specific notes.

Onboarding & safety rails – There’s no setup wizard page, no gating that blocks live until safety items are set, and even the live toggle in TopBar is disabled with a tooltip (“Live (disabled)” at apps/frontend/src/components/TopBar.tsx (lines 64-86)).

Inventory of major directories/files

Frontend (apps/frontend/…) – Pages exist for Dashboard, Trading, Markets, etc., but most components pull from services/dashboard/hooks.ts which in turn call mocked backend endpoints. Zustand stores (stores/dashboardStore.ts, stores/tradingSessionStore.ts) keep UI state only; no persistence.

Backend (apps/backend/src/…) – Fastify server wires many route files, yet most return arrays defined in routes/dashboard.ts. Multi-agent, risk, portfolio, and trading services are stub classes. Integrations (Binance, Polygon) are wired, but the multi-agent pipeline never touches them.

Quant (services/quant) – Full FastAPI app with alpha/regime/risk modules and tests exists; nothing calls it besides /strategies/backtest/echo.

Docs (PROJECT7_CONSOLIDATED_PLAN.md, apps/frontend/docs/*, apps/backend/docs/*) – Focus exclusively on trading dashboard rollout; they don’t document the four-layer model or agent catalog.

This is the practical extent of “critical review of every file”: anything not mentioned is either autogenerated (dist, .next, node_modules) or a larger set of placeholder types under packages/common/src/types/* that match the mocked backend payloads.

Plan to reach actual paper-trading readiness

Align API contracts

Update tradingFlowApi.validateTradePlan/approve* to send the plan payload and confirmations, and adjust TradingSessionStore to pass the stored tradePlan object (files cited above). Add e2e tests per step.
Replace stubs with real services

Multi-agent: implement wrappers that call specific agents (RBI, Whale, Sentiment, etc.) and persist analyses (start from MultiAgentService.ts).
Risk: persist user risk profiles, tie to guardrail configs, and calculate metrics from actual positions.
Portfolio/history: read/write from Postgres via the db layer instead of returning literals.
Integrate quant service

Replace /api/agents/generate-trade-plan stub logic by calling QUANT_API_URL for strategy generation/backtests.
Use quant backtest outputs to populate the dashboard/backtests pages rather than the static arrays.
Guardrails & environment controls

Wire useGuardrailsState, /api/guardrails/state, and the risk page to real toggles (kill switch, per-agent caps). Provide UI switches/hard stops before enabling live.
Profiles & capital buckets

Extend RiskService schemas to store per-profile capital allocations and link them to frontend persona selection; add riskProfileId editing UI.
Distribution/content layer

Define Chat/Video/Clips agents, store their prompts in code or config, and create APIs to publish their outputs. Surface them in dedicated pages.
Observability/ops

Instrument backend endpoints with per-agent metrics, propagate Prometheus endpoints, add logging/tracing, and surface them in Grafana.
Testing & CI

Add Vitest suites for stores/components, backend contract tests for every /api route, and integrate them with a CI workflow. Add regression “replay” jobs using the quant service.
Documentation

Update PROJECT7_CONSOLIDATED_PLAN.md with sections 1.5/1.6 and Section 2.11+ for auth, guardrails, observability, model lifecycle, testing, admin/ops as outlined in your prompt.
Following this sequence ensures the dashboard pulls real data, the trading pipeline can run end-to-end (at least in paper mode), and the missing architecture/product requirements are documented and staffed before moving toward live trading.

