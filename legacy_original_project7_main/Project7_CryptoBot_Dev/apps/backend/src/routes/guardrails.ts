import { FastifyPluginAsync } from 'fastify';

const guardrailsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/guardrails/state', async () => {
    return {
      status: 'active',
      lastCheck: new Date().toISOString(),
      rules: [
        {
          id: 'max-position-size',
          name: 'Maximum Position Size',
          enabled: true,
          limit: 100000,
          current: 45678,
          status: 'ok',
          description: 'Limits maximum position size to $100,000'
        },
        {
          id: 'daily-loss-limit',
          name: 'Daily Loss Limit',
          enabled: true,
          limit: 5000,
          current: 1234,
          status: 'warning',
          description: 'Stops trading if daily loss exceeds $5,000'
        },
        {
          id: 'leverage-limit',
          name: 'Leverage Limit',
          enabled: true,
          limit: 3,
          current: 2.5,
          status: 'ok',
          description: 'Restricts maximum leverage to 3x'
        }
      ],
      violations: [],
      alerts: [
        {
          id: '1',
          type: 'warning',
          rule: 'daily-loss-limit',
          message: 'Approaching daily loss limit (75% used)',
          timestamp: new Date().toISOString()
        }
      ]
    };
  });
};

export { guardrailsRoutes };