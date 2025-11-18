import { BinanceHttpClient } from './BinanceHttpClient.js';
import { BinanceConfig } from './BinanceConfig.js';
import type {
  OrderBookSnapshot,
  ExchangeTradeTick,
} from '@common/types/marketData';
import type { ExchangeId, NormalizedSymbol } from '@common/types/exchange';

const exchange: ExchangeId = 'binance';

const normalizeSymbol = (raw: string): NormalizedSymbol => {
  const upper = raw.toUpperCase();
  const base = upper.slice(0, -4);
  const quote = upper.slice(-4);
  return { base, quote, id: `${base}-${quote}` };
};

const toRawSymbol = (id: string): string => id.replace(/[-_]/g, '').toUpperCase();

interface DepthResponse {
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
}

interface TradeResponse {
  id: number;
  price: string;
  qty: string;
  isBuyerMaker: boolean;
  time: number;
}

export class BinanceMarketDataStream {
  private interval?: NodeJS.Timeout;
  private readonly orderBooks = new Map<string, OrderBookSnapshot>();
  private readonly trades = new Map<string, ExchangeTradeTick[]>();

  constructor(private readonly http: BinanceHttpClient, private readonly config: BinanceConfig) {}

  public start(): void {
    if (this.interval) return;
    this.refresh().catch((err) => console.error('Binance MD initial fetch failed', err));
    this.interval = setInterval(() => {
      this.refresh().catch((err) => console.error('Binance MD refresh failed', err));
    }, this.config.pollIntervalMs);
  }

  public stop(): void {
    if (this.interval) clearInterval(this.interval);
    this.interval = undefined;
  }

  private async refresh(): Promise<void> {
    await Promise.all(this.config.symbols.map((symbol) => this.refreshSymbol(symbol)));
  }

  public async refreshSymbol(symbolId: string): Promise<void> {
    await Promise.all([this.fetchDepth(symbolId), this.fetchTrades(symbolId)]);
  }

  private async fetchDepth(symbol: string): Promise<void> {
    const depth = await this.http.get<DepthResponse>('/api/v3/depth', { symbol, limit: 20 });
    const normalized = normalizeSymbol(symbol);
    const snapshot: OrderBookSnapshot = {
      exchange,
      symbol: normalized,
      lastUpdateId: depth.lastUpdateId,
      bids: depth.bids.map(([price, size]) => ({ price: Number(price), size: Number(size) })),
      asks: depth.asks.map(([price, size]) => ({ price: Number(price), size: Number(size) })),
      ts: Date.now(),
    };
    this.orderBooks.set(normalized.id, snapshot);
  }

  private async fetchTrades(symbol: string): Promise<void> {
    const trades = await this.http.get<TradeResponse[]>('/api/v3/trades', { symbol, limit: 20 });
    const normalized = normalizeSymbol(symbol);
    const mapped: ExchangeTradeTick[] = trades.map((t) => ({
      exchange,
      symbol: normalized,
      tradeId: String(t.id),
      ts: Number(t.time),
      side: t.isBuyerMaker ? 'sell' : 'buy',
      price: Number(t.price),
      size: Number(t.qty),
    }));
    this.trades.set(normalized.id, mapped);
  }

  public getOrderBook(symbolId: string): OrderBookSnapshot | undefined {
    return this.orderBooks.get(symbolId);
  }

  public getTrades(symbolId: string): ExchangeTradeTick[] {
    return this.trades.get(symbolId) ?? [];
  }
}
