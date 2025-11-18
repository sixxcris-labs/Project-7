import type { RiskProfile } from '../../types.js';

const userSettings: Record<string, RiskProfile> = {};

export function getUserRiskSettings(userId: string): RiskProfile {
  return userSettings[userId] ?? { profile: 'neutral', maxPositionPct: 0.05, maxDailyLossPct: 0.05, requireKillSwitch: true };
}

export function setUserRiskSettings(userId: string, profile: RiskProfile) {
  userSettings[userId] = profile;
  return userSettings[userId];
}
