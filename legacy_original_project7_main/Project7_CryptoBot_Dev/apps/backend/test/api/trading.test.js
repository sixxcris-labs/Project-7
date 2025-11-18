import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import tradingPlugin from '../../dist/api/trading.js';

const buildApp = async (serviceOverrides = {}) => {
  const cancelOrderCalls = [];

  const service = {
    placeOrder: async () => {
      throw new Error('not implemented');
    },
    cancelOrder: async (payload) => {
      cancelOrderCalls.push(payload);
      return { ok: true };
    },
    getAccount: async () => {
      throw new Error('not implemented');
    },
    ...serviceOverrides,
  };

  const app = Fastify();
  await app.register(tradingPlugin, { service });
  await app.ready();

  return { app, cancelOrderCalls };
};

test('cancel order uses symbol from query string', async (t) => {
  const { app, cancelOrderCalls } = await buildApp();
  t.after(() => app.close());

  const response = await app.inject({
    method: 'DELETE',
    url: '/orders/123?symbol=ETH-USDT',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(cancelOrderCalls.length, 1);
  assert.equal(cancelOrderCalls[0].symbol, 'ETH-USDT');
  assert.equal(cancelOrderCalls[0].exchange, 'binance');
  assert.equal(cancelOrderCalls[0].orderId, '123');
});

test('cancel order requires symbol in query string', async (t) => {
  const { app, cancelOrderCalls } = await buildApp();
  t.after(() => app.close());

  const response = await app.inject({
    method: 'DELETE',
    url: '/orders/123',
  });

  assert.equal(response.statusCode, 400);
  assert.equal(cancelOrderCalls.length, 0);
  assert.deepEqual(response.json(), { error: 'symbol required' });
});
