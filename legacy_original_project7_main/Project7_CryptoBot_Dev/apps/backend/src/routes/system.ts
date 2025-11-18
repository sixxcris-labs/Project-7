import { FastifyPluginAsync } from 'fastify';

const systemRoutes: FastifyPluginAsync = async (app) => {
  app.get('/system/status', async () => {
    return {
      status: 'operational',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      services: {
        database: 'healthy',
        redis: 'healthy',
        marketData: 'healthy',
        binance: 'healthy'
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    };
  });

};

export { systemRoutes };