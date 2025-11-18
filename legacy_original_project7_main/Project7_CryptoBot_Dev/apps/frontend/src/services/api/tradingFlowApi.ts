import { apiGet, apiPost } from "../../lib/api";

export type AgentStatus = "idle" | "running" | "done" | "error";

export interface AgentSummary {
  id: string;
  name: string;
  role?: string;
  status: AgentStatus;
  shortSummary: string;
  fullSummary?: string;
}

export interface RunAnalysisRequest {
  symbol: string;
  side: "long" | "short";
  sizeNotional: number;
  timeframe: string;
  strategyProfile: string;
  riskProfileId: string;
  notes?: string;
}

export interface RunAnalysisResponse {
  analysisId: string;
  agents: AgentSummary[];
  combinedSummary: string;
}

export interface TradePlanEntry {
  price: number;
  size: number;
  type: "limit" | "market";
}

export interface TradePlanTarget {
  price: number;
  size: number;
}

export interface TradePlan {
  tradePlanId: string;
  symbol: string;
  side: "long" | "short";
  sizeNotional: number;
  entries: TradePlanEntry[];
  stopLoss: { price: number; trailing?: boolean };
  targets: TradePlanTarget[];
  maxRiskPct: number;
  expectedRMultiple: number;
  timeHorizon: string;
  rationale: string;
  confidenceScore: number;
  createdAt: string;
}

export interface GenerateTradePlanRequest {
  analysisId: string;
  constraints?: {
    maxRiskPct?: number;
    maxLeverage?: number;
    timeHorizon?: string;
  };
}

export interface RiskMetrics {
  riskPct: number;
  maxDrawdownIfStopped: number;
  exposureByAsset?: Record<string, number>;
  portfolioValueUsd?: number;
}

export interface RiskViolation {
  code: string;
  message: string;
  severity: "warning" | "error";
}

export interface RiskValidationResult {
  riskCheckId: string;
  approved: boolean;
  adjustedPlan?: TradePlan;
  violations: RiskViolation[];
  metrics: RiskMetrics;
}

export interface ValidateTradePlanRequest {
  tradePlanId: string;
  mode: "paper" | "live";
}

export interface ApprovePaperTradeRequest {
  tradePlanId: string;
  riskCheckId: string;
}

export interface ApproveLiveTradeRequest extends ApprovePaperTradeRequest {
  confirmations: {
    acknowledgedRisk: boolean;
    acknowledgedMode: boolean;
  };
}

export interface ApproveTradeResponse {
  executionId: string;
}

export interface Position {
  id: string;
  symbol: string;
  side: "long" | "short";
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  mode: "paper" | "live";
  openedAt: string;
}

export interface Trade {
  id: string;
  symbol: string;
  side: "long" | "short";
  quantity: number;
  avgPrice: number;
  realizedPnl: number;
  mode: "paper" | "live";
  rMultiple?: number;
  openedAt: string;
  closedAt?: string;
}

export interface LiveStatus {
  enabled: boolean;
  reason?: string;
}

export interface TradeHistoryResponse {
  items: Trade[];
  total: number;
}

export function runAnalysis(body: RunAnalysisRequest): Promise<RunAnalysisResponse> {
  return apiPost<RunAnalysisResponse>("/api/agents/run-analysis", body);
}

export function generateTradePlan(body: GenerateTradePlanRequest): Promise<TradePlan> {
  return apiPost<TradePlan>("/api/agents/generate-trade-plan", body);
}

export function validateTradePlan(body: ValidateTradePlanRequest): Promise<RiskValidationResult> {
  return apiPost<RiskValidationResult>("/api/risk/validate-trade-plan", body);
}

export function approvePaperTrade(body: ApprovePaperTradeRequest): Promise<ApproveTradeResponse> {
  return apiPost<ApproveTradeResponse>("/api/trades/approve-paper", body);
}

export function approveLiveTrade(body: ApproveLiveTradeRequest): Promise<ApproveTradeResponse> {
  return apiPost<ApproveTradeResponse>("/api/trades/approve-live", body);
}

export function fetchPositions(): Promise<Position[]> {
  return apiGet<Position[]>("/api/portfolio/positions");
}

export function fetchTradeHistory(params: {
  mode?: "paper" | "live";
  symbol?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<TradeHistoryResponse> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null) searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  const path = query ? `/api/history/trades?${query}` : "/api/history/trades";
  return apiGet<TradeHistoryResponse>(path);
}

export function fetchLiveStatus(): Promise<LiveStatus> {
  return apiGet<LiveStatus>("/api/system/live-trading-status");
}
