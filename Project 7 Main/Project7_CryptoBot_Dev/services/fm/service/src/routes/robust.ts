import { FastifyInstance } from "fastify";

export const registerRobustRoutes = (app: FastifyInstance) => {
  app.post("/v1/robust/mean-cov", async (request, reply) => {
    const body: any = request.body || {};

    const features: number[][] = body.features || [];
    const dimension = features[0]?.length || 0;

    const mean = new Array(dimension).fill(0);
    const cov = Array.from({ length: dimension }, () => new Array(dimension).fill(0));

    return {
      symbol: body.symbol || "",
      model_version: "robust-1.0.0",
      mean,
      cov,
      diagnostics: {
        inliers: 1.0,
        condition_number: 1.0
      },
      latency_ms: 0
    };
  });
};
