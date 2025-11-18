import EventEmitter from 'events';
import WebSocket from 'ws';
import type { PolygonConfig } from './PolygonConfig';

export type PolygonQuote = {
  symbol: string;
  bid: number;
  ask: number;
  lastPrice?: number;
  ts: number;
};

export type PolygonStatusMessage = {
  ev: 'status';
  status: string;
  message: string;
};

export type PolygonQuoteMessage = {
  ev: 'XA';
  pair: string;
  bp: number;
  ap: number;
  lastPrice?: number;
  t?: number;
};

type PolygonStreamMessage = PolygonStatusMessage | PolygonQuoteMessage | Record<string, unknown>;

type WebSocketLike = Pick<WebSocket, 'send' | 'close' | 'readyState' | 'terminate'> & EventEmitter;

type WebSocketFactory = (url: string) => WebSocketLike;

const DEFAULT_FACTORY: WebSocketFactory = (url) => new WebSocket(url) as WebSocketLike;

export class PolygonWebSocketClient extends EventEmitter {
  private socket: WebSocketLike | null = null;
  private reconnectTimer?: NodeJS.Timeout;
  private currentDelay: number;
  private stopped = false;

  constructor(
    private readonly config: PolygonConfig,
    private readonly factory: WebSocketFactory = DEFAULT_FACTORY,
  ) {
    super();
    this.currentDelay = config.reconnectMinDelayMs;
  }

  start(): void {
    if (!this.config.enabled || this.socket || this.stopped) {
      return;
    }
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.close();
      this.socket = null;
    }
  }

  private connect(): void {
    if (!this.config.enabled) {
      return;
    }
    this.socket = this.factory(this.config.streamUrl);
    const socket = this.socket;
    socket.on('open', () => this.onOpen(socket));
    socket.on('close', () => this.scheduleReconnect());
    socket.on('error', () => this.scheduleReconnect());
    socket.on('message', (data: WebSocket.RawData) => this.onMessage(data));
  }

  private onOpen(socket: WebSocketLike): void {
    this.currentDelay = this.config.reconnectMinDelayMs;
    if (!this.config.apiKey) {
      return;
    }
    socket.send(
      JSON.stringify({
        action: 'auth',
        params: this.config.apiKey,
      }),
    );
    const channels = this.config.symbols.map((symbol) => `XA.${symbol}`);
    if (channels.length) {
      socket.send(
        JSON.stringify({
          action: 'subscribe',
          params: channels.join(','),
        }),
      );
    }
  }

  private onMessage(payload: WebSocket.RawData): void {
    let messages: PolygonStreamMessage[] = [];
    try {
      const text = typeof payload === 'string' ? payload : payload.toString('utf8');
      const parsed = JSON.parse(text);
      messages = Array.isArray(parsed) ? parsed : [parsed];
    } catch (err) {
      this.emit('error', err);
      return;
    }

    messages.forEach((message) => {
      if ((message as PolygonStatusMessage).ev === 'status') {
        this.emit('status', message);
        return;
      }

      const quote = message as PolygonQuoteMessage;
      if (quote.ev !== 'XA') {
        return;
      }

      const symbol = normalizeSymbol(quote.pair);
      if (!symbol) {
        return;
      }

      this.emit('quote', {
        symbol,
        bid: quote.bp ?? 0,
        ask: quote.ap ?? 0,
        lastPrice: quote.lastPrice,
        ts: quote.t ?? Date.now(),
      } as PolygonQuote);
    });
  }

  private scheduleReconnect(): void {
    if (this.stopped) {
      return;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.socket?.removeAllListeners();
    this.socket = null;
    this.reconnectTimer = setTimeout(() => {
      this.currentDelay = Math.min(
        this.currentDelay * 2,
        this.config.reconnectMaxDelayMs,
      );
      this.connect();
    }, this.currentDelay);
  }
}

function normalizeSymbol(raw: string | undefined): string | null {
  if (!raw) return null;
  const clean = raw.replace(/^X:/, '').replace(/_/g, '-').toUpperCase();
  if (!clean.includes('-')) {
    return null;
  }
  return clean;
}
