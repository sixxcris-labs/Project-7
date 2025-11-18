import { z } from 'zod';

export const analysisSchema = z.object({
  symbol: z.string(),
  timeframe: z.string(),
  capital: z.number().positive(),
});

export const planSchema = z.object({
  analysisId: z.string(),
  symbol: z.string(),
  timeframe: z.string(),
  capital: z.number().positive(),
});

export const riskSchema = z.object({
  plan: z.any(),
  profile: z.object({
    profile: z.enum(['risky', 'neutral', 'conservative']),
    maxPositionPct: z.number(),
    maxDailyLossPct: z.number(),
    requireKillSwitch: z.boolean(),
  }),
});

export const approveSchema = z.object({
  plan: z.any(),
  riskCheckId: z.string(),
  confirmations: z.array(z.string()).default([]),
});
