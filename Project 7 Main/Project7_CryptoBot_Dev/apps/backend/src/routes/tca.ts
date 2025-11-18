import type { FastifyInstance, FastifyPluginAsync } from 'fastify';

export const tcaRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get('/tca/:runId', async (req, reply) => {
    const { runId } = req.params as { runId: string };

    try {
      const base = process.env.QUANT_BASE_URL;
      if (!base) {
        app.log.error('QUANT_BASE_URL is not set');
        return reply.status(500).send({
          code: 'TCA_MISCONFIGURED',
          message: 'QUANT_BASE_URL is not configured',
        });
      }

      const url = `${base.replace(/\/+$/, '')}/tca/${encodeURIComponent(runId)}`;
      const res = await fetch(url);

      if (!res.ok) {
        const text = await res.text().catch(() => '<no body>');
        return reply.status(res.status).send({
          code: 'UPSTREAM_ERROR',
          message: text,
        });
      }

      let json: unknown;
      try {
        json = await res.json();
      } catch {
        return reply.status(502).send({
          code: 'INVALID_JSON',
          message: 'Non-JSON upstream',
        });
      }

      return reply.status(200).send(json);
    } catch (err) {
      app.log.error({ err }, 'TCA upstream failure');
      return reply.status(502).send({
        code: 'BAD_GATEWAY',
      });
    }
  });
};
