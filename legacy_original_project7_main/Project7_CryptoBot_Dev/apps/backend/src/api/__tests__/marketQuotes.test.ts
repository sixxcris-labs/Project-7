import { describe, expect, it } from 'vitest';
import Fastify from 'fastify';
import plugin from '../marketData.js';

const mockQuote = {
  exchange: 'polygon',
  symbol: { base: 'BTC', quote: 'USD', id: 'BTC-USD' },
  bid: 10,
  ask: 11,
  spread: 1,
  mid: 10.5,
  ts: Date.now(),
  source: 'polygon',
};

describe('GET /api/market-data/quotes', () => {
  it('returns quotes for requested symbols', async () => {
    const service = {
      getQuotes: () => [mockQuote],
      getOrderBook: () => undefined,
      getTrades: () => [],
      refreshSymbol: async () => {},
    };
    const app = Fastify();
    await app.register(plugin, { service } as any);

    const response = await app.inject({
      method: 'GET',
      url: '/quotes?symbols=btc-usd',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ quotes: [mockQuote] });
  });

  it('returns empty array when no data', async () => {
    const service = {
      getQuotes: () => [],
      getOrderBook: () => undefined,
      getTrades: () => [],
      refreshSymbol: async () => {},
    };
    const app = Fastify();
    await app.register(plugin, { service } as any);
    const response = await app.inject({ method: 'GET', url: '/quotes' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ quotes: [] });
  });
});
