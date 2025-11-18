import type { FastifyInstance } from 'fastify';
import { PolymarketWhaleWatcher } from './PolymarketWhaleWatcher';
import { PolymarketWhaleTracker } from './PolymarketWhaleTracker';
import {
  buildPolymarketTrackerConfig,
  buildPolymarketWatcherConfig,
  POLYMARKET_WHALES_ENABLED,
} from '../../config/polymarket';

export interface PolymarketWhaleContext {
  watcher: PolymarketWhaleWatcher;
  tracker: PolymarketWhaleTracker;
}

let context: PolymarketWhaleContext | null = null;

export function getPolymarketContext(): PolymarketWhaleContext | null {
  return context;
}

export async function initPolymarketWhales(app: FastifyInstance): Promise<void> {
  if (!POLYMARKET_WHALES_ENABLED) {
    app.log.info({ feature: 'POLYMARKET_WHALES' }, 'Polymarket whales disabled');
    context = null;
    return;
  }

  const watcherConfig = buildPolymarketWatcherConfig();
  const trackerConfig = buildPolymarketTrackerConfig();

  const watcher = new PolymarketWhaleWatcher(watcherConfig);
  const tracker = new PolymarketWhaleTracker(trackerConfig);

  watcher.on('connected', () => {
    app.log.info({ feature: 'POLYMARKET_WHALES' }, 'Polymarket WS connected');
  });

  watcher.on('disconnected', (reason) => {
    app.log.warn(
      { feature: 'POLYMARKET_WHALES', reason },
      'Polymarket WS disconnected',
    );
  });

  watcher.on('error', (err) => {
    app.log.error(
      { feature: 'POLYMARKET_WHALES', err },
      'Polymarket WS error',
    );
  });

  watcher.on('whaleTrade', ({ trade }) => {
    tracker.handleWhaleTrade(trade);
  });

  tracker.on('whalePromoted', ({ trader, stats }) => {
    app.log.info(
      {
        feature: 'POLYMARKET_WHALES',
        trader,
        totalNotional: stats.totalNotional,
        tradeCount: stats.tradeCount,
      },
      'Whale promoted',
    );
  });

  watcher.start();
  context = { watcher, tracker };
}
