import type { FastifyInstance } from 'fastify';
import { MultiAgentService } from '../services/multiAgent/MultiAgentService.js';
import { RiskService } from '../services/risk/RiskService.js';
import { TradeApprovalService } from '../services/trading/TradeApprovalService.js';
import { putPlan, getRiskCheck, putRiskCheck, portfolio } from '../services/store/PaperStore.js';
import { analysisSchema, planSchema, riskSchema, approveSchema } from './tradingFlowSchemas.js';
export function registerTradingFlowRoutes(app: FastifyInstance){
  const agents=new MultiAgentService(); const risk=new RiskService(); const approvals=new TradeApprovalService();
  app.post('/api/agents/run-analysis', async(req)=>{ const p=analysisSchema.parse(req.body); return agents.runAnalysis(p as any); });
  app.post('/api/agents/generate-trade-plan', async(req)=>{ const p=planSchema.parse(req.body); const plan= await agents.generatePlan(p as any); await putPlan(plan); return plan; });
  app.post('/api/risk/validate-trade-plan', async(req)=>{ const {plan,profile}=riskSchema.parse(req.body); const r = risk.validate(plan as any, profile as any); await putRiskCheck(r); return r; });
  app.post('/api/trades/approve-paper', async(req,reply)=>{ const p=approveSchema.parse(req.body); const r=getRiskCheck(p.riskCheckId); if(!r || r.status!=='ok'){ reply.code(400); return {error:'Risk check missing or not OK'}; } return approvals.approvePaper(p.plan as any, p.confirmations||[]); });
  app.get('/api/portfolio', async()=> portfolio());
}
