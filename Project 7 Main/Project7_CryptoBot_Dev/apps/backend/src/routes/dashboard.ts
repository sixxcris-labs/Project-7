import type { FastifyPluginAsync } from "fastify";
import type { PlaceOrderResponse } from "@common/types/trading";
import type { GetPolymarketWhalesResponse } from "@common/types/polymarketWhales";
import type {
  ActivityEntry,
  AdminMetrics,
  BacktestRun,
  BacktestSummary,
  BillingSummary,
  ConnectionSummary,
  GuardrailsState,
  MarketCandle,
  NewCoin,
  NewsItem,
  PerformanceSummary,
  ProfileSummary,
  SystemStatusResponse,
  WatchlistEntry,
  WalletBalance,
} from "@common/types/dashboard";

const guardrailsState: GuardrailsState = {
  guardrailsEnabled: true,
  dailyTradeLimitUsed: 5,
  dailyTradeLimitMax: 10,
  maxPositionSizePct: 30,
  largestPositionTodayPct: 21,
  behaviorFlag: "None",
};

let watchlist: WatchlistEntry[] = [
  {
    symbol: "BTC-USDT",
    price: 68932,
    change24hPct: 1.2,
    volume24h: 420000000,
    alertEnabled: true,
    favorite: true,
    exchange: "Binance",
  },
  {
    symbol: "ETH-USDT",
    price: 3481,
    change24hPct: 0.8,
    volume24h: 210000000,
    alertEnabled: false,
    favorite: false,
    exchange: "Binance",
  },
  {
    symbol: "SOL-USDT",
    price: 156,
    change24hPct: -1.4,
    volume24h: 86000000,
    alertEnabled: false,
    favorite: false,
    exchange: "Bybit",
  },
];

const connections: ConnectionSummary[] = [
  { id: "conn-1", name: "Binance API", provider: "Binance", status: "connected" },
  { id: "conn-2", name: "Bybit API", provider: "Bybit", status: "connected" },
  { id: "conn-3", name: "Coinbase Pro", provider: "Coinbase", status: "disconnected" },
];

const balances: WalletBalance[] = [
  { asset: "USDT", available: 42000, total: 42000 },
  { asset: "BTC", available: 2.3, total: 2.5 },
  { asset: "ETH", available: 14.8, total: 15.2 },
];

const activityFeed: ActivityEntry[] = [
  {
    id: "act-1",
    ts: Date.now() - 4_000_000,
    symbol: "BTC-USDT",
    type: "trade",
    side: "buy",
    qty: 0.5,
    price: 68800,
    status: "filled",
  },
  {
    id: "act-2",
    ts: Date.now() - 3_000_000,
    symbol: "ETH-USDT",
    type: "trade",
    side: "sell",
    qty: 5,
    price: 3490,
    status: "filled",
  },
  {
    id: "act-3",
    ts: Date.now() - 60_000,
    symbol: "SOL-USDT",
    type: "cancel",
    side: "buy",
    qty: 10,
    price: 158,
    status: "cancelled",
  },
];

const billingSummary: BillingSummary = {
  period: "Nov 2025",
  spend: 420,
  budget: 1200,
  remaining: 780,
  alerts: ["Live deployment approaching budget cap"],
};

const profile: ProfileSummary = {
  name: "Demo Trader",
  email: "demo@project7.dev",
  role: "user",
  timezone: "UTC",
};

const adminMetrics: AdminMetrics = {
  uptimeMinutes: 7543,
  queuedJobs: 4,
  activeUsers: 18,
  liveDeployments: 2,
};

const backtestRuns: BacktestRun[] = [
  {
    id: "bt-001",
    strategyName: "Mean Reversion BTC",
    status: "completed",
    sharpe: 1.35,
    cagr: 48.1,
    startedAt: new Date(Date.now() - 1200_000).toISOString(),
  },
  {
    id: "bt-002",
    strategyName: "Momentum ETH",
    status: "running",
    sharpe: 0.92,
    cagr: 32.4,
    startedAt: new Date(Date.now() - 720_000).toISOString(),
  },
];

const backtestSummary: BacktestSummary = {
  sharpe: 1.24,
  cagr: 41.6,
  maxDrawdown: 8.2,
  totalTrades: 248,
  lastRunId: backtestRuns[0].id,
};

const newsItems: NewsItem[] = [
  {
    id: "news-1",
    headline: "Binance launches new staking liquidity pool",
    summary: "New product expands yield opportunities for BTC.",
    sentiment: "positive",
    source: "CoinDesk",
    timestamp: Date.now() - 600_000,
  },
  {
    id: "news-2",
    headline: "Ethereum upgrades consensus path",
    summary: "Network shift reduces gas usage by 5%.",
    sentiment: "neutral",
    source: "TheBlock",
    timestamp: Date.now() - 1800_000,
  },
];

const newCoins: NewCoin[] = [
  {
    symbol: "ARBI",
    name: "Arbitrum Gains",
    listedAt: "2025-11-10",
    exchange: "Coinbase",
    sentiment: "bullish",
  },
  {
    symbol: "LUNA2",
    name: "Luna Second Wave",
    listedAt: "2025-11-09",
    exchange: "Binance",
    sentiment: "neutral",
  },
];

let marketDataIngestionEnabled = true;

