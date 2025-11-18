import { create } from 'zustand';
import { tradingFlowApi } from '../lib/tradingFlowApi';

export interface RiskProfile {
  profile: 'risky' | 'neutral' | 'conservative';
  maxPositionPct: number;
  maxDailyLossPct: number;
  requireKillSwitch: boolean;
}

export interface TradingSessionState {
  symbol: string;
  timeframe: string;
  capital: number;
  loading: boolean;
  analysis: any;
  plan: any;
  risk: any;
  approval: any;
  riskProfiles: RiskProfile[];
  selectedProfile?: RiskProfile;
  profileLoading: boolean;
  profileStatus?: string;
  runAgents: () => Promise<void>;
  generatePlan: () => Promise<void>;
  validateRisk: () => Promise<void>;
  approvePaper: () => Promise<void>;
  loadRiskProfiles: () => Promise<void>;
  saveRiskProfile: (profile: RiskProfile) => Promise<void>;
  reset: () => void;
}

export const useTradingSession = create<TradingSessionState>((set, get) => ({
  symbol: 'BTCUSDT',
  timeframe: '1h',
  capital: 100000,
  loading: false,
  analysis: undefined,
  plan: undefined,
  risk: undefined,
  approval: undefined,
  riskProfiles: [],
  selectedProfile: undefined,
  profileLoading: false,
  profileStatus: undefined,
  async loadRiskProfiles() {
    set({ profileLoading: true, profileStatus: undefined });
    try {
      const { profiles } = await tradingFlowApi.getRiskProfiles();
      set({ riskProfiles: profiles, selectedProfile: profiles.find((p: RiskProfile) => p.profile === 'neutral') });
      const saved = await tradingFlowApi.getRiskUserSettings();
      if (saved?.settings) {
        set({ selectedProfile: saved.settings });
      }
    } catch (err: any) {
      set({ profileStatus: err.message || 'Unable to load risk profiles' });
    } finally {
      set({ profileLoading: false });
    }
  },
  async saveRiskProfile(profile: RiskProfile) {
    set({ profileLoading: true, profileStatus: undefined });
    try {
      const res = await tradingFlowApi.setRiskUserSettings(profile);
      set({ selectedProfile: res.settings, profileStatus: 'Profile saved' });
    } catch (err: any) {
      set({ profileStatus: err.message || 'Failed to save profile' });
    } finally {
      set({ profileLoading: false });
    }
  },
  async runAgents() {
    set({ loading: true });
    try {
      const { symbol, timeframe, capital } = get();
      const a = await tradingFlowApi.runAnalysis({ symbol, timeframe, capital });
      set({ analysis: a });
    } finally {
      set({ loading: false });
    }
  },
  async generatePlan() {
    set({ loading: true });
    try {
      const { analysis, symbol, timeframe, capital } = get();
      if (!analysis) throw new Error('Run agents first');
      const plan = await tradingFlowApi.generateTradePlan({
        analysisId: analysis.id,
        symbol,
        timeframe,
        capital,
      });
      set({ plan });
    } finally {
      set({ loading: false });
    }
  },
  async validateRisk() {
    set({ loading: true });
    try {
      const { plan, selectedProfile } = get();
      if (!plan) throw new Error('Generate plan first');
      const profile = selectedProfile ?? {
        profile: 'neutral',
        maxPositionPct: 0.1,
        maxDailyLossPct: 0.05,
        requireKillSwitch: true,
      };
      const risk = await tradingFlowApi.validateTradePlan(plan, profile);
      set({ risk });
    } finally {
      set({ loading: false });
    }
  },
  async approvePaper() {
    set({ loading: true });
    try {
      const { plan, risk } = get();
      if (!plan || !risk) throw new Error('Missing plan/risk');
      if (risk.status !== 'ok') throw new Error('Risk not OK');
      const approval = await tradingFlowApi.approvePaper(plan, risk.id, ['Confirm paper']);
      set({ approval });
    } finally {
      set({ loading: false });
    }
  },
  reset() {
    set({ analysis: undefined, plan: undefined, risk: undefined, approval: undefined });
  },
}));
