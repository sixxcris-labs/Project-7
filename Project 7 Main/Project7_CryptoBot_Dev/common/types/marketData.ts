// ---------------------------------------------------------
// BASE TYPES (shared between backend + frontend)
//
// These are exchange-agnostic raw forms.
// ---------------------------------------------------------

export type TradeSide = "buy" | "sell";

export type TradeTick = {
  tradeId: string | number;
  ts: number;          // epoch ms
  side: TradeSide;
  price: number;
  size: number;
};


// ---------------------------------------------------------
// EXCHANGE-EXTENDED TYPES
//
// These attach exchange + symbol metadata to base ticks.
// ---------------------------------------------------------

import type { ExchangeId, NormalizedSymbol } from "./exchange";

export type ExchangeTradeTick = TradeTick & {
  exchange: ExchangeId;
  symbol: NormalizedSymbol;
};


// ---------------------------------------------------------
// ORDER BOOK TYPES
// ---------------------------------------------------------

export type OrderBookLevel = {
  price: number;
  size: number;
};

export type OrderBookSnapshot = {
  exchange: ExchangeId;
  symbol: NormalizedSymbol;
  lastUpdateId: number;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  ts: number;              // epoch ms
};


// ---------------------------------------------------------
// MARKET DATA SUBSCRIPTION (SSE / WS API)
// ---------------------------------------------------------

export type MarketDataSubscription = {
  exchange: ExchangeId;
  symbol: string;
  depthLevels?: number;
};

// ---------------------------------------------------------
// LIVE STREAM TYPES
// ---------------------------------------------------------

export type StreamTradeTick = {
  exchange: ExchangeId;
  symbol: string;
  price: number;
  size: number;
  side: TradeSide;
  ts: number;
};

export type StreamSubscribeMessage = {
  type: "subscribe" | "unsubscribe";
  exchange: ExchangeId;
  channel: "trades" | "orderbook" | "ticker";
  symbol: string;
};
