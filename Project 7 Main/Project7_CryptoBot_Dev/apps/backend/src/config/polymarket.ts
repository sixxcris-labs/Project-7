export const POLYMARKET_FEED_URL: string =
  process.env.POLYMARKET_FEED_URL ?? 'wss://clob.polymarket.com/feed';

export const POLYMARKET_MIN_SIZE: number = Number(
  process.env.POLYMARKET_MIN_SIZE ?? '1000',
);

export const POLYMARKET_NOTIONAL_THRESHOLD: number = Number(
  process.env.POLYMARKET_NOTIONAL_THRESHOLD ?? '25000',
);

export const POLYMARKET_MAX_SAMPLE_TRADES: number = Number(
  process.env.POLYMARKET_MAX_SAMPLE_TRADES ?? '20',
);

export const POLYMARKET_MAX_WHALES: number = Number(
  process.env.POLYMARKET_MAX_WHALES ?? '200',
);

export const POLYMARKET_EXPLORER_BASE_URL: string =
  process.env.POLYMARKET_EXPLORER_BASE_URL ?? 'https://polygonscan.com/address';

export const POLYMARKET_WHALES_ENABLED: boolean =
  (process.env.POLYMARKET_WHALES_ENABLED ?? 'false').toLowerCase() === 'true';

export function buildPolymarketWatcherConfig() {
  return {
    feedUrl: POLYMARKET_FEED_URL,
    minSize: POLYMARKET_MIN_SIZE,
    reconnectMinDelayMs: 1_000,
    reconnectMaxDelayMs: 30_000,
  };
}

export function buildPolymarketTrackerConfig() {
  return {
    notionalThreshold: POLYMARKET_NOTIONAL_THRESHOLD,
    maxSampleTrades: POLYMARKET_MAX_SAMPLE_TRADES,
    maxWhales: POLYMARKET_MAX_WHALES,
    explorerBaseUrl: POLYMARKET_EXPLORER_BASE_URL,
  };
}
