import useSWR from 'swr';
import { getOrderBook, getTradeTicks } from '../services/api/marketDataApi';
import type { OrderBookSnapshot, TradeTick } from '@common/types/marketData';

export function useMarketData(symbol?: string) {
  const normalized = symbol?.toUpperCase();

  const orderBook = useSWR<OrderBookSnapshot>(
    normalized ? ['orderbook', normalized] : null,
    () => getOrderBook(normalized as string),
    { refreshInterval: 4000 }
  );

  const trades = useSWR<TradeTick[]>(
    normalized ? ['trades', normalized] : null,
    () => getTradeTicks(normalized as string),
    { refreshInterval: 2000 }
  );

  return {
    orderBook: orderBook.data,
    trades: trades.data,
    isLoading: orderBook.isLoading || trades.isLoading,
    error: orderBook.error || trades.error,
    mutateOrderBook: orderBook.mutate,
    mutateTrades: trades.mutate,
  };
}
