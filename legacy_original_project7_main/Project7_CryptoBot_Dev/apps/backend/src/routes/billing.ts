import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import Stripe from 'stripe';

export const billingRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  const stripe = stripeSecretKey
    ? new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' })
    : null;

  app.post('/webhook', {
    // fastify-raw-body is registered in index.ts, this opts-in for this route
    config: { rawBody: true },
    handler: async (req, reply) => {
      try {
        if (!webhookSecret || !stripe) {
          app.log.error('Stripe webhook misconfigured (missing secret or client)');
          return reply.status(500).send({
            code: 'BILLING_MISCONFIGURED',
            message: 'Stripe not configured',
          });
        }

        const sig = req.headers['stripe-signature'];
        if (!sig || typeof sig !== 'string') {
          return reply.status(400).send({ code: 'MISSING_SIGNATURE' });
        }

        const raw = (req as any).rawBody;
        if (!raw || typeof raw !== 'string') {
          return reply.status(400).send({ code: 'MISSING_RAW_BODY' });
        }

        let event: Stripe.Event;
        try {
          event = stripe.webhooks.constructEvent(raw, sig, webhookSecret);
        } catch (err) {
          app.log.warn({ err }, 'Invalid Stripe signature');
          return reply.status(400).send({ code: 'INVALID_SIGNATURE' });
        }

        // Handle event types here if needed; for now we just log and ack
        app.log.info({ type: event.type }, 'Stripe webhook received');

        return reply.status(200).send({ received: true });
      } catch (err) {
        app.log.error({ err }, 'Stripe webhook error');
        return reply.status(500).send({ code: 'INTERNAL' });
      }
    },
  });
};
