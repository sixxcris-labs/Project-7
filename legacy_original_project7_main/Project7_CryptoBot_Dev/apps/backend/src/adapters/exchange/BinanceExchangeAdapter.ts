import { ExchangeAdapter } from './ExchangeTypes.js';
import { BinanceMarketDataStream } from '../../integrations/binance/BinanceMarketDataStream.js';
import { BinanceTradingClient } from '../../integrations/binance/BinanceTradingClient.js';
import type { ExchangeId, NormalizedSymbol, AccountSnapshot } from '@common/types/exchange';
import type { OrderBookSnapshot, ExchangeTradeTick } from '@common/types/marketData';
import type { PlaceOrderRequest, PlaceOrderResponse, CancelOrderRequest, CancelOrderResponse } from '@common/types/trading';

const exchangeId: ExchangeId = 'binance';

const normalizeSymbol = (symbol: NormalizedSymbol): NormalizedSymbol => {
  if (symbol.id) return symbol;
  const id = `${symbol.base}-${symbol.quote}`;
  return { ...symbol, id };
};

const parseSymbol = (id: string): NormalizedSymbol => {
  const [base, quote] = id.includes('-') ? id.split('-') : [id.slice(0, -4), id.slice(-4)];
  return { base, quote, id: `${base}-${quote}` };
};

export class BinanceExchangeAdapter implements ExchangeAdapter {
  public readonly id = exchangeId;

  constructor(private readonly marketData: BinanceMarketDataStream, private readonly trading: BinanceTradingClient) {}

  async fetchOrderBook(symbol: NormalizedSymbol): Promise<OrderBookSnapshot> {
    const key = normalizeSymbol(symbol).id;
    const snapshot = this.marketData.getOrderBook(key);
    if (snapshot) return snapshot;
    await this.marketData.refreshSymbol(key.replace('-', ''));
    const refreshed = this.marketData.getOrderBook(key);
    if (!refreshed) {
      throw new Error(`Order book not available for ${key}`);
    }
    return refreshed;
  }

  async fetchRecentTrades(symbol: NormalizedSymbol): Promise<ExchangeTradeTick[]> {
    const key = normalizeSymbol(symbol).id;
    return this.marketData.getTrades(key);
  }

  placeOrder(request: PlaceOrderRequest): Promise<PlaceOrderResponse> {
    return this.trading.placeOrder(request);
  }

  cancelOrder(request: CancelOrderRequest): Promise<CancelOrderResponse> {
    return this.trading.cancelOrder(request);
  }

  async getAccountSnapshot(): Promise<AccountSnapshot> {
    const payload = await this.trading.getAccount();
    const balances = (payload.balances || []).map((b: any) => ({
      asset: b.asset,
      free: Number(b.free),
      locked: Number(b.locked),
    }));
    const positions = (payload.positions || []).map((p: any) => ({
      symbol: parseSymbol(p.symbol || ''),
      size: Number(p.positionAmt || 0),
      entryPrice: Number(p.entryPrice || 0),
      pnl: Number(p.unrealizedProfit || 0),
    }));
    return {
      exchange: exchangeId,
      balances,
      positions,
      ts: Date.now(),
    };
  }
}
