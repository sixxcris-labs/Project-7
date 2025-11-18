import type { FastifyInstance, FastifyRequest } from 'fastify';
import { GptAssistantService } from '../services/ai/GptAssistantService.js';

export type AiAskBody = {
  question: string;
  context?: { route?: '/dashboard' | '/trading'; symbol?: string; timeframe?: string };
};

export function registerAiRoutes(app: FastifyInstance) {
  const assistant = new GptAssistantService();

  app.post('/api/ai/ask', async (req: FastifyRequest<{ Body: AiAskBody }>) => {
    const body = req.body;
    if (!body?.question) {
      return { error: 'Question is required' };
    }
    const workspaceId = req.headers['x-workspace-id'] as string || 'demo-workspace';
    const userId = req.headers['x-user-id'] as string || 'demo-user';
    const result = await assistant.ask(body.question, workspaceId, userId, body.context ?? {});
    return result;
  });
}
