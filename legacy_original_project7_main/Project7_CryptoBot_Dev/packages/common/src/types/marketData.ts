// ---------------------------------------------------------
// BASE TYPES
// ---------------------------------------------------------

export type TradeSide = "buy" | "sell";

export type TradeTick = {
  tradeId: string | number;
  ts: number;
  side: TradeSide;
  price: number;
  size: number;
};


// ---------------------------------------------------------
// EXCHANGE-EXTENDED TYPES
// ---------------------------------------------------------

import type { ExchangeId, NormalizedSymbol } from "./exchange";

export type ExchangeTradeTick = TradeTick & {
  exchange: ExchangeId;
  symbol: NormalizedSymbol;
};


// ---------------------------------------------------------
// ORDERBOOK
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
  ts: number;
};


// ---------------------------------------------------------
// SUBSCRIPTION
// ---------------------------------------------------------

export type MarketDataSubscription = {
  exchange: ExchangeId;
  symbol: string;
  depthLevels?: number;
};


// ---------------------------------------------------------
// STREAMING
// ---------------------------------------------------------

export type StreamChannel = "trades" | "orderbook" | string;

export type StreamSubscribeMessage = {
  type: "subscribe" | "unsubscribe";
  exchange: ExchangeId;
  channel: StreamChannel;
  symbol: string;
};

export type StreamTradeTick = TradeTick & {
  exchange: ExchangeId;
  symbol: string;
  channel?: StreamChannel;
};
