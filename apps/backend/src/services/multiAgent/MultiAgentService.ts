import axios from 'axios'; import { nanoid } from 'nanoid'; import { getConfig } from '../../util/config.js'; import { putAnalysis } from '../store/PaperStore.js';
import type { AgentAnalysis, AnalysisRequest } from '../../types.js';
export class MultiAgentService {
  async runAnalysis(req:AnalysisRequest):Promise<AgentAnalysis>{
    const cfg=getConfig();
    try{ const {data}=await axios.post(`${cfg.QUANT_API_URL}/analysis`, req, {timeout:5000});
      const a:AgentAnalysis={ id:nanoid(), createdAt:new Date().toISOString(), symbol:req.symbol, timeframe:req.timeframe, summary:data.summary || 'ok', signals:data.signals || []};
      await putAnalysis(a); return a;
    }catch{ const a:AgentAnalysis={ id:nanoid(), createdAt:new Date().toISOString(), symbol:req.symbol, timeframe:req.timeframe, summary:'fallback', signals:[{name:'Momentum',value:0.1,weight:0.5}]}; await putAnalysis(a); return a; }
  }
  async generatePlan(input:{analysisId:string;symbol:string;timeframe:string;capital:number}){
    const cfg=getConfig(); try{ const {data}=await axios.post(`${cfg.QUANT_API_URL}/trade-plan/generate`, input, {timeout:5000}); return data; }
    catch{ return { id:nanoid(), analysisId:input.analysisId, symbol:input.symbol, timeframe:input.timeframe, capital:input.capital,
      entries:[{side:'BUY',qtyPct:0.02,rationale:'fallback'}], exitRules:{stopLossPct:0.025,takeProfitPct:0.05}, meta:{source:'fallback'} }; }
  }
}