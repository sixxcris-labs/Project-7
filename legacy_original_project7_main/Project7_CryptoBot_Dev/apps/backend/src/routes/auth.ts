import type { FastifyInstance, FastifyPluginAsync } from 'fastify';

export const authRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.post<{ Body: { email?: string; password?: string } }>(
    '/login',
    async (req, reply) => {
      const { email, password } = req.body ?? {};

      // Basic body validation
      if (!email || !password) {
        return reply.status(400).send({
          code: 'VALIDATION_ERROR',
          message: 'email and password are required',
          details: {
            email: !!email,
            password: !!password,
          },
        });
      }

      const mode = (process.env.AUTH_MODE ?? 'demo').toLowerCase();

      // Only demo mode is implemented right now
      if (mode !== 'demo') {
        return reply.status(501).send({
          code: 'NOT_IMPLEMENTED',
          message: 'Auth provider not configured',
        });
      }

      const demoEmail = process.env.AUTH_DEMO_EMAIL ?? '';
      const demoPassword = process.env.AUTH_DEMO_PASSWORD ?? '';

      if (!demoEmail || !demoPassword) {
      return reply.status(500).send({
        code: 'AUTH_MISCONFIGURED',
        message: 'Demo auth requires AUTH_DEMO_EMAIL and AUTH_DEMO_PASSWORD',
      });
    }

      if (email !== demoEmail || password !== demoPassword) {
        return reply.status(401).send({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      // If JWT plugin is not registered (e.g. local without keys), fall back to a dev token
      if (!app.jwt) {
        return reply.status(200).send({
          token: 'dev-token',
          mode: 'demo-no-jwt',
        });
      }

      const token = await reply.jwtSign({
        sub: email,
        email,
        tenant: 'single',
        role: 'user',
      });

      return reply.status(200).send({ token });
    },
  );

  app.post('/logout', async () => {
    return { success: true };
  });
};
