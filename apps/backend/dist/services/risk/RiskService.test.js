import { describe, it, expect } from 'vitest';
import { RiskService } from './RiskService';
const plan = { id: 'p', analysisId: 'a', symbol: 'BTCUSDT', timeframe: '1h', capital: 100000, entries: [{ side: 'BUY', qtyPct: 0.02, rationale: 'x' }], exitRules: { stopLossPct: 0.02, takeProfitPct: 0.04 } };
describe('RiskService', () => {
    it('blocks when position too large', () => {
        const r = new RiskService().validate(plan, { profile: 'neutral', maxPositionPct: 0.01, maxDailyLossPct: 0.3, requireKillSwitch: false });
        expect(r.status).toBe('blocked');
    });
    it('ok when within limits', () => {
        const r = new RiskService().validate(plan, { profile: 'neutral', maxPositionPct: 0.5, maxDailyLossPct: 0.5, requireKillSwitch: false });
        expect(r.status).toBe('ok');
    });
});
