import type { ExchangeId, NormalizedSymbol, AccountSnapshot } from '@common/types/exchange';
import type { OrderBookSnapshot, ExchangeTradeTick } from '@common/types/marketData';
import type { PlaceOrderRequest, PlaceOrderResponse, CancelOrderRequest, CancelOrderResponse } from '@common/types/trading';

export interface ExchangeAdapter {
  id: ExchangeId;
  fetchOrderBook(symbol: NormalizedSymbol): Promise<OrderBookSnapshot>;
  fetchRecentTrades(symbol: NormalizedSymbol): Promise<ExchangeTradeTick[]>;
  placeOrder(request: PlaceOrderRequest): Promise<PlaceOrderResponse>;
  cancelOrder(request: CancelOrderRequest): Promise<CancelOrderResponse>;
  getAccountSnapshot(): Promise<AccountSnapshot>;
}
