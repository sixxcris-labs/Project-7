import { FastifyInstance } from "fastify";

export const registerRegimeRoutes = (app: FastifyInstance) => {
  app.post("/v1/regime/classify", async (request, reply) => {
    const body: any = request.body || {};
    const regime = "normal";

    return {
      regime,
      confidence: 0.5,
      hints: {
        mean_reversion_weight: 0.5,
        trend_weight: 0.5
      },
      model_version: "regime-1.0.0"
    };
  });
};
