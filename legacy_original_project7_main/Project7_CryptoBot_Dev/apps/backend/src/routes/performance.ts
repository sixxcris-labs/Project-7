import { FastifyPluginAsync } from 'fastify';

const performanceRoutes: FastifyPluginAsync = async (app) => {
  app.get('/performance/summary', async (req) => {
    const { range } = req.query as any;

    // Mock performance data
    const mockData = {
      today: {
        totalPnL: 12450.50,
        totalPnLPercent: 2.45,
        winRate: 68.5,
        sharpeRatio: 1.85,
        maxDrawdown: 4.2,
        trades: 23,
        volume: 145678.90,
        fees: 89.25
      },
      week: {
        totalPnL: 45678.90,
        totalPnLPercent: 9.12,
        winRate: 71.2,
        sharpeRatio: 2.1,
        maxDrawdown: 6.8,
        trades: 156,
        volume: 987654.32,
        fees: 567.89
      },
      month: {
        totalPnL: 123456.78,
        totalPnLPercent: 24.69,
        winRate: 69.8,
        sharpeRatio: 1.95,
        maxDrawdown: 12.5,
        trades: 678,
        volume: 4567890.12,
        fees: 2345.67
      }
    };

    return mockData[range as keyof typeof mockData] || mockData.today;
  });
};

export { performanceRoutes };