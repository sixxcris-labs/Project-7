
import { FastifyPluginAsync } from 'fastify';
import fetch from 'node-fetch';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { withTenant } from '../db.js';
import { proxyServiceJson } from '../lib/serviceProxy.js';

const plugin: FastifyPluginAsync = async (app) => {
  const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
  const backtestQueue = new Queue('backtestQueue', { connection });

  // --- Demo strategies data (stub & fallback) ---
  const demoStrategies = [
    {
      id: 'strat-001',
      name: 'Mean Reversion (BTCUSD)',
      category: 'Mean Reversion',
      status: 'idle',
      lastBacktest: '2025-01-10T12:00:00Z',
      lastDSR: 1.23,
      description: 'Buys dips and sells rallies on BTCUSD using RSI bands.',
      parameters: { lookback: 90, rsiLow: 30, rsiHigh: 70 },
      metrics: { sharpe: 1.1, maxDrawdown: -0.08, winRate: 0.54 },
    },
    {
      id: 'strat-002',
      name: 'Breakout (ETHUSD)',
      category: 'Momentum',
      status: 'live',
      lastBacktest: '2025-01-08T09:30:00Z',
      lastDSR: 0.97,
      description: 'Trades ETHUSD breakouts using ATR and volume filters.',
      parameters: { atrPeriod: 14, breakoutK: 2.5 },
      metrics: { sharpe: 0.8, maxDrawdown: -0.12, winRate: 0.48 },
    },
  ];

  const listFallback = demoStrategies.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    status: s.status,
    lastBacktest: s.lastBacktest,
    lastDSR: s.lastDSR,
  }));

  // GET /strategies (with prefix) -> list
  app.get('/', async (req) => {
    const remote = await proxyServiceJson(process.env.STRATEGY_SERVICE_URL, '/strategies', req);
    if (remote && Array.isArray(remote) && remote.length) {
      return remote;
    }
    return listFallback;
  });

  // GET /strategies/:id -> detail
  app.get('/:id', async (req) => {
    const id = (req.params as any).id as string;
    const remote = await proxyServiceJson(process.env.STRATEGY_SERVICE_URL, `/strategies/${id}`, req);
    if (remote) return remote;
    const found = demoStrategies.find((s) => s.id === id);
    if (!found) {
      return {
        id,
        name: id,
        description: `${id} demo strategy description`,
        parameters: { lookback: 90, threshold: 0.05 },
        metrics: { sharpe: 1.0, dsr: 0.5, maxDD: 0.1 },
      };
    }
    const { description, parameters, metrics, name, category, status, lastBacktest } = found;
    return { id, name, description, parameters, metrics, category, status, lastBacktest };
  });

  app.post('/backtest/echo', async (_req, _res) => {
    const q = process.env.QUANT_API_URL || 'http://quant:8001';
    const r = await fetch(q + '/health');
    return { upstream: await r.json() };
  });

  app.post('/backtest/submit', async (req, res) => {
    const job = await backtestQueue.add('backtest', { project: 'sample', params: { lookback: 90 } });
    return { jobId: job.id };
  });

  app.get('/users', async (req, res) => {
    const payload: any = await req.jwtVerify();
    const tenant = payload.tenant;
    const users = await withTenant(tenant, async (client) => {
      const { rows } = await client.query('SELECT id, email, created_at FROM app.users ORDER BY created_at DESC');
      return rows;
    });
    return { users };
  });

};
export default plugin;
