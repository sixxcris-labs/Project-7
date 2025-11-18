import type { OrderBookSnapshot, TradeTick } from '@common/types/marketData';

const base = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/\/$/, '');

const buildUrl = (path: string, params?: Record<string, string | number>): string => {
  const url = new URL(`${base}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
};

const fetchJson = async <T>(path: string, params?: Record<string, string | number>): Promise<T> => {
  const res = await fetch(buildUrl(path, params));
  if (!res.ok) throw new Error(`Market data ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
};

export const getOrderBook = (symbol: string): Promise<OrderBookSnapshot> => {
  return fetchJson<OrderBookSnapshot>('/api/market-data/orderbook', { symbol });
};

export const getTradeTicks = (symbol: string): Promise<TradeTick[]> => {
  return fetchJson<TradeTick[]>('/api/market-data/trades', { symbol });
};
