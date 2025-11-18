import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

const fetchInvocations = [];

await mock.module('node-fetch', () => ({
  default: async (_url, init = {}) => {
    fetchInvocations.push(init);
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: {
        get(name) {
          return name.toLowerCase() === 'content-type' ? 'application/json' : null;
        },
      },
      json: async () => ({}),
      text: async () => '',
    };
  },
}));

test('signedRequest with string body uses form content type', async () => {
  fetchInvocations.length = 0;
  const { BinanceHttpClient } = await import(
    '../../../dist/apps/backend/src/integrations/binance/BinanceHttpClient.js'
  );

  const client = new BinanceHttpClient({
    restUrl: 'https://api.binance.com',
    apiKey: 'key',
    apiSecret: 'secret',
    recvWindow: 5000,
    symbols: [],
    pollIntervalMs: 1000,
    tradingEnabled: true,
  });

  await client.signedRequest(
    '/api/v3/order',
    { symbol: 'BTCUSDT', side: 'BUY', type: 'MARKET', quantity: '1' },
    'POST',
  );

  if (fetchInvocations.length !== 1) {
    assert.fail(`expected fetch to be called once, received ${fetchInvocations.length}`);
  }

  const init = fetchInvocations[0] ?? {};
  const headers = init.headers ?? {};
  const contentType = headers['Content-Type'] ?? headers['content-type'] ?? null;

  assert.equal(contentType, 'application/x-www-form-urlencoded');
});
