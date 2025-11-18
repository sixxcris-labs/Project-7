import Fastify from 'fastify';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import { registerTradingFlowRoutes } from './routes/tradingFlow.js';
import { registerAiRoutes } from './routes/ai.js';
import { getConfig } from './util/config.js';
import { initPaperStore } from './services/store/PaperStore.js';

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });
await app.register(formbody);

app.get('/health', async()=>({ ok:true }));

const cfg = getConfig();
await initPaperStore(cfg.PAPER_DATA_PATH);
registerTradingFlowRoutes(app);
registerAiRoutes(app);

const port = Number(process.env.PORT || 3001);
app.listen({ port, host:'0.0.0.0' }).then(()=>app.log.info(`Backend ${port}`)).catch(e=>{ app.log.error(e); process.exit(1); });
