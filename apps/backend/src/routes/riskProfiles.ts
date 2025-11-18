import type { FastifyInstance, FastifyRequest } from 'fastify';
import { RiskProfileService } from '../services/risk/RiskProfileService.js';
import { getUserRiskSettings, setUserRiskSettings } from '../services/store/UserRiskSettingsStore.js';

const riskService = new RiskProfileService();

function resolveWorkspaceId(req: FastifyRequest) {
  return (req.headers['x-workspace-id'] as string) || 'demo-workspace';
}

export function registerRiskProfileRoutes(app: FastifyInstance) {
  app.get('/api/risk/profiles', async() => ({ profiles: riskService.getProfiles() }));

  app.get('/api/risk/user-settings', async(req) => {
    const workspaceId = resolveWorkspaceId(req);
    return { workspaceId, settings: getUserRiskSettings(workspaceId) };
  });

  app.post('/api/risk/user-settings', async(req, reply) => {
    const workspaceId = resolveWorkspaceId(req);
    const payload = req.body as Record<string, any>;
    if (!riskService.isValidProfile(payload?.profile)) {
      reply.code(400);
      return { error: 'Unknown profile' };
    }
    const profile = {
      profile: payload.profile,
      maxPositionPct: payload.maxPositionPct,
      maxDailyLossPct: payload.maxDailyLossPct,
      requireKillSwitch: payload.requireKillSwitch,
    };
    const saved = setUserRiskSettings(workspaceId, profile);
    return { workspaceId, settings: saved };
  });
}
