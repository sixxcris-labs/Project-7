import { FastifyPluginAsync } from 'fastify';

const newsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/news', async () => {
    const mockNews = [
      {
        id: '1',
        title: 'Bitcoin Reaches New All-Time High',
        summary: 'Bitcoin surged past $95,000 today as institutional adoption continues to grow.',
        content: 'In a remarkable turn of events, Bitcoin has reached a new all-time high...',
        source: 'CryptoNews',
        publishedAt: '2024-11-13T14:30:00Z',
        sentiment: 'bullish',
        symbols: ['BTC'],
        category: 'market'
      },
      {
        id: '2',
        title: 'Ethereum 2.0 Upgrade Shows Significant Progress',
        summary: 'The latest Ethereum network upgrade has reduced transaction fees by 40%.',
        content: 'Ethereum developers announced significant improvements to network efficiency...',
        source: 'BlockchainDaily',
        publishedAt: '2024-11-13T12:15:00Z',
        sentiment: 'bullish',
        symbols: ['ETH'],
        category: 'technology'
      },
      {
        id: '3',
        title: 'Regulatory Clarity Emerges for Crypto Markets',
        summary: 'New guidelines provide clearer framework for cryptocurrency operations.',
        content: 'Financial regulators have issued comprehensive guidelines...',
        source: 'FinanceToday',
        publishedAt: '2024-11-13T10:00:00Z',
        sentiment: 'neutral',
        symbols: ['BTC', 'ETH'],
        category: 'regulation'
      }
    ];

    return mockNews;
  });
};

export { newsRoutes };