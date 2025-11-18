import { create } from "zustand";
import type { TradeEnvironment } from "./dashboardStore";
import type {
  AgentSummary,
  TradePlan,
  RiskValidationResult,
  LiveStatus,
  RunAnalysisRequest,
} from "../services/api/tradingFlowApi";
import * as tradingFlowApi from "../services/api/tradingFlowApi";

export type TradingSessionStep =
  | "idle"
  | "analysis"
  | "plan"
  | "risk"
  | "readyToSubmit"
  | "submitting"
  | "completed"
  | "error";

export interface TradingSessionState {
  // configuration
  symbol: string;
  side: "long" | "short";
  notional: number;
  timeframe: string;
  strategyProfile: string;
  riskProfileId: string;
  environment: TradeEnvironment;

  // session lifecycle
  step: TradingSessionStep;
  isBusy: boolean;
  errorMessage?: string;

  // analysis
  analysisId?: string;
  agents: AgentSummary[];
  combinedSummary?: string;

  // trade plan
  tradePlan?: TradePlan;

  // risk
  riskResult?: RiskValidationResult;

  // system / live trading
  liveStatus?: LiveStatus;

  // configuration actions
  setSymbol(symbol: string): void;
  setSide(side: "long" | "short"): void;
  setNotional(value: number): void;
  setTimeframe(tf: string): void;
  setStrategyProfile(profile: string): void;
  setRiskProfileId(id: string): void;
  setEnvironment(env: TradeEnvironment): void;

  // pipeline actions
  loadLiveStatus(): Promise<void>;
  runAnalysis(): Promise<void>;
  generateTradePlan(): Promise<void>;
  validateRisk(): Promise<void>;
  approvePaper(): Promise<void>;
  approveLive(confirmations: {
    acknowledgedRisk: boolean;
    acknowledgedMode: boolean;
  }): Promise<void>;
  resetSession(): void;
}

export const useTradingSessionStore = create<TradingSessionState>((set, get) => ({
  // defaults
  symbol: "",
  side: "long",
  notional: 1000,
  timeframe: "1h",
  strategyProfile: "swing",
  riskProfileId: "moderate",
  environment: "paper",

  step: "idle",
  isBusy: false,
  agents: [],

  setSymbol(symbol) {
    set({ symbol });
  },
  setSide(side) {
    set({ side });
  },
  setNotional(value) {
    set({ notional: value });
  },
  setTimeframe(tf) {
    set({ timeframe: tf });
  },
  setStrategyProfile(profile) {
    set({ strategyProfile: profile });
  },
  setRiskProfileId(id) {
    set({ riskProfileId: id });
  },
  setEnvironment(env) {
    set({ environment: env });
  },

  async loadLiveStatus() {
    try {
      const liveStatus = await tradingFlowApi.fetchLiveStatus();
      set({ liveStatus });
    } catch {
      // non-fatal; leave liveStatus undefined
    }
  },

  async runAnalysis() {
    const state = get();
    if (!state.symbol || !state.notional || !Number.isFinite(state.notional)) {
      set({
        errorMessage: "Set symbol and trade size before running analysis.",
      });
      return;
    }

    set({
      isBusy: true,
      step: "analysis",
      errorMessage: undefined,
      agents: [],
      combinedSummary: undefined,
      tradePlan: undefined,
      riskResult: undefined,
    });

    try {
      const body: RunAnalysisRequest = {
        symbol: state.symbol,
        side: state.side,
        sizeNotional: state.notional,
        timeframe: state.timeframe,
        strategyProfile: state.strategyProfile,
        riskProfileId: state.riskProfileId,
      };
      const res = await tradingFlowApi.runAnalysis(body);
      set({
        analysisId: res.analysisId,
        agents: res.agents,
        combinedSummary: res.combinedSummary,
        step: "plan",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to run analysis.";
      set({ errorMessage: message, step: "error" });
    } finally {
      set({ isBusy: false });
    }
  },

  async generateTradePlan() {
    const state = get();
    if (!state.analysisId) {
      set({
        errorMessage: "Run multi-agent analysis before generating a plan.",
      });
      return;
    }

    set({ isBusy: true, errorMessage: undefined });

    try {
      const plan = await tradingFlowApi.generateTradePlan({
        analysisId: state.analysisId,
        constraints: {
          maxRiskPct: 1,
          timeHorizon: state.timeframe,
        },
      });
      set({ tradePlan: plan, step: "plan" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate trade plan.";
      set({ errorMessage: message, step: "error" });
    } finally {
      set({ isBusy: false });
    }
  },

  async validateRisk() {
    const state = get();
    if (!state.tradePlan) {
      set({
        errorMessage: "Generate a trade plan before running risk checks.",
      });
      return;
    }

    set({
      isBusy: true,
      errorMessage: undefined,
      step: "risk",
    });

    try {
      const result = await tradingFlowApi.validateTradePlan({
        tradePlanId: state.tradePlan.tradePlanId,
        mode: state.environment,
      });
      set({
        riskResult: result,
        step: result.approved ? "readyToSubmit" : "error",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to validate risk.";
      set({ errorMessage: message, step: "error" });
    } finally {
      set({ isBusy: false });
    }
  },

  async approvePaper() {
    const state = get();
    if (!state.tradePlan || !state.riskResult) {
      set({
        errorMessage:
          "A trade plan and successful risk check are required before approval.",
      });
      return;
    }

    set({
      isBusy: true,
      errorMessage: undefined,
      step: "submitting",
    });

    try {
      await tradingFlowApi.approvePaperTrade({
        tradePlanId: state.tradePlan.tradePlanId,
        riskCheckId: state.riskResult.riskCheckId,
      });
      set({ step: "completed" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to approve paper trade.";
      set({ errorMessage: message, step: "error" });
    } finally {
      set({ isBusy: false });
    }
  },

  async approveLive(confirmations) {
    const state = get();
    if (!state.tradePlan || !state.riskResult) {
      set({
        errorMessage:
          "A trade plan and successful risk check are required before approval.",
      });
      return;
    }

    if (!state.liveStatus?.enabled) {
      set({
        errorMessage:
          state.liveStatus?.reason ||
          "Live trading is not enabled for this account.",
      });
      return;
    }

    if (!confirmations.acknowledgedRisk || !confirmations.acknowledgedMode) {
      set({
        errorMessage:
          "Acknowledge risk and mode before approving a live trade.",
      });
      return;
    }

    set({
      isBusy: true,
      errorMessage: undefined,
      step: "submitting",
    });

    try {
      await tradingFlowApi.approveLiveTrade({
        tradePlanId: state.tradePlan.tradePlanId,
        riskCheckId: state.riskResult.riskCheckId,
        confirmations,
      });
      set({ step: "completed" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to approve live trade.";
      set({ errorMessage: message, step: "error" });
    } finally {
      set({ isBusy: false });
    }
  },

  resetSession() {
    set({
      analysisId: undefined,
      agents: [],
      combinedSummary: undefined,
      tradePlan: undefined,
      riskResult: undefined,
      errorMessage: undefined,
      step: "idle",
    });
  },
}));
