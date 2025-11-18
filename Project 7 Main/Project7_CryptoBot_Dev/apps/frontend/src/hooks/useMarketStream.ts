import { useCallback, useEffect, useRef, useState } from "react";
import type { StreamSubscribeMessage, StreamTradeTick } from "@common/types/marketData";
import { useLiveMarketStore } from "../stores/liveMarketStore";

type Status = "connecting" | "open" | "reconnecting";

const WS_PATH = "/ws/markets";

function buildWsUrl() {
  const explicit = process.env.NEXT_PUBLIC_WS_BASE?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "") + WS_PATH;
  }
  const httpBase = process.env.NEXT_PUBLIC_API_BASE?.trim();
  if (httpBase) {
    const normalized = httpBase.replace(/\/$/, "");
    return normalized.replace(/^http/, "ws") + WS_PATH;
  }
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}${WS_PATH}`;
  }
  return `ws://localhost:8080${WS_PATH}`;
}

export function useMarketStream() {
  const addTick = useLiveMarketStore((state) => state.upsertTick);
  const [status, setStatus] = useState<Status>("connecting");
  const socketRef = useRef<WebSocket | null>(null);
  const pending = useRef<StreamSubscribeMessage[]>([]);
  const activeSubs = useRef<Map<string, StreamSubscribeMessage>>(new Map());

  const send = useCallback((msg: StreamSubscribeMessage) => {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(msg));
    } else {
      pending.current.push(msg);
    }
  }, []);

  const handleMessage = useCallback(
    (event: MessageEvent<string>) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "tick") {
          addTick(data.payload as StreamTradeTick);
        }
      } catch (err) {
        console.warn("Invalid market stream payload", err);
      }
    },
    [addTick],
  );

  const connect = useCallback(() => {
    const url = buildWsUrl();
    const ws = new WebSocket(url);
    socketRef.current = ws;
    setStatus((prev) => (prev === "connecting" ? "connecting" : "reconnecting"));

    ws.onopen = () => {
      setStatus("open");
      activeSubs.current.forEach((msg) => ws.send(JSON.stringify(msg)));
      while (pending.current.length) {
        const msg = pending.current.shift();
        if (msg) ws.send(JSON.stringify(msg));
      }
    };

    ws.onmessage = handleMessage;

    const scheduleReconnect = () => {
      setStatus("reconnecting");
      setTimeout(() => connect(), 1000);
    };

    ws.onerror = () => {
      ws.close();
    };
    ws.onclose = scheduleReconnect;
  }, [handleMessage]);

  useEffect(() => {
    connect();
    return () => {
      socketRef.current?.close();
    };
  }, [connect]);

  const subscribe = useCallback(
    (payload: Omit<StreamSubscribeMessage, "type">) => {
      const msg: StreamSubscribeMessage = { type: "subscribe", ...payload };
      const key = `${payload.exchange}:${payload.channel}:${payload.symbol}`;
      activeSubs.current.set(key, msg);
      send(msg);
    },
    [send],
  );

  const unsubscribe = useCallback(
    (payload: Omit<StreamSubscribeMessage, "type">) => {
      const msg: StreamSubscribeMessage = { type: "unsubscribe", ...payload };
      const key = `${payload.exchange}:${payload.channel}:${payload.symbol}`;
      activeSubs.current.delete(key);
      send(msg);
    },
    [send],
  );

  return { status, subscribe, unsubscribe };
}