function createPerformanceSummary(range: string): PerformanceSummary {
  const base = {
    todayPnlUsd: 3420,
    todayPnlPct: 1.2,
    weeklyPnlUsd: 7200,
    weeklyPnlPct: 2.5,
    winRateToday: 67,
    tradesToday: 18,
    riskUsedPct: 63,
    equityVsAthPct: 4.8,
    maxDrawdownTodayPct: -1.5,
    currentStreak: "+3",
  };
  return {
    ...base,
    range: ["week", "month"].includes(range) ? (range as PerformanceSummary["range"]) : "today",
  };
}

function buildKlines(): MarketCandle[] {
  const now = Date.now();
  return Array.from({ length: 20 }).map((_, idx) => {
    const offset = 15 * 60 * 1000 * idx;
    const base = 60000 + idx * 10;
    return {
      time: now - offset,
      open: base - 5,
      high: base + 12,
      low: base - 14,
      close: base + (idx % 2 ? 3 : -2),
      volume: 1200 + idx * 50,
    };
  });
}

export const dashboardRoutes: FastifyPluginAsync = async (app) => {

  app.post<{ Body: { enabled?: boolean } }>("/admin/md/toggle", async (req) => {
    const { enabled } = req.body ?? {};
    if (typeof enabled === "boolean") {
      marketDataIngestionEnabled = enabled;
    } else {
      marketDataIngestionEnabled = !marketDataIngestionEnabled;
    }
    return { enabled: marketDataIngestionEnabled };
  });

  app.get("/performance/summary", async (req) => {
    const range = (req.query as any)?.range;
    return createPerformanceSummary(range);
  });

  app.get("/guardrails/state", async () => guardrailsState);

  app.post("/guardrails/state", async (req) => {
    const payload = req.body as Partial<GuardrailsState>;
    Object.assign(guardrailsState, payload);
    return guardrailsState;
  });

  app.post("/guardrails/explain", async () => ({
    message: "The guardrail triggered because risk usage crossed 70% of the daily limit.",
  }));

  app.get("/markets/watchlist", async () => watchlist);

  app.post("/markets/watchlist", async (req) => {
    const payload = req.body as Partial<WatchlistEntry> & { symbol?: string };
    if (!payload.symbol) {
      return { error: "symbol required" };
    }
    const existing = watchlist.find((item) => item.symbol === payload.symbol);
    if (existing) {
      Object.assign(existing, payload);
    } else {
      watchlist = [{ symbol: payload.symbol, price: payload.price ?? 0, change24hPct: payload.change24hPct ?? 0, volume24h: payload.volume24h ?? 0, alertEnabled: payload.alertEnabled ?? false, favorite: payload.favorite ?? false, exchange: payload.exchange ?? "unknown" }, ...watchlist];
    }
    return { success: true };
  });

  app.get("/market-data/klines", async (req, reply) => {
    const symbol = (req.query as any)?.symbol;
    if (!symbol) {
      reply.status(400);
      return { error: "symbol query param required" };
    }
    return buildKlines();
  });

  app.post("/paper/orders", async (req) => {
    const { symbol, side, quantity, price } = req.body as {
      symbol: string;
      side: "buy" | "sell";
      quantity: number;
      price: number;
    };
    const order: PlaceOrderResponse = {
      exchange: "mock",
      orderId: `paper-${Date.now()}`,
      status: "NEW",
      executedQty: 0,
      ts: Date.now(),
      avgPrice: price,
    };
    return order;
  });

  app.post("/paper/orders/simulate-fill", async (req) => {
    const { price } = req.body as { price: number };
    return {
      estimatedFillPrice: price + 0.25,
      slippage: 0.12,
      expectedQty: (req.body as any)?.quantity ?? 0,
    };
  });

  app.get("/polymarket/whales", async () => {
    const response: GetPolymarketWhalesResponse = {
      whales: [
        {
          trader: "0xabc123",
          totalNotional: 250_000,
          totalSize: 250,
          tradeCount: 4,
          markets: ["POLY-ETH", "POLY-BTC"],
          lastSeen: Date.now(),
          explorerUrl: "https://polygonscan.com/address",
          sampleTrades: [
            {
              txHash: "0x1",
              trader: "0xabc123",
              marketId: "POLY-ETH",
              price: 18.5,
              size: 5,
              notional: 92.5,
              side: "buy",
              timestamp: Date.now(),
            },
          ],
        },
      ],
    };
    return response;
  });

  app.get("/backtests/latest", async () => backtestSummary);

  app.get("/backtests", async () => backtestRuns);

  app.get("/coins/new", async () => newCoins);

  app.get("/news", async () => newsItems);

  app.get("/connections", async () => connections);

  app.get("/wallets/balances", async () => balances);

  app.get("/activity", async () => activityFeed);

  app.get("/billing/summary", async () => billingSummary);

  app.get("/profile", async () => profile);

  app.post("/profile", async (req) => {
    Object.assign(profile, req.body);
    return profile;
  });

  app.post("/profile/notifications", async () => ({ success: true }));

  app.get("/admin/metrics", async () => adminMetrics);

  app.post("/admin/feature-flags/toggle", async (req) => {
    return {
      feature: (req.body as any)?.feature ?? "unknown",
      enabled: (req.body as any)?.enabled ?? false,
    };
  });
};

export default dashboardRoutes;
