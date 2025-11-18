import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import Stripe from 'stripe';
import billingRoutes from '../src/routes/billing.js';

const API_VERSION = '2024-06-20' as Stripe.LatestApiVersion;

test('Stripe webhook route verifies signatures using the raw request body', async () => {
  const originalApiKey = process.env.STRIPE_API_KEY;
  const originalWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  process.env.STRIPE_API_KEY = 'sk_test_123';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

  const app = Fastify();

  app.addContentTypeParser('*', { parseAs: 'buffer' }, (req, body, done) => {
    (req as typeof req & { rawBody?: Buffer }).rawBody = body;
    done(null, body);
  });

  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
    (req as typeof req & { rawBody?: Buffer }).rawBody = body;
    try {
      const parsed = JSON.parse(body.toString('utf8'));
      done(null, parsed);
    } catch (err) {
      done(err as Error);
    }
  });

  await app.register(billingRoutes, { prefix: '/billing' });

  const payload = '  { "id": "evt_123", "object": "event" }  ';
  const stripe = new Stripe(process.env.STRIPE_API_KEY!, { apiVersion: API_VERSION });
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: process.env.STRIPE_WEBHOOK_SECRET!,
  });

  const response = await app.inject({
    method: 'POST',
    url: '/billing/webhook',
    payload,
    headers: {
      'content-type': 'application/json',
      'stripe-signature': signature,
    },
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { received: true });

  await app.close();
  process.env.STRIPE_API_KEY = originalApiKey;
  process.env.STRIPE_WEBHOOK_SECRET = originalWebhookSecret;
});
