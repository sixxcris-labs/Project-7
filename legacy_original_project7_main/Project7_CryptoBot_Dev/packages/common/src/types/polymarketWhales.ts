export interface PolymarketTrade {
  txHash: string;
  trader: string;
  marketId: string;
  price: number;
  size: number;
  notional: number; // price * size, in base currency (e.g., USDC)
  side: 'buy' | 'sell';
  timestamp: number; // ms since epoch
}

export interface WhaleTradeSample extends PolymarketTrade {}

export interface WhaleStats {
  trader: string;
  totalSize: number;
  totalNotional: number;
  tradeCount: number;
  markets: string[];
  lastSeen: number;
  sampleTrades: WhaleTradeSample[];
}

export interface WhaleSummary extends WhaleStats {
  explorerUrl: string;
}

export interface GetPolymarketWhalesResponse {
  whales: WhaleSummary[];
}

export interface PolymarketWhaleWatcherConfig {
  feedUrl: string; // default wss://clob.polymarket.com/feed
  minSize: number;
  reconnectMinDelayMs: number;
  reconnectMaxDelayMs: number;
}

export interface PolymarketWhaleTrackerConfig {
  notionalThreshold: number;
  maxSampleTrades: number;
  maxWhales: number;
  explorerBaseUrl: string; // default https://polygonscan.com/address
}
