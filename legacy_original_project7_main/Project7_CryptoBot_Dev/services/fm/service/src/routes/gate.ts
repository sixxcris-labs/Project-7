import { FastifyInstance } from "fastify";

export const registerGateRoutes = (app: FastifyInstance) => {
  app.post("/v1/gate/decision", async (request, reply) => {
    const body: any = request.body || {};

    return {
      symbol: body.symbol || "",
      allowed: true,
      size_multiplier: 1.0,
      route_hint: "normal",
      rollback: false,
      temporary_halt_sec: 0,
      rationale: [],
      model_version: "gate-1.0.0"
    };
  });
};
