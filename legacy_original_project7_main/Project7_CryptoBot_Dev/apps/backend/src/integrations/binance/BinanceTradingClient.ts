import { BinanceHttpClient } from './BinanceHttpClient.js';
import { BinanceConfig } from './BinanceConfig.js';
import { BinanceError } from './BinanceError.js';
import type { PlaceOrderRequest, PlaceOrderResponse, CancelOrderRequest, CancelOrderResponse } from '@common/types/trading';

const normalizeSymbolId = (id: string): string => id.replace(/[-_]/g, '').toUpperCase();

export class BinanceTradingClient {
  constructor(private readonly http: BinanceHttpClient, private readonly config: BinanceConfig) {}

  private ensureApiCreds(): void {
    if (!this.config.apiKey || !this.config.apiSecret) {
      throw new BinanceError('Binance API credentials missing. Set BINANCE_API_KEY/SECRET to enable trading.');
    }
  }

  public async placeOrder(req: PlaceOrderRequest): Promise<PlaceOrderResponse> {
    this.ensureApiCreds();
    const symbol = normalizeSymbolId(req.symbol.id || `${req.symbol.base}${req.symbol.quote}`);

    const payload = {
      symbol,
      side: req.side.toUpperCase(),
      type: req.type.toUpperCase(),
      newClientOrderId: req.clientOrderId,
      quantity: req.quantity,
      price: req.price,
      timeInForce: req.tif ?? 'GTC',
    } as Record<string, string | number | undefined>;

    const response = await this.http.signedRequest<any>({
      path: '/api/v3/order',
      method: 'POST',
      params: payload,
    });

    return {
      exchange: req.exchange,
      orderId: String(response.orderId ?? response.clientOrderId ?? 'unknown'),
      clientOrderId: response.clientOrderId,
      status: response.status || 'NEW',
      executedQty: Number(response.executedQty || 0),
      avgPrice: response.cummulativeQuoteQty ? Number(response.cummulativeQuoteQty) / Math.max(Number(response.executedQty || 1), 1) : undefined,
      ts: Date.now(),
      raw: response,
    };
  }

  public async cancelOrder(req: CancelOrderRequest): Promise<CancelOrderResponse> {
    this.ensureApiCreds();
    const symbol = normalizeSymbolId(req.symbol.id || `${req.symbol.base}${req.symbol.quote}`);
    const payload: Record<string, string | number | undefined> = {
      symbol,
      orderId: req.orderId,
      origClientOrderId: req.clientOrderId,
    };
    const response = await this.http.signedRequest<any>({
      path: '/api/v3/order',
      method: 'DELETE',
      params: payload,
    });
    return {
      exchange: req.exchange,
      orderId: String(response.orderId ?? req.orderId ?? 'unknown'),
      clientOrderId: response.clientOrderId ?? req.clientOrderId,
      status: 'CANCELED',
      ts: Date.now(),
      raw: response,
    };
  }

  public async getAccount(): Promise<any> {
    this.ensureApiCreds();
    return this.http.signedRequest({
      path: '/api/v3/account',
      method: 'GET',
    });
  }
}
