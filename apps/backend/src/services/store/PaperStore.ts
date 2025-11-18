import { promises as fs } from 'fs'; import path from 'path'; import { nanoid } from 'nanoid';
import type { PaperStateFile, TradePlan, RiskCheckResult, PortfolioState } from '../../types.js';
let statePath='./data/paper_state.json'; let state:PaperStateFile|null=null;
export async function initPaperStore(p:string){ statePath=p; try{ const raw=await fs.readFile(statePath,'utf-8'); state=JSON.parse(raw); }
catch{ state={ analyses:{}, plans:{}, riskChecks:{}, approvals:{}, guardrails:{ killSwitch:true, liveEnabled:false }, portfolio:{ equity:100000, positions:[], history:[] } }; await persist(); }}
async function persist(){ await fs.mkdir(path.dirname(statePath),{recursive:true}); await fs.writeFile(statePath, JSON.stringify(state,null,2)); }
export function getState(){ if(!state) throw new Error('not init'); return state!; }
export async function putAnalysis(a:any){ getState().analyses[a.id]=a; await persist(); } export function getAnalysis(id:string){ return getState().analyses[id]; }
export async function putPlan(p:TradePlan){ getState().plans[p.id]=p; await persist(); } export function getPlan(id:string){ return getState().plans[id]; }
export async function putRiskCheck(r:RiskCheckResult){ getState().riskChecks[r.id]=r; await persist(); } export function getRiskCheck(id:string){ return getState().riskChecks[id]; }
export async function appendTrade(symbol:string, side:'BUY'|'SELL', qty:number, price:number){ const s=getState(); const id=nanoid(); const ts=new Date().toISOString();
  s.portfolio.history.push({ id, symbol, side, qty, price, ts }); let pos=s.portfolio.positions.find(p=>p.symbol===symbol);
  if(!pos){ pos={symbol, qty:0, avgPrice:0}; s.portfolio.positions.push(pos); }
  if(side==='BUY'){ const total=pos.avgPrice*pos.qty + price*qty; pos.qty+=qty; pos.avgPrice= pos.qty>0 ? total/pos.qty : 0; } else { pos.qty-=qty; if(pos.qty<=0){ pos.qty=0; pos.avgPrice=0; } }
  await persist();
}
export function portfolio():PortfolioState{ return getState().portfolio; }
export function guardrails(){ return getState().guardrails; }
