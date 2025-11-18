import type { TradePlan } from '../../types.js'; import { nanoid } from 'nanoid'; import { appendTrade } from '../store/PaperStore.js';
export class TradeApprovalService {
  async approvePaper(plan:TradePlan, confirmations:string[]){
    const qtyPct=plan.entries?.[0]?.qtyPct ?? 0.02; const price=plan.meta?.lastPrice || 50000; const notional=plan.capital*qtyPct; const qty=notional/price;
    await appendTrade(plan.symbol, plan.entries[0].side==='BUY'?'BUY':'SELL', qty, price);
    return { id:nanoid(), status:'FILLED' as const, planId:plan.id, qty, avgPrice:price, ts:new Date().toISOString() };
  }
}