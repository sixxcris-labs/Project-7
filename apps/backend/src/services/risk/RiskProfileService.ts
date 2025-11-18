import type { RiskProfile } from '../../types.js';

const BASE_PROFILES: RiskProfile[] = [
  { profile: 'conservative', maxPositionPct: 0.03, maxDailyLossPct: 0.02, requireKillSwitch: true },
  { profile: 'neutral', maxPositionPct: 0.1, maxDailyLossPct: 0.05, requireKillSwitch: true },
  { profile: 'risky', maxPositionPct: 0.2, maxDailyLossPct: 0.1, requireKillSwitch: false },
];

export class RiskProfileService {
  getProfiles(): RiskProfile[] {
    return BASE_PROFILES;
  }

  isValidProfile(profileId: string | undefined): profileId is RiskProfile['profile'] {
    return BASE_PROFILES.some((p) => p.profile === profileId);
  }
}
