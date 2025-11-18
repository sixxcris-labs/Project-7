import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import rawBody from 'fastify-raw-body';
import { register } from 'prom-client';
import fastifyJWT, { FastifyJWTOptions } from '@fastify/jwt';
import fs from 'fs';
import path from 'path';

import { authRoutes } from './routes/auth';
import { billingRoutes } from './routes/billing';
import { dashboardRoutes } from './routes/dashboard';
import { whaleWatchRoutes } from './routes/whaleWatch';
import { tradingRoutes } from './api/trading';
import { tradingFlowRoutes } from './api/tradingFlow';
import marketDataRoutes from './api/marketData';
import { tcaRoutes } from './routes/tca';
import { systemRoutes } from './routes/system';
import apiRoutes from './routes/api';
import { performanceRoutes } from './routes/performance';
import { backtestRoutes } from './routes/backtests';
import { newsRoutes } from './routes/news';
import { coinsRoutes } from './routes/coins';
import { marketsRoutes } from './routes/markets';
import { guardrailsRoutes } from './routes/guardrails';
import { initPolymarketWhales } from './services/polymarket';
import { MarketDataService } from './services/marketData/MarketDataService';
import { QuoteService } from './services/marketData/QuoteService';
import { BinanceMarketDataStream } from './integrations/binance/BinanceMarketDataStream';
import { BinanceHttpClient } from './integrations/binance/BinanceHttpClient';
import { createBinanceConfig } from './integrations/binance/BinanceConfig';
import type { QuoteSnapshot } from '@common/types/quotes';
import { createPolygonConfig } from './integrations/polygon/PolygonConfig';
import { PolygonWebSocketClient } from './integrations/polygon/PolygonWebSocketClient';
import { marketStreamPlugin } from './plugins/marketStreamPlugin';
import { binanceStreamClient } from './services/exchanges/binanceStreamClient';

const DEFAULT_QUOTE_FALLBACKS: QuoteSnapshot[] = [
  {
    exchange: 'polygon',
    symbol: { base: 'BTC', quote: 'USD', id: 'BTC-USD' },
    bid: 0,
    ask: 0,
    mid: 0,
    spread: 0,
    ts: 0,
    source: 'mock',
  },
  {
    exchange: 'polygon',
    symbol: { base: 'ETH', quote: 'USD', id: 'ETH-USD' },
    bid: 0,
    ask: 0,
    mid: 0,
    spread: 0,
    ts: 0,
    source: 'mock',
  },
];

function readKeyOrThrow(p?: string, label?: string): Buffer {
  if (!p) {
    throw new Error(`Missing ${label ?? 'key path'}`);
  }
  const abs = path.resolve(p);
  if (!fs.existsSync(abs)) {
    throw new Error(`JWT key not found at ${abs}`);
  }
  return fs.readFileSync(abs);
}

