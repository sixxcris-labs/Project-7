import { FastifyPluginAsync } from 'fastify';

const backtestRoutes: FastifyPluginAsync = async (app) => {
  app.get('/backtests', async () => {
    return [
      {
        id: '1',
        name: 'BTC Momentum Strategy',
        status: 'completed',
        createdAt: '2024-11-10T10:00:00Z',
        pnl: 15678.90,
        pnlPercent: 12.45,
        sharpeRatio: 1.85,
        maxDrawdown: 8.2,
        trades: 156
      },
      {
        id: '2',
        name: 'ETH Mean Reversion',
        status: 'running',
        createdAt: '2024-11-11T14:30:00Z',
        pnl: 8942.15,
        pnlPercent: 7.12,
        sharpeRatio: 1.62,
        maxDrawdown: 5.8,
        trades: 89
      },
      {
        id: '3',
        name: 'Multi-Asset Arbitrage',
        status: 'completed',
        createdAt: '2024-11-09T08:15:00Z',
        pnl: 23456.78,
        pnlPercent: 18.92,
        sharpeRatio: 2.15,
        maxDrawdown: 12.3,
        trades: 234
      }
    ];
  });

  app.get('/backtests/latest', async () => {
    return {
      id: '1',
      name: 'BTC Momentum Strategy',
      status: 'completed',
      createdAt: '2024-11-10T10:00:00Z',
      completedAt: '2024-11-10T11:45:00Z',
      pnl: 15678.90,
      pnlPercent: 12.45,
      sharpeRatio: 1.85,
      maxDrawdown: 8.2,
      trades: 156,
      winRate: 68.5,
      avgTradeSize: 1000,
      strategy: 'momentum',
      symbols: ['BTC-USDT', 'ETH-USDT'],
      timeframe: '1h',
      startDate: '2024-10-01T00:00:00Z',
      endDate: '2024-11-01T00:00:00Z'
    };
  });
};

export { backtestRoutes };