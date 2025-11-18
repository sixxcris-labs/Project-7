import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import EventEmitter from 'events';
import type { QuoteSnapshot } from '@common/types/quotes';
import { QuoteService } from '../QuoteService';
import type { PolygonWebSocketClient } from '../../../integrations/polygon/PolygonWebSocketClient';

class FakeClient extends EventEmitter {
  public started = false;
  start() {
    this.started = true;
  }
  stop() {
    this.started = false;
  }
}

describe('QuoteService', () => {
  let client: FakeClient & PolygonWebSocketClient;

  beforeEach(() => {
    client = new FakeClient() as FakeClient & PolygonWebSocketClient;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores quotes from polygon client', () => {
    const service = new QuoteService({ client, ttlMs: 10_000 });
    service.start();

    client.emit('quote', {
      symbol: 'BTC-USD',
      bid: 50000,
      ask: 50010,
      ts: Date.now(),
    });

    const quotes = service.getQuotes();
    expect(quotes).toHaveLength(1);
    expect(quotes[0].symbol.id).toBe('BTC-USD');
  });

  it('expires stale quotes', async () => {
    vi.useFakeTimers();
    const service = new QuoteService({ client, ttlMs: 1_000 });
    service.start();

    client.emit('quote', {
      symbol: 'ETH-USD',
      bid: 3000,
      ask: 3010,
      ts: Date.now(),
    });

    await vi.advanceTimersByTimeAsync(1_500);
    expect(service.getQuotes()).toHaveLength(0);
  });

  it('falls back to defaults when disabled', () => {
    const fallback: QuoteSnapshot[] = [
      {
        exchange: 'polygon',
        symbol: { base: 'BTC', quote: 'USD', id: 'BTC-USD' },
        bid: 1,
        ask: 2,
        mid: 1.5,
        spread: 1,
        ts: 0,
        source: 'mock',
      },
    ];
    const service = new QuoteService({ fallbackQuotes: fallback });
    service.start();
    expect(service.getQuotes()).toEqual(fallback);
  });
});
