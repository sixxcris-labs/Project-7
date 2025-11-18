# Live Market Streaming – Codex Implementation Guide

Short, incremental steps. After each numbered section: implement, run locally, code review, and only then continue.

---

## 1. Scope & Constraints

- Add live market streaming on top of the **existing Fastify backend** and **Next.js frontend**.
- **No DB / Redis**: all state is in-memory (backend process + browser memory).
- Reuse existing **config, logging, and auth** patterns.
- New code lives in **new modules only**; `apps/backend/src/index.ts` is only extended via `app.register(...)`.

**Code review & cleanup before continuing**

- [ ] Confirm no existing files are deleted or heavily refactored.
- [ ] Confirm new imports follow existing alias/relative-path style.
- [ ] Confirm no ORM / DB / Redis imports were added.

---

## 2. Backend: WebSocket Plugin

**File:** `apps/backend/src/plugins/marketStreamPlugin.ts`  
**Goal:** Upgrade HTTP → WebSocket at `/ws/markets` and bridge client messages to the stream manager.

**Key steps**

- Register the WS library (e.g. `@fastify/websocket`) on the existing Fastify instance.
- Implement `GET /ws/markets` with `{ websocket: true }`.
- On connection:
  - Generate a `clientId`.
  - Call `marketStreamManager.onClientConnect(clientId, connection)`.
  - Parse incoming JSON messages and forward to `marketStreamManager.handleClientMessage(...)`.
  - On close, call `marketStreamManager.onClientDisconnect(clientId)`.

**Minimal sketch (example)**

```ts
// apps/backend/src/plugins/marketStreamPlugin.ts
import type { FastifyInstance } from "fastify";
import { marketStreamManager } from "../services/marketStreamManager";

export async function marketStreamPlugin(app: FastifyInstance) {
  app.get("/markets", { websocket: true }, (connection, req) => {
    const clientId = /* generate client id */ "";

    marketStreamManager.onClientConnect(clientId, connection);

    connection.socket.on("message", (raw) => {
      const msg = JSON.parse(raw.toString());
      marketStreamManager.handleClientMessage(clientId, msg);
    });

    connection.socket.on("close", () => {
      marketStreamManager.onClientDisconnect(clientId);
    });
  });
}
```

**Code review & cleanup before continuing**

- [ ] Confirm the WS route path is `/ws/markets` (or matches config).
- [ ] Confirm TypeScript types compile (FastifyInstance, connection type).
- [ ] Confirm JSON parsing has basic error handling / logging.
- [ ] Confirm no unnecessary global state is added here.

---

## 3. Backend: Stream Manager (In-Memory)

**File:** `apps/backend/src/services/marketStreamManager.ts`  
**Goal:** Track client subscriptions and decide when to subscribe/unsubscribe from Binance.

**Key steps**

- Define types: `ClientId`, `StreamKey`, `ClientMessage`.
- Maintain module-level maps:
  - `streams: Map<StreamKey, { subscribers: Set<ClientId> }>`
  - `clientStreams: Map<ClientId, Set<StreamKey>>`
- Public API:
  - `onClientConnect(clientId, connection)`
  - `onClientDisconnect(clientId)`
  - `handleClientMessage(clientId, msg)`
  - `handleExchangeTick(streamKey, tick)`

**Minimal sketch (example)**

```ts
// apps/backend/src/services/marketStreamManager.ts
import type { TradeTick } from "../../common/types/marketData";
import { binanceStreamClient } from "./exchanges/binanceStreamClient";

type ClientId = string;
type StreamKey = string;

interface ClientMessage {
  type: "subscribe" | "unsubscribe";
  exchange: "binance";
  channel: "trades";
  symbol: string;
}

const streams = new Map<StreamKey, { subscribers: Set<ClientId> }>();
const clientStreams = new Map<ClientId, Set<StreamKey>>();

export const marketStreamManager = {
  onClientConnect(clientId: ClientId, connection: any) {
    // track connection reference if needed
  },
  onClientDisconnect(clientId: ClientId) {
    // remove client from all streams and possibly trigger unsubscribes
  },
  handleClientMessage(clientId: ClientId, msg: ClientMessage) {
    // update maps and call binanceStreamClient as needed
  },
  handleExchangeTick(streamKey: StreamKey, tick: TradeTick) {
    // fan out tick to all subscribed client connections
  },
};
```

**Code review & cleanup before continuing**

- [ ] Confirm there is no Fastify import here (pure TS).
- [ ] Confirm maps are updated correctly on subscribe/unsubscribe/disconnect.
- [ ] Confirm clients are removed from all sets on disconnect (no leaks).
- [ ] Confirm streamKey format is consistent with `binanceStreamClient`.

---

## 4. Backend: Binance Stream Client

