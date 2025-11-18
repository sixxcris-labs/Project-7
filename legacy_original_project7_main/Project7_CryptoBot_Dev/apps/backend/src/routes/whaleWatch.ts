import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { getPolymarketContext } from '../services/polymarket';
import type { GetPolymarketWhalesResponse } from '../../../../packages/common/src/types/polymarketWhales';

interface QueryString {
  limit?: number;
}

export const whaleWatchRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get<{
    Querystring: QueryString;
    Reply: GetPolymarketWhalesResponse | { error: unknown };
  }>(
    '/api/whale-watch/polymarket',
    async (request, reply) => {
      const ctx = getPolymarketContext();
      if (!ctx) {
        return reply.status(503).send({
          error: {
            code: 'POLYMARKET_UNAVAILABLE',
            message:
              'Polymarket whales feature is disabled or not initialized',
          },
        });
      }

      const rawLimit = request.query.limit;
      if (
        rawLimit !== undefined &&
        (Number.isNaN(rawLimit) ||
          !Number.isFinite(rawLimit) ||
          rawLimit < 1 ||
          rawLimit > 200)
      ) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_LIMIT',
            message: 'limit must be an integer between 1 and 200',
            details: { limit: rawLimit },
          },
        });
      }

      const limit = rawLimit ?? 50;
      const whales = ctx.tracker.getWhalesAboveThreshold(limit);
      const response: GetPolymarketWhalesResponse = { whales };
      return reply.status(200).send(response);
    },
  );
};
