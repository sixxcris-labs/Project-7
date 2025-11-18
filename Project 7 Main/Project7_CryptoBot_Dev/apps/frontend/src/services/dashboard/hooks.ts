import useSWR from "swr";
import type { TradeTick, OrderBookSnapshot } from "@common/types/marketData";
import type { PlaceOrderResponse } from "@common/types/trading";
import type { GetPolymarketWhalesResponse } from "@common/types/polymarketWhales";
import {
  ActivityEntry,
  AdminMetrics,
  BacktestRun,
  BacktestSummary,
  BillingSummary,
  ConnectionSummary,
  GuardrailsState,
  MarketCandle,
  NewsItem,
  NewCoin,
  PerformanceSummary,
  ProfileSummary,
  SystemStatusResponse,
  TimeRange,
  WalletBalance,
  WatchlistEntry,
} from "@common/types/dashboard";
import { apiPost, swrFetcher } from "../../lib/api";

export function usePerformanceSummary(range: TimeRange = "today") {
  const key = `/api/performance/summary?range=${range}`;
  return useSWR<PerformanceSummary>(key, swrFetcher, { refreshInterval: 30000 });
}

export function useGuardrailsState() {
  return useSWR<GuardrailsState>("/api/guardrails/state", swrFetcher);
}

export async function updateGuardrails(payload: Partial<GuardrailsState>) {
  return apiPost("/api/guardrails/state", payload);
}

export async function explainGuardrailsWarning() {
  return apiPost("/api/guardrails/explain");
}

export function useWatchlist() {
  return useSWR<WatchlistEntry[]>("/api/markets/watchlist", swrFetcher, {
    refreshInterval: 20000,
  });
}

export async function updateWatchlist(entry: Partial<WatchlistEntry>) {
  return apiPost("/api/markets/watchlist", entry);
}

export function useMarketChart(symbol?: string, timeframe?: string) {
  const key = symbol
    ? `/api/market-data/klines?symbol=${encodeURIComponent(
        symbol,
      )}&timeframe=${encodeURIComponent(timeframe ?? "1h")}`
    : null;
  return useSWR<MarketCandle[]>(key, swrFetcher, { refreshInterval: 15000 });
}

export function useOrderBook(symbol?: string) {
  const key = symbol ? `/api/market-data/orderbook?symbol=${encodeURIComponent(symbol)}` : null;
  return useSWR<OrderBookSnapshot>(key, swrFetcher, { refreshInterval: 15000 });
}

export function useTrades(symbol?: string) {
  const key = symbol ? `/api/market-data/trades?symbol=${encodeURIComponent(symbol)}` : null;
  return useSWR<TradeTick[]>(key, swrFetcher, { refreshInterval: 15000 });
}

export async function placePaperOrder(payload: {
  symbol: string;
  side: "buy" | "sell";
  type?: "limit" | "market";
  quantity: number;
  price?: number;
}) {
  return apiPost<PlaceOrderResponse>("/api/paper/orders", payload);
}

export async function simulatePaperFill(payload: {
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
}) {
  return apiPost("/api/paper/orders/simulate-fill", payload);
}

export function useWhales() {
  return useSWR<GetPolymarketWhalesResponse>(
    "/api/polymarket/whales",
    swrFetcher,
    { refreshInterval: 25000 },
  );
}

export function useBacktestSummary() {
  return useSWR<BacktestSummary>("/api/backtests/latest", swrFetcher, { refreshInterval: 20000 });
}

export function useBacktestsList() {
  return useSWR<BacktestRun[]>("/api/backtests", swrFetcher, { refreshInterval: 20000 });
}

export function useNewCoins() {
  return useSWR<NewCoin[]>("/api/coins/new", swrFetcher, { refreshInterval: 60000 });
}

export function useNews() {
  return useSWR<NewsItem[]>("/api/news", swrFetcher, { refreshInterval: 45000 });
}

export function useConnections() {
  return useSWR<ConnectionSummary[]>("/api/connections", swrFetcher);
}

export function useBalances() {
  return useSWR<WalletBalance[]>("/api/wallets/balances", swrFetcher);
}

export function useActivity() {
  return useSWR<ActivityEntry[]>("/api/activity", swrFetcher);
}

export function useBilling() {
  return useSWR<BillingSummary>("/api/billing/summary", swrFetcher);
}

export function useProfile() {
  return useSWR<ProfileSummary>("/api/profile", swrFetcher);
}

export function useAdminMetrics() {
  return useSWR<AdminMetrics>("/api/admin/metrics", swrFetcher);
}

export function useSystemStatus() {
  return useSWR<SystemStatusResponse>("/api/system/status", swrFetcher);
}
