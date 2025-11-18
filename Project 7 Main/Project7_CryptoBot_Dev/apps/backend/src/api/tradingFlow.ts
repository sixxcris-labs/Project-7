import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { MultiAgentService } from '../services/multiAgent/MultiAgentService';
import { RiskService } from '../services/risk/RiskService';
import { PortfolioService } from '../services/portfolio/PortfolioService';
import {
  TradeApprovalService,
  type ApproveLiveTradeArgs,
} from '../services/trading/TradeApprovalService';

const multiAgentService = new MultiAgentService();
const riskService = new RiskService();
const portfolioService = new PortfolioService();
const tradeApprovalService = new TradeApprovalService();

interface AuthedRequest {
  user?: {
    sub?: string;
    [key: string]: unknown;
  };
}

const tradingFlowRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  const getUserId = (req: AuthedRequest): string => {
    const sub = req.user && typeof req.user.sub === 'string' ? req.user.sub : undefined;
    return sub ?? 'demo-user';
  };

  // --- Agents ---

  app.post<{
    Body: {
      symbol: string;
      side: 'long' | 'short';
      sizeNotional: number;
      timeframe: string;
      strategyProfile: string;
      riskProfileId: string;
      notes?: string;
    };
  }>('/agents/run-analysis', async (req, reply) => {
    const body = req.body ?? ({} as any);

    if (!body.symbol || !body.side || !body.sizeNotional || !body.timeframe) {
      return reply.status(400).send({
        code: 'VALIDATION_ERROR',
        message: 'symbol, side, sizeNotional and timeframe are required',
      });
    }

    const result = await multiAgentService.runAnalysis({
      symbol: body.symbol,
      side: body.side,
      sizeNotional: body.sizeNotional,
      timeframe: body.timeframe,
      strategyProfile: body.strategyProfile ?? 'swing',
      riskProfileId: body.riskProfileId ?? 'moderate',
      notes: body.notes,
    });

    return result;
  });

  app.post<{
    Body: {
      analysisId: string;
      constraints?: {
        maxRiskPct?: number;
        maxLeverage?: number;
        timeHorizon?: string;
      };
    };
  }>('/agents/generate-trade-plan', async (req, reply) => {
    const { analysisId, constraints } = req.body ?? {};

    if (!analysisId) {
      return reply.status(400).send({
        code: 'VALIDATION_ERROR',
        message: 'analysisId is required',
      });
    }

    const plan = await multiAgentService.generateTradePlan({
      analysisSessionId: analysisId,
      constraints,
    });

    return plan;
  });

  // --- Risk profiles & settings ---

  app.get('/risk/profiles', async () => {
    return {
      items: riskService.getProfiles(),
    };
  });

  app.get('/risk/user-settings', async (req) => {
    const userId = getUserId(req as AuthedRequest);
    const settings = await riskService.getUserSettings(userId);
    return settings;
  });

  app.post<{
    Body: {
      profileId: 'conservative' | 'moderate' | 'aggressive';
      customMaxRiskPctPerTrade?: number;
      customMaxDailyLossPct?: number;
      customMaxLeverage?: number;
    };
  }>('/risk/user-settings', async (req, reply) => {
    const userId = getUserId(req as AuthedRequest);
    const body = req.body ?? ({} as any);

    if (!body.profileId) {
      return reply.status(400).send({
        code: 'VALIDATION_ERROR',
        message: 'profileId is required',
      });
    }

    const settings = await riskService.saveUserSettings(userId, {
      profileId: body.profileId,
      customMaxRiskPctPerTrade: body.customMaxRiskPctPerTrade,
      customMaxDailyLossPct: body.customMaxDailyLossPct,
      customMaxLeverage: body.customMaxLeverage,
    });

    return settings;
  });

  app.post<{
    Body: {
      tradePlanId: string;
      mode: 'paper' | 'live';
      plan: import('../services/multiAgent/MultiAgentService').TradePlan;
    };
  }>('/risk/validate-trade-plan', async (req, reply) => {
    const userId = getUserId(req as AuthedRequest);
    const body = req.body ?? ({} as any);

    if (!body.plan || !body.tradePlanId || !body.mode) {
      return reply.status(400).send({
        code: 'VALIDATION_ERROR',
        message: 'tradePlanId, mode and plan are required',
      });
    }

    const result = await riskService.validateTradePlan({
      userId,
      mode: body.mode,
      plan: body.plan,
    });

    return result;
  });

  // --- Approvals ---

  app.post<{
    Body: {
      tradePlanId: string;
      riskCheckId: string;
      plan: import('../services/multiAgent/MultiAgentService').TradePlan;
    };
  }>('/trades/approve-paper', async (req, reply) => {
    const userId = getUserId(req as AuthedRequest);
    const { tradePlanId, riskCheckId, plan } = req.body ?? ({} as any);

    if (!tradePlanId || !riskCheckId || !plan) {
      return reply.status(400).send({
        code: 'VALIDATION_ERROR',
        message: 'tradePlanId, riskCheckId and plan are required',
      });
    }

    const result = await tradeApprovalService.approvePaperTrade({
      userId,
      plan,
      riskCheckId,
    });

    return result;
  });

  app.post<{
    Body: {
      tradePlanId: string;
      riskCheckId: string;
      plan: import('../services/multiAgent/MultiAgentService').TradePlan;
      confirmations: ApproveLiveTradeArgs['confirmations'];
    };
  }>('/trades/approve-live', async (req, reply) => {
    const userId = getUserId(req as AuthedRequest);
    const { tradePlanId, riskCheckId, plan, confirmations } = req.body ?? ({} as any);

    if (!tradePlanId || !riskCheckId || !plan || !confirmations) {
      return reply.status(400).send({
        code: 'VALIDATION_ERROR',
        message: 'tradePlanId, riskCheckId, plan and confirmations are required',
      });
    }

    const result = await tradeApprovalService.approveLiveTrade({
      userId,
      plan,
      riskCheckId,
      confirmations,
    });

    return result;
  });

  // --- Portfolio & history ---

  app.get('/portfolio/positions', async (req) => {
    const userId = getUserId(req as AuthedRequest);
    const positions = await portfolioService.getPositions(userId);
    return positions;
  });

  app.get('/history/trades', async (req) => {
    const userId = getUserId(req as AuthedRequest);
    const mode =
      (req.query as any)?.mode === 'live' || (req.query as any)?.mode === 'paper'
        ? ((req.query as any).mode as 'paper' | 'live')
        : undefined;
    const symbol =
      typeof (req.query as any)?.symbol === 'string'
        ? ((req.query as any).symbol as string)
        : undefined;
    const page = Number((req.query as any)?.page ?? 1);
    const pageSize = Number((req.query as any)?.pageSize ?? 20);

    const result = await portfolioService.getTradeHistory(userId, {
      mode,
      symbol,
      page,
      pageSize,
    });

    return result;
  });

  // --- Live trading status ---

  app.get('/system/live-trading-status', async (req) => {
    const userId = getUserId(req as AuthedRequest);
    const status = await tradeApprovalService.getLiveTradingStatus(userId);
    return status;
  });
};

export { tradingFlowRoutes };
