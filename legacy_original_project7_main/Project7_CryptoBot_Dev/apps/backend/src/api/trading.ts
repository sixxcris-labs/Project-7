import type { FastifyInstance, FastifyPluginAsync } from 'fastify';

const tradingEnabled =
  (process.env.BINANCE_TRADING_ENABLED ?? 'false').toLowerCase() === 'true';

const orderBodySchema = {
  type: 'object',
  required: ['symbol', 'side', 'quantity', 'price'],
  properties: {
    symbol: { type: 'string', pattern: '^[A-Z0-9]+-[A-Z0-9]+$' },
    side: { type: 'string', enum: ['BUY', 'SELL'] },
    quantity: { type: 'number', exclusiveMinimum: 0 },
    price: { type: 'number', exclusiveMinimum: 0 },
  },
  additionalProperties: false,
};

export const tradingRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.post<{
    Body: {
      symbol: string;
      side: 'BUY' | 'SELL';
      quantity: number;
      price: number;
    };
  }>(
    '/trading/orders',
    {
      schema: {
        body: orderBodySchema,
      },
    },
    async (req, reply) => {
      if (!tradingEnabled) {
        app.log.warn({ route: 'orders.create' }, 'Trading disabled by flag');
        return reply.status(403).send({
          code: 'TRADING_DISABLED',
          message: 'Trading disabled',
        });
      }

      const { symbol, side, quantity, price } = req.body;

      // TODO: integrate with real exchange adapter
      return reply.status(201).send({
        id: 'order-id',
        symbol,
        side,
        quantity,
        price,
      });
    },
  );

  app.delete<{
    Params: { orderId: string };
    Querystring: { symbol?: string };
  }>(
    '/trading/orders/:orderId',
    async (req, reply) => {
      const { orderId } = req.params;
      const { symbol } = req.query;

      if (!symbol) {
        return reply.status(400).send({
          code: 'VALIDATION_ERROR',
          message: '`symbol` is required as a query parameter',
          details: { symbol },
        });
      }

      if (!tradingEnabled) {
        app.log.warn({ route: 'orders.cancel', orderId }, 'Trading disabled by flag');
        return reply.status(403).send({
          code: 'TRADING_DISABLED',
        });
      }

      // TODO: integrate with real exchange adapter to cancel the order
      return reply.status(200).send({
        cancelled: true,
        orderId,
        symbol,
      });
    },
  );
};
