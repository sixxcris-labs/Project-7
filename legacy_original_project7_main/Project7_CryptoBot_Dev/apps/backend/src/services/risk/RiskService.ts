import type { TradePlan } from '../multiAgent/MultiAgentService';

export type RiskProfileId = 'conservative' | 'moderate' | 'aggressive';

export interface RiskProfile {
  id: RiskProfileId;
  label: string;
  description: string;
  maxRiskPctPerTrade: number;
  maxDailyLossPct: number;
  maxLeverage: number;
}

export interface UserRiskSettings {
  profileId: RiskProfileId;
  customMaxRiskPctPerTrade?: number;
  customMaxDailyLossPct?: number;
  customMaxLeverage?: number;
}

export interface RiskMetrics {
  riskPct: number;
  maxDrawdownIfStopped: number;
  exposureByAsset: Record<string, number>;
  portfolioValueUsd?: number;
}

export interface RiskViolation {
  code: string;
  message: string;
  severity: 'warning' | 'error';
}

export interface RiskValidationResult {
  riskCheckId: string;
  approved: boolean;
  adjustedPlan?: TradePlan;
  violations: RiskViolation[];
  metrics: RiskMetrics;
}

export interface ValidateTradePlanArgs {
  userId: string;
  mode: 'paper' | 'live';
  plan: TradePlan;
}

// Example static profiles for stub mode
const DEFAULT_PROFILES: RiskProfile[] = [
  {
    id: 'conservative',
    label: 'Conservative',
    description: '0.5% per trade, low leverage and tight daily loss.',
    maxRiskPctPerTrade: 0.5,
    maxDailyLossPct: 2,
    maxLeverage: 1,
  },
  {
    id: 'moderate',
    label: 'Moderate',
    description: '1% per trade, balanced risk and return.',
    maxRiskPctPerTrade: 1,
    maxDailyLossPct: 4,
    maxLeverage: 2,
  },
  {
    id: 'aggressive',
    label: 'Aggressive',
    description: '2%+ per trade, higher drawdown tolerance.',
    maxRiskPctPerTrade: 2,
    maxDailyLossPct: 6,
    maxLeverage: 3,
  },
];

// Simple in-memory user settings for demo
const userSettingsStore = new Map<string, UserRiskSettings>();

export class RiskService {
  getProfiles(): RiskProfile[] {
    return DEFAULT_PROFILES;
  }

  async getUserSettings(userId: string): Promise<UserRiskSettings> {
    return (
      userSettingsStore.get(userId) ?? {
        profileId: 'moderate',
      }
    );
  }

  async saveUserSettings(
    userId: string,
    settings: UserRiskSettings,
  ): Promise<UserRiskSettings> {
    userSettingsStore.set(userId, settings);
    return settings;
  }

  async validateTradePlan(args: ValidateTradePlanArgs): Promise<RiskValidationResult> {
    const { plan, mode } = args;

    const entry = plan.entries[0]?.price ?? 0;
    const stop = plan.stopLoss.price;
    const distance = entry > 0 ? Math.abs(entry - stop) / entry : 0;
    const riskPct = Math.round(distance * 100 * 100) / 100 || 0.5;

    const portfolioValueUsd = 100_000;
    const maxDrawdownIfStopped = riskPct;

    const metrics: RiskMetrics = {
      riskPct,
      maxDrawdownIfStopped,
      exposureByAsset: {
        [plan.symbol]: plan.sizeNotional,
      },
      portfolioValueUsd,
    };

    const profile = DEFAULT_PROFILES[1]; // pretend "moderate" for stub
    const violations: RiskViolation[] = [];

    if (riskPct > profile.maxRiskPctPerTrade) {
      violations.push({
        code: 'RISK_PER_TRADE_EXCEEDED',
        severity: 'error',
        message: `Risk per trade ${riskPct.toFixed(
          2,
        )}% exceeds profile limit ${profile.maxRiskPctPerTrade}% (stub).`,
      });
    }

    if (mode === 'live' && plan.sizeNotional > portfolioValueUsd * 0.1) {
      violations.push({
        code: 'POSITION_TOO_LARGE',
        severity: 'warning',
        message: 'Live trade notional is large relative to stub portfolio size.',
      });
    }

    const approved = violations.every((v) => v.severity === 'warning');
    const riskCheckId = `risk-${Date.now()}`;

    return {
      riskCheckId,
      approved,
      adjustedPlan: plan,
      violations,
      metrics,
    };
  }
}
