import { create } from "zustand";

export type DashboardTimeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
export type TradeEnvironment = "paper" | "live";

interface DashboardStoreState {
  currentSymbol: string;
  currentTimeframe: DashboardTimeframe;
  tradeEnvironment: TradeEnvironment;
  liveDataEnabled: boolean;
  notificationsCount: number;
  setCurrentSymbol: (symbol: string) => void;
  setCurrentTimeframe: (timeframe: DashboardTimeframe) => void;
  setTradeEnvironment: (env: TradeEnvironment) => void;
  setLiveDataEnabled: (enabled: boolean) => void;
  setNotificationsCount: (count: number) => void;
}

export const useDashboardStore = create<DashboardStoreState>((set) => ({
  currentSymbol: "BTC-USDT",
  currentTimeframe: "1h",
  tradeEnvironment: "paper",
  liveDataEnabled: true,
  notificationsCount: 0,
  setCurrentSymbol: (symbol) => set({ currentSymbol: symbol }),
  setCurrentTimeframe: (timeframe) => set({ currentTimeframe: timeframe }),
  setTradeEnvironment: (env) => set({ tradeEnvironment: env }),
  setLiveDataEnabled: (enabled) => set({ liveDataEnabled: enabled }),
  setNotificationsCount: (count) => set({ notificationsCount: count }),
}));