**File:** `apps/backend/src/services/exchanges/binanceStreamClient.ts`  
**Shared types:** `apps/common/types/marketData.ts`  
**Goal:** Maintain WS connection(s) to Binance, manage symbol subscriptions, emit normalized `TradeTick`s.

**Key steps**

- Define shared types:

```ts
// apps/common/types/marketData.ts
export type ExchangeId = "binance";

export type TradeTick = {
  exchange: ExchangeId;
  symbol: string;
  price: number;
  size: number;
  side: "buy" | "sell";
  ts: number;
};
```

- Implement `binanceStreamClient` API:

```ts
// apps/backend/src/services/exchanges/binanceStreamClient.ts
import type { TradeTick } from "../../../common/types/marketData";

export const binanceStreamClient = {
  init(config: unknown) {
    // open underlying WS connection(s)
  },
  subscribeTrades(symbol: string, onTick: (tick: TradeTick) => void) {
    // register symbol subscription + callback
  },
  unsubscribeTrades(symbol: string) {
    // unregister and close when last subscriber leaves
  },
};
```

**Code review & cleanup before continuing**

- [ ] Confirm config/logging follow existing patterns.
- [ ] Confirm all `TradeTick` fields are correctly populated.
- [ ] Confirm error/reconnect cases are logged and don’t crash the process.
- [ ] Confirm no DB/Redis logic is introduced.

---

## 5. Backend: Wiring in `index.ts`

**File:** `apps/backend/src/index.ts`  
**Goal:** Register the WS plugin and init Binance without breaking existing routes.

**Key steps**

- Register the plugin under `/ws` with a feature flag:

```ts
import { marketStreamPlugin } from "./plugins/marketStreamPlugin";

if (process.env.LIVE_STREAM_ENABLED === "true") {
  app.register(marketStreamPlugin, { prefix: "/ws" });
}
```

- Call `binanceStreamClient.init(config)` during boot, using existing config patterns.

**Code review & cleanup before continuing**

- [ ] Confirm existing REST routes still work (smoke test).
- [ ] Confirm `/ws/markets` only exists when flag is enabled.
- [ ] Confirm TypeScript build passes, no new circular deps.

---

## 6. Frontend: Live Route & Store

**Files (example)**

- Route: `apps/frontend/src/app/live-test/page.tsx` (or `pages/live-test.tsx`)
- Store: `apps/frontend/src/stores/liveMarketStore.ts`

**Goal:** Lab-style route that displays live ticks.

**Key steps**

- Create a small store:

```ts
// apps/frontend/src/stores/liveMarketStore.ts
import type { TradeTick } from "../../common/types/marketData";

export interface LiveMarketState {
  latestBySymbol: Record<string, TradeTick | undefined>;
  feedBySymbol: Record<string, TradeTick[]>;
}
```

- Add helpers to:
  - Update `latestBySymbol[symbol]` on each tick.
  - Maintain a bounded `feedBySymbol[symbol]` history.

**Code review & cleanup before continuing**

- [ ] Confirm store follows existing state-management conventions.
- [ ] Confirm types come from the shared common package.
- [ ] Confirm no localStorage/DB persistence is wired in.

---

## 7. Frontend: WebSocket Hook & Live-Test Page

**Files (example)**

- Hook: `apps/frontend/src/hooks/useMarketStream.ts`
- Page: `apps/frontend/src/app/live-test/page.tsx`
- Components: `apps/frontend/src/components/markets/LiveTickerGrid.tsx` (optional)

**Goal:** Open the WS, subscribe to a few symbols, render a simple live grid/tape.

**Key steps**

- `useMarketStream`:
  - Connect to `ws(s)://<API_BASE>/ws/markets`.
  - Expose `subscribe` / `unsubscribe`.
  - Push incoming ticks into `liveMarketStore`.
- `live-test` page:
  - On mount: subscribe to a small fixed list (e.g. BTCUSDT, ETHUSDT).
  - Use the same layout shell + design system as the rest of the app.
  - Render a simple table: symbol, last price, side, timestamp.

**Code review & cleanup before continuing**

- [ ] Confirm WS URL uses the standard env/config pattern.
- [ ] Confirm hook cleans up on unmount (unsubscribe / close socket if needed).
- [ ] Confirm page looks native and clearly labeled as “Lab” or “Live Test”.

---

## 8. Safety Rails & Ops

**Goal:** Keep the feature safe and easy to disable.

**Key steps**

- Backend env flag: `LIVE_STREAM_ENABLED=true|false`; when false, don’t register the WS plugin.
- Frontend: optionally hide `/live-test` from primary nav; expose under a Labs/internal link.
- Keep everything in-memory only (no DB/Redis imports).

**Code review & cleanup (final pass)**

- [ ] Confirm toggling `LIVE_STREAM_ENABLED` off removes the WS entrypoint.
- [ ] Confirm logs/metrics follow existing observability patterns.
- [ ] Confirm no billing/auth/critical code paths are modified beyond normal reuse.
