export type ExchangeId = 'binance' | 'mock' | 'polygon' | 'bybit' | 'coinbase';

export interface NormalizedSymbol {
  base: string;
  quote: string;
  /** Combined identifier (e.g. BTC-USDT) */
  id: string;
}

export interface ExchangeMarket {
  exchange: ExchangeId;
  symbol: NormalizedSymbol;
  tickSize: number;
  stepSize: number;
  minNotional: number;
  makerFeeBps: number;
  takerFeeBps: number;
}

export interface ExchangeAccountBalance {
  asset: string;
  free: number;
  locked: number;
}

export interface ExchangePosition {
  symbol: NormalizedSymbol;
  size: number;
  entryPrice: number;
  pnl?: number;
}

export interface AccountSnapshot {
  exchange: ExchangeId;
  balances: ExchangeAccountBalance[];
  positions: ExchangePosition[];
  ts: number;
}
