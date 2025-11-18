# Changelog

## 2025-11-13

- Backend: standardized to port `8080` for local/dev (`apps/backend/.env`).
- Compose: added `JWT_PRIVATE_KEY_PATH` and `JWT_PUBLIC_KEY_PATH` to `backend` service (`docker-compose.yml`).
- Compose override: fixed and formatted `docker-compose.override.yml` to mount host secrets
  `"/mnt/c/Users/Cristian/p7-secrets:/home/cristian/p7-secrets:ro"`.
- Compose override: set `BINANCE_REST_URL=https://api.binance.us` and `BINANCE_SYMBOLS=BTCUSDT,ETHUSDT` to avoid 451 from `api.binance.com`.
- Frontend: set `NEXT_PUBLIC_API_BASE` to `http://localhost:8080` (`apps/frontend/.env.local`).
- Root env: corrected malformed values (`PORT`, duplicated JWT key paths) in `.env`.
- Backend: added `/healthz` alias alongside `/health` (`apps/backend/src/index.ts`).
- Market data: when cache is empty, routes now trigger a one-time fetch before returning 404 (`apps/backend/src/api/marketData.ts`, `services/marketData/MarketDataService.ts`).
- Backend: added optional outbound proxy support via `PROXY_URL`/`HTTPS_PROXY` env using `https-proxy-agent` (`apps/backend/src/integrations/binance/BinanceHttpClient.ts`, `apps/backend/package.json`).

Notes:
- The fm service remains excluded from the default `up` command due to its build dependency issue.

## 2025-02-14

- Docs: expanded the multi-agent trading implementation plan with backend integration checklist covering service copies, trading flow route registration, and verification steps (`apps/frontend/docs/plans/2025-02-14-multi-agent-trading-frontend.md`).
- Frontend: copied trading precheck doc plus new trading flow API client, Zustand session store, TradingDashboard component, `/trading` page, and navigation entry; replaced the control-surface `/dashboard` page with the bundled baseline to fix compile errors; updated TradingDashboard quote handling to match `useLiveQuotes` data (`apps/frontend/docs/trading_precheck_and_plan.md`, `src/services/api/tradingFlowApi.ts`, `src/stores/tradingSessionStore.ts`, `src/components/trading/TradingDashboard.tsx`, `src/pages/dashboard.tsx`, `src/pages/trading.tsx`, `src/components/SideNav.tsx`).
- Backend: imported the multi-agent backend guide plus stub services (multiAgent, risk, portfolio, trade approvals), added the tradingFlow API plugin, and registered it inside the Fastify bootstrap so frontend calls succeed once the server runs (`apps/backend/docs/multi_agent_backend_implementation.md`, `src/services/multiAgent/MultiAgentService.ts`, `src/services/risk/RiskService.ts`, `src/services/portfolio/PortfolioService.ts`, `src/services/trading/TradeApprovalService.ts`, `src/api/tradingFlow.ts`, `src/index.ts`).
