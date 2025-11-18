import { BinanceMarketDataStream } from '../../integrations/binance/BinanceMarketDataStream.js';
import type { OrderBookSnapshot, ExchangeTradeTick } from '@common/types/marketData';
import type { QuoteSnapshot } from '@common/types/quotes';
import { QuoteService } from './QuoteService.js';

export class MarketDataService {
  constructor(
    private readonly stream: BinanceMarketDataStream,
    private readonly quoteService?: QuoteService,
  ) {}

  start(): void {
    this.stream.start();
    this.quoteService?.start();
  }

  getOrderBook(symbolId: string): OrderBookSnapshot | undefined {
    return this.stream.getOrderBook(symbolId);
  }

  getTrades(symbolId: string): ExchangeTradeTick[] {
    return this.stream.getTrades(symbolId);
  }

  async refreshSymbol(symbolId: string): Promise<void> {
    // Convert normalized id like "BTC-USDT" to raw exchange symbol "BTCUSDT"
    const raw = symbolId.replace('-', '');
    await this.stream.refreshSymbol(raw);
  }

  getQuotes(symbols?: string[]): QuoteSnapshot[] {
    return this.quoteService?.getQuotes(symbols) ?? [];
  }
}
