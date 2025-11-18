import type { FastifyInstance } from 'fastify';
import { collectDefaultMetrics, register } from 'prom-client';

export function installMetrics(app: FastifyInstance) {
  collectDefaultMetrics({ register });
  app.get('/metrics', async (_req, res) => {
    res.header('Content-Type', register.contentType);
    return register.metrics();
  });
}

export { register as metricsRegister };
