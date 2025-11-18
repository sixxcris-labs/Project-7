import type { ExchangeId, NormalizedSymbol } from './exchange';

export type QuoteTicker = {
  exchange: ExchangeId;
  symbol: NormalizedSymbol;
  bid: number;
  ask: number;
  lastPrice?: number;
  ts: number;
};

export type QuoteSnapshot = QuoteTicker & {
  spread: number;
  mid: number;
  source: 'polygon' | 'mock';
};
