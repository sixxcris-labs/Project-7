# Polygon Live Quotes

This guide explains how to run the Polygon-powered quote stream that hydrates `/api/market-data/quotes` and the wallet dashboard cards.

## 1. Configure environment variables

Add/update the following entries in both `.env` and `apps/backend/.env` (check in with `npm run check:env`):

```
POLYGON_LIVE_ENABLED=true
POLYGON_API_KEY=your_key_here
POLYGON_STREAM_URL=wss://socket.polygon.io/crypto
POLYGON_SYMBOLS=BTC-USD,ETH-USD,SOL-USD,MATIC-USD
POLYGON_RECONNECT_MIN_MS=5000
POLYGON_RECONNECT_MAX_MS=60000
```

## 2. Start the stack with the dev profile

```bash
cd Project7_CryptoBot_Dev
docker compose --profile dev up -d backend frontend
```

The backend health check waits for Polygon to authenticate before reporting `healthy`.

## 3. Verify backend and API endpoint

```bash
curl "http://localhost:8080/api/market-data/quotes?symbols=BTC-USD,ETH-USD" | jq
```

You should see an array of quote snapshots with `exchange: "polygon"`.

## 4. Frontend integration

The dashboard page renders `WalletDashboardPreview`, which calls `useLiveQuotes`. Each card reflects live mid prices and shows a badge when quotes are streaming. Status banners fall back to “Polygon quotes disabled” if the backend feature flag is off or the API key is missing.

## 5. Troubleshooting

- **`POLYGON_LIVE_ENABLED` false** – backend skips the WebSocket client and the API serves the fallback quotes defined in `index.ts`.
- **Auth errors** – the backend logs `status` messages from Polygon; ensure the API key has crypto permissions.
- **Stale data** – quotes older than 60 seconds are dropped. Check your system clock if everything ages out immediately.
- **Frontend still showing static data** – confirm `NEXT_PUBLIC_QUOTES_REFRESH_MS` (default `15000`) isn’t ridiculously large and that the browser network tab shows successful `/api/market-data/quotes` responses.

## 6. Clean shutdown

```bash
docker compose --profile dev down
```

The quote service stops automatically when the backend container stops.
