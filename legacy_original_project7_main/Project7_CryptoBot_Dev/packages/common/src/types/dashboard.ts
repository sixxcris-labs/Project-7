export type TimeRange = "today" | "week" | "month";

export interface PerformanceSummary {
  range: TimeRange;
  todayPnlUsd: number;
  todayPnlPct: number;
  weeklyPnlUsd: number;
  weeklyPnlPct: number;
  winRateToday: number;
  tradesToday: number;
  riskUsedPct: number;
  equityVsAthPct: number;
  maxDrawdownTodayPct: number;
  currentStreak: string;
}

export interface GuardrailsState {
  guardrailsEnabled: boolean;
  dailyTradeLimitUsed: number;
  dailyTradeLimitMax: number;
  maxPositionSizePct: number;
  largestPositionTodayPct: number;
  behaviorFlag: string;
}

export interface WatchlistEntry {
  symbol: string;
  price: number;
  change24hPct: number;
  volume24h: number;
  alertEnabled: boolean;
  favorite: boolean;
  exchange: string;
}

export interface MarketCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PaperOrderSimulation {
  estimatedFillPrice: number;
  slippage: number;
  expectedQty: number;
}

export interface BacktestSummary {
  sharpe: number;
  cagr: number;
  maxDrawdown: number;
  totalTrades: number;
  lastRunId: string;
}

export interface BacktestRun {
  id: string;
  strategyName: string;
  status: "running" | "completed" | "failed";
  sharpe: number;
  cagr: number;
  startedAt: string;
}

export interface NewCoin {
  symbol: string;
  name: string;
  listedAt: string;
  exchange: string;
  sentiment: "bullish" | "neutral" | "bearish";
}

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  sentiment: "positive" | "neutral" | "negative";
  source: string;
  timestamp: number;
}

export interface ConnectionSummary {
  id: string;
  name: string;
  provider: string;
  status: "connected" | "disconnected" | "error";
}

export interface WalletBalance {
  asset: string;
  available: number;
  total: number;
}

export interface ActivityEntry {
  id: string;
  ts: number;
  symbol: string;
  type: string;
  side: "buy" | "sell";
  qty: number;
  price: number;
  status: "filled" | "cancelled" | "pending";
}

export interface BillingSummary {
  period: string;
  spend: number;
  budget: number;
  remaining: number;
  alerts: string[];
}

export interface ProfileSummary {
  name: string;
  email: string;
  role: "user" | "admin";
  timezone: string;
}

export interface AdminMetrics {
  uptimeMinutes: number;
  queuedJobs: number;
  activeUsers: number;
  liveDeployments: number;
}

export interface SystemStatusResponse {
  uptimeSeconds: number;
  backend: {
    status: "ok" | "degraded" | "down";
    detail: string;
    updatedAt: string;
  };
  marketData: {
    status: "ok" | "degraded" | "down";
    detail: string;
    updatedAt: string;
  };
  exchange: {
    status: "ok" | "degraded" | "down";
    detail: string;
    updatedAt: string;
  };
  quant?: {
    status: "ok" | "degraded" | "down";
    detail: string;
    updatedAt: string;
  };
  redis?: {
    status: "ok" | "degraded" | "down";
    detail: string;
    updatedAt: string;
  };
  postgres?: {
    status: "ok" | "degraded" | "down";
    detail: string;
    updatedAt: string;
  };
}
