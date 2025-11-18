export type NormalizedBar = {
  type: "bar";
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ts: number;
};

export type NormalizedTrade = {
  type: "trade";
  symbol: string;
  price: number;
  size: number;
  side: "buy" | "sell";
  ts: number;
};
