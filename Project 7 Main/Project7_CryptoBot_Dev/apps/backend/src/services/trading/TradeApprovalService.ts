import type { TradePlan } from '../multiAgent/MultiAgentService';

export interface LiveStatus {
  enabled: boolean;
  reason?: string;
}

export interface ApproveTradeArgs {
  userId: string;
  plan: TradePlan;
  riskCheckId: string;
}

export interface ApproveTradeResult {
  executionId: string;
}

export interface ApproveLiveTradeArgs extends ApproveTradeArgs {
  confirmations: {
    acknowledgedRisk: boolean;
    acknowledgedMode: boolean;
  };
}

/**
 * TradeApprovalService sits between the multi-agent layer and the existing TradingService.
 * In stub mode it simply echoes back a fake execution id. When wired to TradingService it
 * can translate TradePlan entries into real orders.
 */
export class TradeApprovalService {

  async getLiveTradingStatus(userId: string): Promise<LiveStatus> {
    const enabledEnv =
      (process.env.BINANCE_TRADING_ENABLED ?? 'false').toLowerCase() === 'true';

    if (!enabledEnv) {
      return {
        enabled: false,
        reason: 'Live trading disabled via BINANCE_TRADING_ENABLED=false (stub).',
      };
    }

    // In a real system you might consult user/account-level flags here.
    return { enabled: true };
  }

  async approvePaperTrade(args: ApproveTradeArgs): Promise<ApproveTradeResult> {
    // Paper mode: do not hit exchanges; just simulate an execution id.
    const executionId = `paper-${Date.now()}`;
    return { executionId };
  }

  async approveLiveTrade(args: ApproveLiveTradeArgs): Promise<ApproveTradeResult> {
    const status = await this.getLiveTradingStatus(args.userId);
    if (!status.enabled) {
      throw new Error(status.reason || 'Live trading disabled.');
    }

    if (!args.confirmations.acknowledgedRisk || !args.confirmations.acknowledgedMode) {
      throw new Error('Live trade requires risk and mode acknowledgements.');
    }

    // Stub: instead of really placing orders, we just return a fake id.
    // To wire to real execution, use this.createTradingService() and map plan.entries
    // to TradingService.placeOrder() calls.
    const executionId = `live-${Date.now()}`;
    return { executionId };
  }
}
