import { describe, expect, it } from 'vitest';
import type { QuoteSnapshot } from '@common/types/quotes';
import { MarketDataService } from '../MarketDataService';

class FakeStream {
  public started = false;
  public refreshed: string | null = null;
  start() {
    this.started = true;
  }
  getOrderBook() {
    return undefined;
  }
  getTrades() {
    return [];
  }
  async refreshSymbol(symbolId: string) {
    this.refreshed = symbolId;
  }
}

class FakeQuoteService {
  public started = false;
  constructor(private readonly quotes: QuoteSnapshot[]) {}
  start() {
    this.started = true;
  }
  getQuotes() {
    return this.quotes;
  }
}

describe('MarketDataService', () => {
  it('delegates to quote service', () => {
    const stream = new FakeStream();
    const quotes: QuoteSnapshot[] = [
      {
        exchange: 'polygon',
        symbol: { base: 'BTC', quote: 'USD', id: 'BTC-USD' },
        bid: 10,
        ask: 11,
        spread: 1,
        mid: 10.5,
        ts: Date.now(),
        source: 'polygon',
      },
    ];
    const quoteService = new FakeQuoteService(quotes);
    const service = new MarketDataService(stream as any, quoteService as any);
    service.start();
    expect(stream.started).toBe(true);
    expect(quoteService.started).toBe(true);
    expect(service.getQuotes()).toEqual(quotes);
  });
});
