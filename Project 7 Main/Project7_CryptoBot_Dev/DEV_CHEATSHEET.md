# Dev Cheatsheet — Project 7

## Prereqs
- Node LTS
- Docker Desktop
- WSL2 on Windows recommended

## Keys

Host folder (example):
C:\Users\Cristian\p7-secrets

Mounted into container (example):
/home/cristian/p7-secrets:ro

Example env:
JWT_PRIVATE_KEY_PATH=/home/cristian/p7-secrets/jwt_ed25519_private.pem
JWT_PUBLIC_KEY_PATH=/home/cristian/p7-secrets/jwt_ed25519_public.pem

Sync env files before committing:

```bash
npm run check:env
```

## Start stack

Local dev (backend, frontend, grafana, prometheus, fm):

```bash
docker compose --profile dev up -d
```

Staging-style (API + quant only):

```bash
docker compose --profile staging up -d
```

Production-style (API + frontend + quant):

```bash
docker compose --profile prod up -d
```

pnpm -w install
pnpm --filter @project7/backend dev
pnpm --filter @project7/frontend dev

Backend:  http://localhost:8080
Frontend: http://localhost:3000

## Feature flags

BINANCE_TRADING_ENABLED=false
POLYMARKET_WHALES_ENABLED=true
LIVE_STREAM_ENABLED=false

## Polygon live quotes

- Enable backend: set `POLYGON_LIVE_ENABLED=true` and provide `POLYGON_API_KEY`, symbols, and reconnect timings in both `.env` files (use `npm run check:env`).
- Frontend refresh interval: `NEXT_PUBLIC_QUOTES_REFRESH_MS` (default 15000 ms).
- Docs: `docs/polygon-live-stream.md`.

## Live market stream (labs)

- Toggle `LIVE_STREAM_ENABLED=true` to expose `/ws/markets` and the lab dashboard at `/live-test`.
- Stream subscriptions are in-memory only; restarting clears all state.
- Websocket base can be overridden with `NEXT_PUBLIC_WS_BASE`.

## Health

curl http://localhost:8080/health
curl http://localhost:8080/healthz

## Auth (dev/demo)

AUTH_MODE=demo
AUTH_DEMO_EMAIL=dev@example.com
AUTH_DEMO_PASSWORD=changeme

Login:

curl -X POST http://localhost:8080/api/auth/login ^
  -H "content-type: application/json" ^
  -d "{\"email\":\"dev@example.com\",\"password\":\"changeme\"}"

## Stripe webhook

STRIPE_WEBHOOK_SECRET=whsec_...

Endpoint:
POST /api/billing/webhook

## Whale watch

POLYMARKET_WHALES_ENABLED=true

curl "http://localhost:8080/api/whale-watch/polymarket?limit=25"

## Trading validation

- Missing or invalid price/quantity/symbol returns HTTP 400 with a JSON body:
  { "code", "message", "details" }

## Tests

pnpm --filter @project7/backend test
