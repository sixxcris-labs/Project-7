export interface Position {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  mode: 'paper' | 'live';
  openedAt: string;
}

export interface Trade {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  quantity: number;
  avgPrice: number;
  realizedPnl: number;
  mode: 'paper' | 'live';
  openedAt: string;
  closedAt?: string;
}

export interface TradeHistoryFilters {
  mode?: 'paper' | 'live';
  symbol?: string;
  page?: number;
  pageSize?: number;
}

export interface TradeHistoryResult {
  items: Trade[];
  total: number;
}

export class PortfolioService {
  async getPositions(userId: string): Promise<Position[]> {
    const now = new Date().toISOString();

    return [
      {
        id: `pos-${userId}`,
        symbol: 'BTC-USDT',
        side: 'long',
        quantity: 0.1,
        entryPrice: 58000,
        currentPrice: 60000,
        unrealizedPnl: 200,
        mode: 'paper',
        openedAt: now,
      },
    ];
  }

  async getTradeHistory(
    userId: string,
    filters: TradeHistoryFilters = {},
  ): Promise<TradeHistoryResult> {
    const now = new Date();
    const base: Trade[] = [
      {
        id: `trade-${userId}-1`,
        symbol: 'BTC-USDT',
        side: 'long',
        quantity: 0.05,
        avgPrice: 55000,
        realizedPnl: 150,
        mode: 'paper',
        openedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        closedAt: now.toISOString(),
      },
    ];

    const filtered = base.filter((t) => {
      if (filters.mode && t.mode !== filters.mode) return false;
      if (filters.symbol && t.symbol !== filters.symbol) return false;
      return true;
    });

    return {
      items: filtered,
      total: filtered.length,
    };
  }
}
