export interface NormalizedBar {
  source: "massive" | string;
  symbol: string;
  intervalMs: number;
  startTime: number;
  endTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
}

export interface NormalizedTrade {
  source: "massive" | string;
  symbol: string;
  tradeId: string;
  exchangeId: number;
  price: number;
  size: number;
  timestamp: number;
  tape?: number;
  conditions?: number[];
}