export async function buildServer() {
  const app = Fastify({
    logger: true,
    trustProxy: true,
  });

  // CORS
  await app.register(fastifyCors, {
    origin: true,
  });

  // Metrics endpoint
  app.get('/metrics', async (request, reply) => {
    reply.type('text/plain; version=0.0.4; charset=utf-8');
    return register.metrics();
  });

  // Raw body (for Stripe webhooks; enabled per-route via config.rawBody)
  await app.register(rawBody, {
    field: 'rawBody',
    global: false,
    routes: [],
    encoding: 'utf8',
    runFirst: true,
  });

  // JWT setup with EdDSA and fail-fast behavior
  const env = process.env.NODE_ENV ?? 'development';
  const isLocal = env === 'development' || env === 'test';

  const privPath = process.env.JWT_PRIVATE_KEY_PATH;
  const pubPath = process.env.JWT_PUBLIC_KEY_PATH;

  try {
    const privateKey = readKeyOrThrow(privPath, 'JWT_PRIVATE_KEY_PATH');
    const publicKey = readKeyOrThrow(pubPath, 'JWT_PUBLIC_KEY_PATH');

    await app.register(fastifyJWT as any, {
      secret: {
        private: privateKey,
        public: publicKey,
      },
      sign: {
        algorithm: 'EdDSA',
        issuer: 'project7',
      },
      verify: {
        algorithms: ['EdDSA'],
        issuer: 'project7',
      },
    });

    app.log.info('JWT keys loaded (Ed25519)');
  } catch (err) {
    app.log.error({ err }, 'Failed to load JWT keys');
    if (!isLocal) {
      // In non-local environments, fail-fast if keys are misconfigured
      throw err;
    } else {
      app.log.warn('Continuing in local env without JWT registered.');
    }
  }

  // Root endpoint
  app.get('/', async () => ({
    name: 'Project7 CryptoBot API',
    status: 'ok',
    version: '1.0.0',
    ts: new Date().toISOString(),
  }));

  // Health endpoints
  app.get('/health', async () => ({
    status: 'ok',
    ts: new Date().toISOString(),
  }));

  app.get('/healthz', async () => ({
    status: 'ok',
    ts: new Date().toISOString(),
    readiness: {
      db: 'unknown',
      redis: 'unknown',
    },
  }));

  // Initialize Market Data Service
  const binanceConfig = createBinanceConfig();
  const binanceHttp = new BinanceHttpClient(binanceConfig.apiKey, binanceConfig.apiSecret);
  const marketDataStream = new BinanceMarketDataStream(binanceHttp, binanceConfig);

  const polygonConfig = createPolygonConfig();
  const polygonClient = new PolygonWebSocketClient(polygonConfig);
  const quoteService = new QuoteService({
    client: polygonConfig.enabled ? polygonClient : undefined,
    fallbackQuotes: DEFAULT_QUOTE_FALLBACKS,
  });

  const marketDataService = new MarketDataService(marketDataStream, quoteService);
  marketDataService.start();

  const liveStreamEnabled = (process.env.LIVE_STREAM_ENABLED ?? 'false').toLowerCase() === 'true';
  if (liveStreamEnabled) {
    binanceStreamClient.init();
    await app.register(marketStreamPlugin, { prefix: '/ws' });
    app.log.info('Live market stream enabled at /ws/markets');
  }

  // Routes
  try {
    await app.register(authRoutes, { prefix: '/api/auth' });
    app.log.info('Auth routes registered');
    await app.register(billingRoutes, { prefix: '/api/billing' });
    app.log.info('Billing routes registered');
    await app.register(dashboardRoutes, { prefix: '/api' });
    app.log.info('Dashboard routes registered');
    await app.register(tradingRoutes, { prefix: '/api' });
    await app.register(tradingFlowRoutes, { prefix: '/api' });
    app.log.info('Trading routes registered');
    await app.register(systemRoutes, { prefix: '/api' });
    app.log.info('System routes registered');
    await app.register(apiRoutes, { prefix: '/api' });
    app.log.info('API routes registered');
  } catch (err) {
    app.log.error({ err }, 'Error registering routes');
  }
  // Register market data routes with service - need to pass options correctly
  await app.register(async (fastify) => {
    await fastify.register(marketDataRoutes, { service: marketDataService });
  }, { prefix: '/api/market-data' });
  app.register(tcaRoutes, { prefix: '/api' });

  // Init Polymarket whales (feature-flag controlled inside the service)
  await initPolymarketWhales(app);

  // Whale watch routes (expose /api/whale-watch/polymarket)
  app.register(whaleWatchRoutes);

  return app;
}

async function main() {
  const app = await buildServer();
  const port = Number(process.env.PORT ?? '8080');
  const host = process.env.HOST ?? '0.0.0.0';

  try {
    await app.listen({ port, host });
    app.log.info({ port, host }, 'Backend listening');
  } catch (err) {
    app.log.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

// Run main when this file is executed directly
main();
