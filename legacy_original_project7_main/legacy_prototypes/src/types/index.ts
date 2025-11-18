export interface Coin {
  name: string;
  symbol: string;
  value: string;
  holdings: string;
  change: string;
  price: number;
}

export interface WalletBalance {
  totalBalance: number;
  cryptoBalance: number;
  fiatBalance: number;
}

export interface TradingPair {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
}

export interface PolymarketPosition {
  marketId: string;
  title: string;
  outcome: 'YES' | 'NO';
  shares: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
}

export interface BacktestMetrics {
  worstLoss: string;
  worstLossPct: string;
  recoveryDays: number;
  profit: string;
  monthsProfitable: string;
  sharpe: number;
  maxDrawdown: number;
  winRate: number;
}

export interface ExchangeConnection {
  id: string;
  name: string;
  connected: boolean;
  apiKey?: string;
  secret?: string;
}

export interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  timestamp: Date;
  status: 'pending' | 'filled' | 'cancelled';
}