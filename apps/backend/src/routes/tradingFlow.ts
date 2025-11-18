import type { FastifyInstance } from 'fastify'; import { z } from 'zod';
import { MultiAgentService } from '../services/multiAgent/MultiAgentService.js';
import { RiskService } from '../services/risk/RiskService.js';
import { TradeApprovalService } from '../services/trading/TradeApprovalService.js';
import { putPlan, getRiskCheck, putRiskCheck, portfolio } from '../services/store/PaperStore.js';
const analysisReq = z.object({ symbol:z.string(), timeframe:z.string(), capital:z.number().positive() });
const planReq = z.object({ analysisId:z.string(), symbol:z.string(), timeframe:z.string(), capital:z.number().positive() });
const riskReq = z.object({ plan: z.any(), profile: z.object({ profile:z.enum(['risky','neutral','conservative']), maxPositionPct:z.number(), maxDailyLossPct:z.number(), requireKillSwitch:z.boolean() }) });
const approveReq = z.object({ plan: z.any(), riskCheckId:z.string(), confirmations:z.array(z.string()).default([]) });
export function registerTradingFlowRoutes(app: FastifyInstance){
  const agents=new MultiAgentService(); const risk=new RiskService(); const approvals=new TradeApprovalService();
  app.post('/api/agents/run-analysis', async(req)=>{ const p=analysisReq.parse(req.body); return agents.runAnalysis(p as any); });
  app.post('/api/agents/generate-trade-plan', async(req)=>{ const p=planReq.parse(req.body); const plan= await agents.generatePlan(p as any); await putPlan(plan); return plan; });
  app.post('/api/risk/validate-trade-plan', async(req)=>{ const {plan,profile}=riskReq.parse(req.body); const r = risk.validate(plan as any, profile as any); await putRiskCheck(r); return r; });
  app.post('/api/trades/approve-paper', async(req,reply)=>{ const p=approveReq.parse(req.body); const r=getRiskCheck(p.riskCheckId); if(!r || r.status!=='ok'){ reply.code(400); return {error:'Risk check missing or not OK'}; } return approvals.approvePaper(p.plan as any, p.confirmations||[]); });
  app.get('/api/portfolio', async()=> portfolio());
}