import { FastifyInstance } from "fastify";

export const registerHealthRoutes = (app: FastifyInstance) => {
  app.get("/v1/healthz", async () => {
    return {
      status: "ok",
      build_sha: process.env.BUILD_SHA || "dev",
      model_versions: {
        robust: "robust-1.0.0",
        toxicity: "tox-1.0.0",
        regime: "regime-1.0.0",
        gate: "gate-1.0.0",
        drift: "drift-1.0.0"
      }
    };
  });

  app.get("/v1/readyz", async () => {
    return { status: "ready" };
  });
};
