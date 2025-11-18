import { create } from "zustand";
import type { StreamTradeTick } from "@common/types/marketData";

const FEED_LIMIT = 200;

export interface LiveMarketState {
  latestBySymbol: Record<string, StreamTradeTick | undefined>;
  feedBySymbol: Record<string, StreamTradeTick[]>;
  upsertTick: (tick: StreamTradeTick) => void;
  clearSymbol: (symbol: string) => void;
}

export const useLiveMarketStore = create<LiveMarketState>((set) => ({
  latestBySymbol: {},
  feedBySymbol: {},
  upsertTick: (tick) =>
    set((state) => {
      const feed = state.feedBySymbol[tick.symbol] ?? [];
      const nextFeed = [...feed, tick];
      if (nextFeed.length > FEED_LIMIT) {
        nextFeed.shift();
      }
      return {
        latestBySymbol: {
          ...state.latestBySymbol,
          [tick.symbol]: tick,
        },
        feedBySymbol: {
          ...state.feedBySymbol,
          [tick.symbol]: nextFeed,
        },
      };
    }),
  clearSymbol: (symbol) =>
    set((state) => {
      const { [symbol]: _, ...restLatest } = state.latestBySymbol;
      const { [symbol]: __, ...restFeed } = state.feedBySymbol;
      return { latestBySymbol: restLatest, feedBySymbol: restFeed };
    }),
}));
