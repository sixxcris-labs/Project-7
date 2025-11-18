import type { FastifyInstance } from 'fastify';
import { MultiAgentService } from '../services/multiAgent/MultiAgentService.js';
import { RiskService } from '../services/risk/RiskService.js';
import { TradeApprovalService } from '../services/trading/TradeApprovalService.js';
import { LiveTradeApprovalService } from '../services/trading/LiveTradeApprovalService.js';
import { MarketDataService } from '../services/marketData/MarketDataService.js';
import { putPlan, getRiskCheck, putRiskCheck, portfolio } from '../services/store/PaperStore.js';
import { analysisSchema, planSchema, riskSchema, approveSchema } from './tradingFlowSchemas.js';
export function registerTradingFlowRoutes(app: FastifyInstance){
  const agents=new MultiAgentService(); const risk=new RiskService(); const approvals=new TradeApprovalService();
  const liveApproval=new LiveTradeApprovalService();
  const market=new MarketDataService();
  app.post('/api/agents/run-analysis', async(req)=>{ const p=analysisSchema.parse(req.body); return agents.runAnalysis(p as any); });
  app.post('/api/agents/generate-trade-plan', async(req)=>{ const p=planSchema.parse(req.body); const plan= await agents.generatePlan(p as any); await putPlan(plan); return plan; });
  app.post('/api/risk/validate-trade-plan', async(req)=>{ const {plan,profile}=riskSchema.parse(req.body); const r = risk.validate(plan as any, profile as any); await putRiskCheck(r); return r; });
  app.post('/api/trades/approve-paper', async(req,reply)=>{ const p=approveSchema.parse(req.body); const r=getRiskCheck(p.riskCheckId); if(!r || r.status!=='ok'){ reply.code(400); return {error:'Risk check missing or not OK'}; } return approvals.approvePaper(p.plan as any, p.confirmations||[]); });
  app.post('/api/trades/approve-live', async(req,reply)=>{ const p=approveSchema.parse(req.body); const r=getRiskCheck(p.riskCheckId); if(!r || r.status!=='ok'){ reply.code(400); return {error:'Risk check missing or not OK'}; } try{ return await liveApproval.approveLive(p.plan as any); }catch(e){ reply.code(400); return {error:(e as Error).message}; }}); 
  app.get('/api/portfolio', async()=> portfolio());
  app.get('/api/market-data/quotes', async(req)=>{ const query=req.query as Record<string,string|undefined>; const rawSymbols= typeof query.symbols==='string'?query.symbols:''; const symbols=rawSymbols.split(',').map((s:string)=>s.trim()).filter(Boolean); return { quotes: market.getQuotes(symbols) }; });
}
