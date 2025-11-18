import type { RiskCheckResult, RiskProfile, TradePlan } from '../../types.js'; import { nanoid } from 'nanoid'; import { portfolio, guardrails } from '../store/PaperStore.js';
export class RiskService {
  validate(plan:TradePlan, profile:RiskProfile):RiskCheckResult{
    const reasons:string[]=[]; const pf=portfolio(); const gr=guardrails();
    const posCap = profile.maxPositionPct * pf.equity;
    const planned = plan.capital * (plan.entries?.[0]?.qtyPct ?? 0.02);
    if(planned>posCap) reasons.push(`position ${planned.toFixed(2)} exceeds cap ${posCap.toFixed(2)}`);
    const estLoss = planned * (plan.exitRules.stopLossPct ?? 0.03);
    const maxDaily = pf.equity * profile.maxDailyLossPct;
    if(estLoss>maxDaily) reasons.push(`est loss ${estLoss.toFixed(2)} exceeds daily ${maxDaily.toFixed(2)}`);
    if(profile.requireKillSwitch && !gr.killSwitch) reasons.push('kill switch not armed');
    return { id:nanoid(), status: reasons.length? 'blocked':'ok', reasons: reasons.length?reasons:undefined, computed:{ planned, posCap, estLoss, maxDaily } };
  }
}