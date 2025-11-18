import type { StreamSubscribeMessage, StreamTradeTick } from "@common/types/marketData";
import type WebSocket from "ws";
import { binanceStreamClient } from "./exchanges/binanceStreamClient";

type ClientId = string;
type StreamKey = string;

interface StreamState {
  key: StreamKey;
  subscribers: Set<ClientId>;
  lastMessage?: StreamTradeTick;
  ringBuffer: StreamTradeTick[];
  unsubscribe?: () => void;
}

const streams = new Map<StreamKey, StreamState>();
const clientStreams = new Map<ClientId, Set<StreamKey>>();
const clientSockets = new Map<ClientId, WebSocket>();
const RING_BUFFER_MAX = 200;

function createStreamKey(msg: StreamSubscribeMessage): StreamKey {
  return `${msg.exchange}:${msg.channel}:${msg.symbol}`;
}

function ensureState(streamKey: StreamKey): StreamState {
  if (!streams.has(streamKey)) {
    const state: StreamState = { key: streamKey, subscribers: new Set(), ringBuffer: [] };
    streams.set(streamKey, state);
  }
  return streams.get(streamKey)!;
}

function emitTick(state: StreamState, tick: StreamTradeTick) {
  state.lastMessage = tick;
  state.ringBuffer.push(tick);
  if (state.ringBuffer.length > RING_BUFFER_MAX) {
    state.ringBuffer.shift();
  }

  const payload = JSON.stringify({ type: "tick", payload: tick, stream: state.key });

  for (const clientId of state.subscribers) {
    const socket = clientSockets.get(clientId);
    if (socket && socket.readyState === socket.OPEN) {
      socket.send(payload);
    }
  }
}

function subscribeSymbol(msg: StreamSubscribeMessage) {
  const streamKey = createStreamKey(msg);
  const state = ensureState(streamKey);
  if (!state.unsubscribe) {
    state.unsubscribe = binanceStreamClient.subscribeTrades(msg.symbol, (tick) => {
      emitTick(state, tick);
    });
  }
  return state;
}

export const marketStreamManager = {
  onClientConnect(clientId: ClientId, socket: WebSocket) {
    clientSockets.set(clientId, socket);
  },

  onClientDisconnect(clientId: ClientId) {
    const streamsForClient = clientStreams.get(clientId);
    if (streamsForClient) {
      for (const key of Array.from(streamsForClient)) {
        this.handleClientMessage(clientId, {
          type: "unsubscribe",
          exchange: key.split(":")[0] as StreamSubscribeMessage["exchange"],
          channel: key.split(":")[1] as StreamSubscribeMessage["channel"],
          symbol: key.split(":")[2],
        });
      }
    }
    clientSockets.delete(clientId);
    clientStreams.delete(clientId);
  },

  handleClientMessage(clientId: ClientId, msg: StreamSubscribeMessage) {
    if (msg.channel !== "trades" || msg.exchange !== "binance") {
      return;
    }
    const streamKey = createStreamKey(msg);
    if (msg.type === "subscribe") {
      const state = subscribeSymbol(msg);
      state.subscribers.add(clientId);
      const list = clientStreams.get(clientId) ?? new Set();
      list.add(streamKey);
      clientStreams.set(clientId, list);
    } else {
      const state = streams.get(streamKey);
      if (!state) return;
      state.subscribers.delete(clientId);
      const list = clientStreams.get(clientId);
      list?.delete(streamKey);
      if (list && list.size === 0) {
        clientStreams.delete(clientId);
      }
      if (state.subscribers.size === 0) {
        state.unsubscribe?.();
        streams.delete(streamKey);
      }
    }
  },

  onExchangeTick(streamKey: StreamKey, tick: StreamTradeTick) {
    const state = streams.get(streamKey);
    if (!state) return;
    emitTick(state, tick);
  },

  isClientSubscribed(clientId: ClientId, streamKey: StreamKey) {
    const list = clientStreams.get(clientId);
    return !!list && list.has(streamKey);
  },

  handleClientError(clientId: ClientId, err: Error) {
    const socket = clientSockets.get(clientId);
    if (socket && socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify({ type: "error", message: err.message }));
    }
  },
};
