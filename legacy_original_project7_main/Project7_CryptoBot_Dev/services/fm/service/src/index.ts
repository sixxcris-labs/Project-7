import Fastify from "fastify";
import cors from "@fastify/cors";
import { loadConfig } from "./config";
import { registerHealthRoutes } from "./routes/health";
import { registerRobustRoutes } from "./routes/robust";
import { registerToxicityRoutes } from "./routes/toxicity";
import { registerRegimeRoutes } from "./routes/regime";
import { registerGateRoutes } from "./routes/gate";
import { registerDriftRoutes } from "./routes/drift";

const config = loadConfig();
const app = Fastify({ logger: true });

app.register(cors, { origin: true });

registerHealthRoutes(app);
registerRobustRoutes(app);
registerToxicityRoutes(app);
registerRegimeRoutes(app);
registerGateRoutes(app);
registerDriftRoutes(app);

app.listen({ port: config.port, host: "0.0.0.0" })
  .then(() => {
    app.log.info(`favorite-mistake-service listening on ${config.port} (${config.env})`);
  })
  .catch(err => {
    app.log.error(err);
    process.exit(1);
  });
