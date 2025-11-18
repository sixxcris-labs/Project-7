import { FastifyInstance } from "fastify";

export const registerDriftRoutes = (app: FastifyInstance) => {
  app.post("/v1/drift/detect", async (request, reply) => {
    const body: any = request.body || {};

    return {
      symbol: body.symbol || "",
      drift: false,
      severity: 0.0,
      action: "none",
      model_version: "drift-1.0.0"
    };
  });
};
