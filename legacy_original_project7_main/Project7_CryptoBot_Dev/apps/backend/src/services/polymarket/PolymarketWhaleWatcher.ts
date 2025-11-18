import EventEmitter from 'events';
import WebSocket from 'ws';
import type {
  PolymarketTrade,
  PolymarketWhaleWatcherConfig,
} from '../../../../../packages/common/src/types/polymarketWhales';

export interface WhaleEvent {
  trade: PolymarketTrade;
}

export type PolymarketWhaleWatcherEvents = {
  whaleTrade: (event: WhaleEvent) => void;
  connected: () => void;
  disconnected: (reason?: string) => void;
  error: (err: Error) => void;
};

type Listener<T> = T[keyof T];

export class PolymarketWhaleWatcher extends EventEmitter {
  private ws: WebSocket | null = null;
  private closed = false;
  private reconnectDelayMs: number;
  private readonly config: PolymarketWhaleWatcherConfig;

  constructor(config: PolymarketWhaleWatcherConfig) {
    super();
    this.config = config;
    this.reconnectDelayMs = config.reconnectMinDelayMs;
  }

  public start(): void {
    this.closed = false;
    this.connect();
  }

  public stop(): void {
    this.closed = true;
    if (this.ws) {
      this.ws.close();
      this.ws.removeAllListeners();
      this.ws = null;
    }
  }

  private connect(): void {
    const { feedUrl } = this.config;
    const ws = new WebSocket(feedUrl);
    this.ws = ws;

    ws.on('open', () => {
      this.reconnectDelayMs = this.config.reconnectMinDelayMs;
      this.emit('connected');
      ws.send(JSON.stringify({ type: 'subscribe', channels: ['trades'] }));
    });

    ws.on('message', (raw: WebSocket.RawData) => {
      try {
        this.handleMessage(raw.toString());
      } catch (err) {
        this.emit('error', err as Error);
      }
    });

    ws.on('close', (code, reason) => {
      this.emit('disconnected', `${code} ${reason.toString()}`);
      if (!this.closed) {
        this.scheduleReconnect();
      }
    });

    ws.on('error', (err) => {
      this.emit('error', err as Error);
    });
  }

  private scheduleReconnect(): void {
    if (this.closed) return;
    const delay = this.reconnectDelayMs;
    this.reconnectDelayMs = Math.min(
      this.reconnectDelayMs * 2,
      this.config.reconnectMaxDelayMs,
    );
    setTimeout(() => {
      if (!this.closed) {
        this.connect();
      }
    }, delay);
  }

  private handleMessage(payload: string): void {
    const msg = JSON.parse(payload);

    if (msg.type !== 'trade') return;

    const tradeSize = Number(msg.size);
    if (!Number.isFinite(tradeSize) || tradeSize < this.config.minSize) {
      return;
    }

    const price = Number(msg.price);
    const notional = price * tradeSize;

    const trade: PolymarketTrade = {
      txHash: msg.txHash ?? msg.transactionHash ?? '',
      trader: msg.trader ?? msg.maker ?? '',
      marketId: msg.marketId ?? msg.market_id ?? '',
      price,
      size: tradeSize,
      notional,
      side: msg.side === 'sell' ? 'sell' : 'buy',
      timestamp: (msg.timestamp ?? msg.ts ?? Date.now()) as number,
    };

    this.emit('whaleTrade', { trade });
  }

  public override on<E extends keyof PolymarketWhaleWatcherEvents>(
    event: E,
    listener: PolymarketWhaleWatcherEvents[E],
  ) {
    return super.on(event, listener as Listener<PolymarketWhaleWatcherEvents>);
  }

  public override once<E extends keyof PolymarketWhaleWatcherEvents>(
    event: E,
    listener: PolymarketWhaleWatcherEvents[E],
  ) {
    return super.once(event, listener as Listener<PolymarketWhaleWatcherEvents>);
  }
}
