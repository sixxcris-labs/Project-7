// TODO: Uncomment when marketData types are available
// import type { TradeTick } from "@common/types/marketData";

export type MiniMetric = {
  label: string;
  value: number | string;
  change: string;
};

export type BacktestMetrics = {
  worstLoss: string;
  worstLossPct: string;
  recoveryDays: number;
  profit: string;
  monthsProfitable: string;
  riskStatus?: string;
};

export type CoinHolding = {
  name: string;
  value: string;
  holdings: string;
  change: string;
};

export type MarketCoin = {
  name: string;
  symbol: string;
  price: string;
  change: string;
};

export type PaymentAccount = {
  brand: string;
  masked: string;
};

export type WalletSummaryStat = {
  label: string;
  detail: string;
  value: string;
};

export type WalletSummary = {
  title: string;
  badges: string[];
  stats: WalletSummaryStat[];
};

export type WalletDashboardViewModel = {
  miniMetrics: MiniMetric[];
  backtestMetrics: BacktestMetrics | null;
  coinHoldings: CoinHolding[];
  marketCoins: MarketCoin[];
  paymentAccounts: PaymentAccount[];
  walletSummary: WalletSummary;
  // TODO: Uncomment when TradeTick type is available
  // liveTrades?: TradeTick[];
  liveSymbol?: string;
};
