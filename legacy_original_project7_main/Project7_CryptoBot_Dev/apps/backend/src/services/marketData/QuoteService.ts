import type { NormalizedSymbol } from '@common/types/exchange';
import type { QuoteSnapshot } from '@common/types/quotes';
import type { PolygonWebSocketClient, PolygonQuote } from '../../integrations/polygon/PolygonWebSocketClient';

export interface QuoteServiceOptions {
  client?: PolygonWebSocketClient;
  ttlMs?: number;
  fallbackQuotes?: QuoteSnapshot[];
}

const DEFAULT_TTL_MS = 60_000;

export class QuoteService {
  private readonly quotes = new Map<string, QuoteSnapshot>();
  private readonly ttlMs: number;
  private readonly fallbackQuotes?: QuoteSnapshot[];
  private readonly client?: PolygonWebSocketClient;
  private started = false;
  private boundListener?: (quote: PolygonQuote) => void;

  constructor(options: QuoteServiceOptions) {
    this.client = options.client;
    this.ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
    this.fallbackQuotes = options.fallbackQuotes;
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    if (!this.client) return;
    this.boundListener = (quote) => this.handleQuote(quote);
    this.client.on('quote', this.boundListener);
    this.client.start();
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    if (this.client && this.boundListener) {
      this.client.off('quote', this.boundListener);
      this.client.stop();
    }
    this.boundListener = undefined;
    this.quotes.clear();
  }

  getQuotes(symbols?: string[]): QuoteSnapshot[] {
    const now = Date.now();
    for (const [key, snapshot] of this.quotes.entries()) {
      if (now - snapshot.ts > this.ttlMs) {
        this.quotes.delete(key);
      }
    }

    const selected = Array.from(this.quotes.values()).filter((quote) => {
      if (!symbols || symbols.length === 0) return true;
      return symbols.some((symbol) => symbol.toUpperCase() === quote.symbol.id);
    });

    if (selected.length === 0 && this.fallbackQuotes) {
      return this.fallbackQuotes;
    }

    return selected.sort((a, b) => a.symbol.id.localeCompare(b.symbol.id));
  }

  private handleQuote(quote: PolygonQuote): void {
    const normalized = toNormalizedSymbol(quote.symbol);
    if (!normalized) {
      return;
    }
    const spread = Math.max(0, quote.ask - quote.bid);
    const snapshot: QuoteSnapshot = {
      exchange: 'polygon',
      symbol: normalized,
      bid: quote.bid,
      ask: quote.ask,
      lastPrice: quote.lastPrice,
      ts: quote.ts,
      spread,
      mid: quote.bid + spread / 2,
      source: 'polygon',
    };
    this.quotes.set(normalized.id, snapshot);
  }
}

function toNormalizedSymbol(symbol: string): NormalizedSymbol | null {
  if (!symbol.includes('-')) return null;
  const [rawBase, rawQuote] = symbol.split('-');
  const base = rawBase.toUpperCase();
  const quote = rawQuote.toUpperCase();
  return { base, quote, id: `${base}-${quote}` };
}
