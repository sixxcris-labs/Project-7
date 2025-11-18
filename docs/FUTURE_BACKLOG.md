# PROJECT7_V3 – Future Backlog

These items are explicitly **out of scope** for the current Gate 0–4 merge, but they are documented here so we can pick them up once the paper-trading core and legacy UI are stable.

## Risk profiles & user settings

- Backend:
  - `GET /api/risk/profiles`
  - `GET /api/risk/user-settings`
  - `POST /api/risk/user-settings`
- Frontend:
  - UI to pick and persist a risk profile per user/session.
  - Wire profile metadata into `tradingFlowApi.validateTradePlan`.

## Trade history endpoint & dashboard widget

- Backend:
  - `GET /api/history/trades` backed by `PaperStore.portfolio.history`.
  - Support filters (symbol, timeframe, outcome).
- Frontend:
  - Show recent trades + P&L history on `/trading` and/or `/dashboard`.
  - Provide CSV export or detail modal per trade.

## Live trading switch & guarded approvals

- Backend:
  - `GET /api/system/live-trading-status` (reads `guardrails.liveEnabled` + `BINANCE_TRADING_ENABLED`).
  - `POST /api/trades/approve-live` (wraps `LiveTradeApprovalService`, enforces `RISK_PUBLIC` approvals).
- Frontend:
  - Live mode toggle (paper vs live) with confirmation checkboxes.
  - Require re-validation when switching modes; show guardrails status.

## Risk Sentinel microservice

- New FastAPI service `services/risk-sentinel` exposing:
  - `POST /evaluate` (wallet/profile/order context → ALLOW/REDUCE/BLOCK).
  - `GET /health`.
- Node backend:
  - `apps/backend/src/services/risk/RiskSentinelClient.ts`.
  - Live trade approvals call the sentinel; paper stay on `RiskService`.

## LLM orchestration & SaaS hardening

- Replace the `MultiAgentService` stub with a LangGraph/LLM pipeline (same output shape).
- Add shared GPT tools for market data + quant results.
- Add auth (JWT/OAuth2) + multi-tenant DB for analyses/plans/portfolio.
- Add CI/CD, Docker, monitoring, observability, rate limiting, secrets handling.

> Keep this backlog updated as we work on phases beyond the current merge.
