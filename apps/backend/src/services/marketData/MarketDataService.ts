export interface Quote {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  exchange: string;
}

export class MarketDataService {
  private readonly exchanges = ['binance', 'coinbase', 'polygon'];

  getQuotes(symbols: string[]): Quote[] {
    const now = Date.now();
    return symbols.length
      ? symbols.map((symbol) => this.buildQuote(symbol))
      : ['BTCUSDT', 'ETHUSDT', 'SOLUSD'].map((symbol) => this.buildQuote(symbol));
  }

  private buildQuote(symbol: string): Quote {
    const price = 20000 + Math.random() * 40000;
    return {
      symbol,
      price: parseFloat(price.toFixed(2)),
      change24h: parseFloat(((Math.random() - 0.5) * 5).toFixed(2)),
      volume: Math.round(1_000_000 + Math.random() * 50_000_000),
      exchange: this.exchanges[Math.floor(Math.random() * this.exchanges.length)],
    };
  }
}
