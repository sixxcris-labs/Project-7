import { FastifyPluginAsync } from 'fastify';

const coinsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/coins/new', async () => {
    return [
      {
        id: 'new-coin-1',
        symbol: 'NEWX',
        name: 'NewX Token',
        price: 0.45,
        change24h: 156.78,
        volume24h: 12456789,
        marketCap: 45000000,
        listedAt: '2024-11-12T08:00:00Z',
        exchange: 'Binance',
        description: 'Revolutionary DeFi protocol token'
      },
      {
        id: 'new-coin-2',
        symbol: 'FUTR',
        name: 'Future Protocol',
        price: 1.23,
        change24h: 89.45,
        volume24h: 8765432,
        marketCap: 123000000,
        listedAt: '2024-11-11T12:30:00Z',
        exchange: 'Coinbase',
        description: 'Next-generation blockchain infrastructure'
      },
      {
        id: 'new-coin-3',
        symbol: 'INNO',
        name: 'Innovation Chain',
        price: 2.67,
        change24h: 234.12,
        volume24h: 15678901,
        marketCap: 267000000,
        listedAt: '2024-11-10T16:45:00Z',
        exchange: 'Kraken',
        description: 'AI-powered trading and analytics platform'
      }
    ];
  });
};

export { coinsRoutes };