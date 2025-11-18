import { FastifyPluginAsync } from 'fastify';
import { proxyServiceJson } from '../lib/serviceProxy.js';

const fallbackKpi = {
  portfolio: { value: 4_250_000, equity: 3_980_000, currency: 'USD' },
  execution: { avgIs: 2.4, slippage: 1.1, fillRate: 0.94 },
  risk: { status: 'healthy', maxDrawdown: 0.085, cvar: 0.11 },
  meta: { strategiesCount: 2 },
};

const fallbackExecution = {
  metaOrders: [
    { time: '09:25', symbol: 'BTC-USD', side: 'Buy', notional: 120000, venue: 'Coinbase', isBps: 2.1, feesBps: 0.3, impactBps: 1.1 },
    { time: '09:28', symbol: 'ETH-USD', side: 'Sell', notional: 40000, venue: 'Binance', isBps: 2.6, feesBps: 0.4, impactBps: 1.4 },
  ],
  summary: { avgIs: 2.35, fillRate: 0.92, totalOrders: 12 },
};

const plugin: FastifyPluginAsync = async (app) => {
  app.get('/kpi', async (req, res) => {
    const remote = await proxyServiceJson(process.env.METRICS_SERVICE_URL, '/kpi', req);
    return remote ?? fallbackKpi;
  });

  app.get('/execution', async (req, res) => {
    const remote = await proxyServiceJson(process.env.EXECUTION_SERVICE_URL, '/execution', req);
    return remote ?? fallbackExecution;
  });
};

export default plugin;
