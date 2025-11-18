import type { ExchangeId, NormalizedSymbol, AccountSnapshot } from './exchange';

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit';
export type TimeInForce = 'GTC' | 'IOC' | 'FOK';

export interface PlaceOrderRequest {
  exchange: ExchangeId;
  symbol: NormalizedSymbol;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number;
  tif?: TimeInForce;
  clientOrderId?: string;
  meta?: Record<string, unknown>;
}

export interface PlaceOrderResponse {
  exchange: ExchangeId;
  orderId: string;
  clientOrderId?: string;
  status: 'NEW' | 'FILLED' | 'PARTIALLY_FILLED' | 'REJECTED';
  executedQty: number;
  avgPrice?: number;
  ts: number;
  raw?: unknown;
}

export interface CancelOrderRequest {
  exchange: ExchangeId;
  symbol: NormalizedSymbol;
  orderId?: string;
  clientOrderId?: string;
}

export interface CancelOrderResponse {
  exchange: ExchangeId;
  orderId: string;
  clientOrderId?: string;
  status: 'CANCELED' | 'NOT_FOUND';
  ts: number;
  raw?: unknown;
}

export { AccountSnapshot };
