import EventEmitter from 'events';
import type {
  PolymarketTrade,
  WhaleStats,
  WhaleSummary,
  PolymarketWhaleTrackerConfig,
} from '../../../../../packages/common/src/types/polymarketWhales';

export interface WhalePromotedEvent {
  trader: string;
  stats: WhaleStats;
}

export type PolymarketWhaleTrackerEvents = {
  whalePromoted: (event: WhalePromotedEvent) => void;
};

type Listener<T> = T[keyof T];

export class PolymarketWhaleTracker extends EventEmitter {
  private readonly config: PolymarketWhaleTrackerConfig;
  private readonly statsByTrader = new Map<string, WhaleStats>();
  private readonly promoted = new Set<string>();

  constructor(config: PolymarketWhaleTrackerConfig) {
    super();
    this.config = config;
  }

  public handleWhaleTrade(trade: PolymarketTrade): void {
    const now = trade.timestamp || Date.now();
    const trader = trade.trader.toLowerCase();

    const existing = this.statsByTrader.get(trader);
    const marketsSet = new Set<string>(existing?.markets ?? []);
    marketsSet.add(trade.marketId);

    const sampleTrades = existing?.sampleTrades ?? [];
    sampleTrades.push(trade);
    if (sampleTrades.length > this.config.maxSampleTrades) {
      sampleTrades.shift();
    }

    const updated: WhaleStats = {
      trader,
      totalSize: (existing?.totalSize ?? 0) + trade.size,
      totalNotional: (existing?.totalNotional ?? 0) + trade.notional,
      tradeCount: (existing?.tradeCount ?? 0) + 1,
      markets: Array.from(marketsSet),
      lastSeen: now,
      sampleTrades,
    };

    this.statsByTrader.set(trader, updated);

    if (
      updated.totalNotional >= this.config.notionalThreshold &&
      !this.promoted.has(trader)
    ) {
      this.promoted.add(trader);
      this.emit('whalePromoted', { trader, stats: updated });
    }

    this.trimIfNeeded();
  }

  public getTopWhales(limit: number): WhaleSummary[] {
    const clamped = Math.max(1, Math.min(limit, this.config.maxWhales));
    const all = Array.from(this.statsByTrader.values());
    all.sort((a, b) => b.totalNotional - a.totalNotional);

    return all.slice(0, clamped).map((s) => ({
      ...s,
      explorerUrl: this.buildExplorerUrl(s.trader),
    }));
  }

  public getWhalesAboveThreshold(limit: number): WhaleSummary[] {
    const clamped = Math.max(1, Math.min(limit, this.config.maxWhales));
    const filtered = Array.from(this.statsByTrader.values()).filter(
      (s) => s.totalNotional >= this.config.notionalThreshold,
    );

    filtered.sort((a, b) => b.totalNotional - a.totalNotional);

    return filtered.slice(0, clamped).map((s) => ({
      ...s,
      explorerUrl: this.buildExplorerUrl(s.trader),
    }));
  }

  private buildExplorerUrl(trader: string): string {
    return `${this.config.explorerBaseUrl}/${trader}`;
  }

  private trimIfNeeded(): void {
    if (this.statsByTrader.size <= this.config.maxWhales * 2) return;

    const all = Array.from(this.statsByTrader.values());
    all.sort((a, b) => b.totalNotional - a.totalNotional);
    const keep = new Set(all.slice(0, this.config.maxWhales).map((s) => s.trader));

    for (const trader of this.statsByTrader.keys()) {
      if (!keep.has(trader)) {
        this.statsByTrader.delete(trader);
        this.promoted.delete(trader);
      }
    }
  }

  public override on<E extends keyof PolymarketWhaleTrackerEvents>(
    event: E,
    listener: PolymarketWhaleTrackerEvents[E],
  ) {
    return super.on(event, listener as Listener<PolymarketWhaleTrackerEvents>);
  }

  public override once<E extends keyof PolymarketWhaleTrackerEvents>(
    event: E,
    listener: PolymarketWhaleTrackerEvents[E],
  ) {
    return super.once(event, listener as Listener<PolymarketWhaleTrackerEvents>);
  }
}
