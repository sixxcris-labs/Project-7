import WebSocket from "ws";
import type { StreamTradeTick } from "@common/types/marketData";

type TickHandler = (tick: StreamTradeTick) => void;

const STREAM_URL = "wss://stream.binance.com:9443/ws";

const listeners = new Map<string, Set<TickHandler>>();
const refCounts = new Map<string, number>();
const subscribedSymbols = new Set<string>();

let ws: WebSocket | null = null;
let reconnectDelay = 1000;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

const ensureConnection = () => {
  if (ws && ws.readyState === WebSocket.OPEN) return;
  ws = new WebSocket(STREAM_URL);

  ws.on("open", () => {
    reconnectDelay = 1000;
    for (const symbol of subscribedSymbols) {
      sendSubscribe(symbol);
    }
  });

  ws.on("message", (data) => {
    try {
      const parsed = JSON.parse(data.toString());
      if (parsed.e === "trade") {
        const symbol = parsed.s as string;
        const tick: StreamTradeTick = {
          tradeId: parsed.t,
          exchange: "binance",
          symbol,
          price: Number(parsed.p),
          size: Number(parsed.q),
          side: parsed.m ? "sell" : "buy",
          ts: Number(parsed.T),
        };
        const key = symbol.toUpperCase();
        const set = listeners.get(key);
        if (set) {
          set.forEach((cb) => cb(tick));
        }
      }
    } catch (err) {
      console.warn("Failed to parse Binance message", err);
    }
  });

  ws.on("close", scheduleReconnect);
  ws.on("error", () => {
    ws?.terminate();
    scheduleReconnect();
  });
};

const scheduleReconnect = () => {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    reconnectDelay = Math.min(reconnectDelay * 2, 10000);
    ensureConnection();
  }, reconnectDelay);
};

const sendSubscribe = (symbol: string) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  const stream = `${symbol.toLowerCase()}@trade`;
  ws.send(JSON.stringify({ method: "SUBSCRIBE", params: [stream], id: Date.now() }));
};

const sendUnsubscribe = (symbol: string) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  const stream = `${symbol.toLowerCase()}@trade`;
  ws.send(JSON.stringify({ method: "UNSUBSCRIBE", params: [stream], id: Date.now() }));
};

const trackSymbol = (symbol: string) => {
  const key = symbol.toUpperCase();
  refCounts.set(key, (refCounts.get(key) ?? 0) + 1);
  if (refCounts.get(key) === 1) {
    subscribedSymbols.add(key);
    ensureConnection();
    sendSubscribe(key);
  }
};

const untrackSymbol = (symbol: string) => {
  const key = symbol.toUpperCase();
  const current = refCounts.get(key) ?? 0;
  if (current <= 1) {
    refCounts.delete(key);
    subscribedSymbols.delete(key);
    listeners.delete(key);
    sendUnsubscribe(key);
  } else {
    refCounts.set(key, current - 1);
  }
};

export const binanceStreamClient = {
  init() {
    ensureConnection();
  },
  subscribeTrades(symbol: string, handler: TickHandler) {
    const key = symbol.toUpperCase();
    if (!listeners.has(key)) {
      listeners.set(key, new Set());
    }
    listeners.get(key)!.add(handler);
    trackSymbol(key);

    return () => {
      listeners.get(key)?.delete(handler);
      if (!listeners.get(key)?.size) {
        untrackSymbol(key);
      }
    };
  },
  unsubscribeTrades(symbol: string, handler: TickHandler) {
    const key = symbol.toUpperCase();
    listeners.get(key)?.delete(handler);
    untrackSymbol(key);
  },
};
