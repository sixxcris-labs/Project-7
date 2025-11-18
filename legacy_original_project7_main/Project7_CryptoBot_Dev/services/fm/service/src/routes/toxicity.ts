import { FastifyInstance } from "fastify";

export const registerToxicityRoutes = (app: FastifyInstance) => {
  app.post("/v1/toxicity/score", async (request, reply) => {
    const body: any = request.body || {};

    const toxicity = 0.5;

    return {
      symbol: body.symbol || "",
      toxicity,
      thresholds: { warn: 0.55, halt: 0.80 },
      participation_hint: toxicity > 0.8 ? "halt" : toxicity > 0.55 ? "slow" : "normal",
      model_version: "tox-1.0.0"
    };
  });
};
