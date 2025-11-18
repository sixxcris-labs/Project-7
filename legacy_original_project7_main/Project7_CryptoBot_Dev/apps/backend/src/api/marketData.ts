import { FastifyPluginAsync } from 'fastify';
import { MarketDataService } from '../services/marketData/MarketDataService.js';
import type { TradeTick } from '@common/types/marketData';

export interface MarketDataPluginOptions {
  service: MarketDataService;
}

// Extend FastifyInstance to include marketDataService
declare module 'fastify' {
  interface FastifyInstance {
    marketDataService?: MarketDataService;
  }
}

const plugin: FastifyPluginAsync<MarketDataPluginOptions> = async (app, opts) => {
  // Store service on app instance for access in routes
  app.decorate('marketDataService', opts.service);
  const service = opts.service;

  app.get('/orderbook', async (req, res) => {
    const symbol = (req.query as any)?.symbol as string;
    if (!symbol) {
      res.status(400);
      return { error: 'symbol query param required (e.g. symbol=BTC-USDT)' };
    }
    const key = symbol.toUpperCase();
    let snapshot = service.getOrderBook(key);
    if (!snapshot) {
      // Try to fetch once on-demand if cache is empty
      try {
        await service.refreshSymbol(key);
        snapshot = service.getOrderBook(key);
      } catch (e) {
        // ignore and fall through to 404
      }
    }
    if (!snapshot) {
      res.status(404);
      return { error: `No order book data for ${symbol}` };
    }
    return snapshot;
  });

  app.get('/trades', async (req, res) => {
    const symbol = (req.query as any)?.symbol as string;
    if (!symbol) {
      res.status(400);
      return { error: 'symbol query param required (e.g. symbol=BTC-USDT)' };
    }
    const key = symbol.toUpperCase();
    let ticks = service.getTrades(key);
    if (!ticks.length) {
      try {
        await service.refreshSymbol(key);
        ticks = service.getTrades(key);
      } catch (e) {
        // ignore
      }
    }
    const baseTicks: TradeTick[] = ticks.map((t) => ({
      tradeId: t.tradeId,
      ts: t.ts,
      side: t.side,
      price: t.price,
      size: t.size,
    }));
    return baseTicks;
  });

  app.get('/quotes', async (req) => {
    const rawSymbols = (req.query as any)?.symbols as string | undefined;
    const symbols =
      rawSymbols?.split(',').map((symbol) => symbol.trim().toUpperCase()).filter(Boolean) ?? undefined;
    const quotes = service.getQuotes(symbols);
    return { quotes };
  });
};

export default plugin;
