import type { TradePlan } from '../../types.js';
import { nanoid } from 'nanoid';
import { appendTrade, guardrails } from '../store/PaperStore.js';
import { getConfig } from '../../util/config.js';

export class LiveTradeApprovalService {
  private readonly cfg = getConfig();

  async approveLive(plan: TradePlan) {
    if (!this.cfg.BINANCE_TRADING_ENABLED) throw new Error('Live trading disabled (BINANCE_TRADING_ENABLED=false)');
    const { killSwitch, liveEnabled } = guardrails();
    if (!liveEnabled || !killSwitch) throw new Error('Guardrails block live trading');
    const qtyPct = plan.entries?.[0]?.qtyPct ?? 0.02;
    const price = plan.meta?.lastPrice || 50000;
    const notional = plan.capital * qtyPct;
    const qty = notional / price;
    await appendTrade(plan.symbol, 'BUY', qty, price);
    return { id: nanoid(), status: 'LIVE_APPROVED' as const, planId: plan.id, qty, avgPrice: price, ts: new Date().toISOString() };
  }
}
