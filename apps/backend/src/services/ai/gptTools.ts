import { MultiAgentService } from '../multiAgent/MultiAgentService.js';
import { RiskService } from '../risk/RiskService.js';
import { portfolio } from '../store/PaperStore.js';

const agents = new MultiAgentService();
const risk = new RiskService();

export type PortfolioSnapshot = ReturnType<typeof portfolio>;

export async function get_portfolio_snapshot(): Promise<PortfolioSnapshot> {
  return portfolio();
}

export async function simulate_analysis(symbol: string, timeframe: string, capital: number) {
  return agents.runAnalysis({ symbol, timeframe, capital });
}

export async function simulate_plan(analysisId: string, symbol: string, timeframe: string, capital: number) {
  return agents.generatePlan({ analysisId, symbol, timeframe, capital });
}

export async function inspect_risk_check(plan: any, profile: { profile: 'risky' | 'neutral' | 'conservative'; maxPositionPct: number; maxDailyLossPct: number; requireKillSwitch: boolean }) {
  return risk.validate(plan, profile);
}
