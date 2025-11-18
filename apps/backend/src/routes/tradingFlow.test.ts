import { describe, it, expect } from 'vitest';
import { analysisSchema, planSchema, riskSchema, approveSchema } from './tradingFlowSchemas.js';

describe('tradingFlow schemas', () => {
  it('accepts valid analysis payloads', () => {
    expect(() => analysisSchema.parse({ symbol: 'BTCUSDT', timeframe: '1h', capital: 100000 })).not.toThrow();
  });

  it('accepts valid plan payloads', () => {
    expect(() => planSchema.parse({ analysisId: 'a', symbol: 'BTCUSDT', timeframe: '1h', capital: 100000 })).not.toThrow();
  });

  it('accepts valid risk payloads', () => {
    const plan = { id: 'plan', symbol: 'BTCUSDT' };
    const profile = { profile: 'neutral', maxPositionPct: 0.1, maxDailyLossPct: 0.05, requireKillSwitch: true };
    expect(() => riskSchema.parse({ plan, profile })).not.toThrow();
  });

  it('accepts valid approval payloads', () => {
    const plan = { id: 'plan', symbol: 'BTCUSDT' };
    const riskCheckId = 'risk';
    expect(() => approveSchema.parse({ plan, riskCheckId, confirmations: ['Confirm paper'] })).not.toThrow();
  });
});
