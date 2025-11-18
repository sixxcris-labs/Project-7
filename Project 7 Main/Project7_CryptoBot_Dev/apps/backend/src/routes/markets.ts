import { FastifyPluginAsync } from 'fastify';

const marketsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/markets/watchlist', async () => {
    return [
      {
        symbol: 'BTC-USDT',
        name: 'Bitcoin',
        price: 94567.89,
        change24h: 2.34,
        volume24h: 987654321,
        marketCap: 1876543210987,
        isWatched: true,
        alerts: [
          { type: 'price', condition: 'above', value: 95000 },
          { type: 'volume', condition: 'above', value: 1000000000 }
        ]
      },
      {
        symbol: 'ETH-USDT',
        name: 'Ethereum',
        price: 3456.78,
        change24h: 1.89,
        volume24h: 456789123,
        marketCap: 415678901234,
        isWatched: true,
        alerts: [
          { type: 'price', condition: 'below', value: 3400 }
        ]
      },
      {
        symbol: 'BNB-USDT',
        name: 'BNB',
        price: 678.90,
        change24h: -0.56,
        volume24h: 123456789,
        marketCap: 101234567890,
        isWatched: true,
        alerts: []
      }
    ];
  });
};

export { marketsRoutes };