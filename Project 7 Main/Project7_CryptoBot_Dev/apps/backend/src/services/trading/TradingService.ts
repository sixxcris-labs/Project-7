import { BinanceExchangeAdapter } from '../../adapters/exchange/BinanceExchangeAdapter.js';
import { BinanceConfig } from '../../integrations/binance/BinanceConfig.js';
import type { NormalizedSymbol } from '@common/types/exchange';
import type { PlaceOrderRequest, PlaceOrderResponse, CancelOrderRequest, CancelOrderResponse } from '@common/types/trading';

const normalizeSymbol = (symbol: string): NormalizedSymbol => {
  const [base, quote] = symbol.includes('-') ? symbol.split('-') : [symbol.slice(0, -4), symbol.slice(-4)];
  return { base: base.toUpperCase(), quote: quote.toUpperCase(), id: `${base.toUpperCase()}-${quote.toUpperCase()}` };
};

export class TradingService {
  constructor(private readonly adapter: BinanceExchangeAdapter, private readonly config: BinanceConfig) {}

  private ensureTradingEnabled(): void {
    if (!this.config.tradingEnabled) {
      throw new Error('Binance trading disabled (BINANCE_TRADING_ENABLED=false).');
    }
  }

  placeOrder(payload: Omit<PlaceOrderRequest, 'symbol'> & { symbol: string }): Promise<PlaceOrderResponse> {
    this.ensureTradingEnabled();
    return this.adapter.placeOrder({ ...payload, symbol: normalizeSymbol(payload.symbol) });
  }

  cancelOrder(payload: CancelOrderRequest & { symbol: string }): Promise<CancelOrderResponse> {
    this.ensureTradingEnabled();
    return this.adapter.cancelOrder({ ...payload, symbol: normalizeSymbol(payload.symbol) });
  }

  getAccount() {
    return this.adapter.getAccountSnapshot();
  }
}
