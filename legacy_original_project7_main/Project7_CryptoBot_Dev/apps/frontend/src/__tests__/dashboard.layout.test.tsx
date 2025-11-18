import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import type { WatchlistEntry } from "@common/types/dashboard";

import DashboardPage from "../pages/dashboard";

const mockUsePerformanceSummary = vi.fn(() => ({
  data: {
    todayPnlUsd: 0,
    todayPnlPct: 0,
    tradesToday: 0,
    winRateToday: 0,
    riskUsedPct: 0,
    equityVsAthPct: 0,
    maxDrawdownTodayPct: 0,
    currentStreak: "0",
  },
}));
const mockUseWatchlist = vi.fn(() => ({
  data: [] as WatchlistEntry[],
  isLoading: false,
}));
const mockUseBacktestsList = vi.fn(() => ({ data: [], isLoading: false }));
const mockUseBacktestSummary = vi.fn(() => ({ data: null }));
const mockUseGuardrailsState = vi.fn(() => ({ data: null }));
const mockUseSystemStatus = vi.fn(() => ({ data: null }));
const mockUseBalances = vi.fn(() => ({ data: [] }));

vi.mock("../services/dashboard/hooks", () => ({
  usePerformanceSummary: () => mockUsePerformanceSummary(),
  useWatchlist: () => mockUseWatchlist(),
  useBacktestsList: () => mockUseBacktestsList(),
  useBacktestSummary: () => mockUseBacktestSummary(),
  useGuardrailsState: () => mockUseGuardrailsState(),
  useSystemStatus: () => mockUseSystemStatus(),
  useBalances: () => mockUseBalances(),
}));

vi.mock("../hooks/useLiveQuotes", () => ({ useLiveQuotes: () => ({ quotes: [] }) }));
vi.mock("../stores/dashboardStore", () => ({
  useDashboardStore: () => ({
    currentSymbol: "BTCUSDT",
    currentTimeframe: "1h",
    tradeEnvironment: "paper",
    setCurrentSymbol: vi.fn(),
    setCurrentTimeframe: vi.fn(),
    setNotificationsCount: vi.fn(),
    setTradeEnvironment: vi.fn(),
  }),
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

describe("Dashboard layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Trading Overview header", () => {
    render(<DashboardPage />);
    expect(screen.getByText(/Trading Overview/i)).toBeInTheDocument();
  });

  it("renders when performance data is provided", () => {
    mockUsePerformanceSummary.mockReturnValueOnce({
      data: {
        todayPnlUsd: 14200,
        todayPnlPct: 3.5,
        tradesToday: 5,
        winRateToday: 0.6,
        riskUsedPct: 0.25,
        equityVsAthPct: 0.95,
        maxDrawdownTodayPct: 0.1,
        currentStreak: "2",
      },
    });

    render(<DashboardPage />);
    expect(screen.getByText(/Trading Overview/i)).toBeInTheDocument();
  });

  it("renders when watchlist data is provided", () => {
    mockUseWatchlist.mockReturnValueOnce({
      data: [
        {
          symbol: "BTCUSDT",
          price: 103456,
          change24hPct: 1.23,
          volume24h: 0,
          alertEnabled: false,
          favorite: false,
          exchange: "Binance",
        },
      ],
      isLoading: false,
    });

    render(<DashboardPage />);
    expect(screen.getByText(/Trading Overview/i)).toBeInTheDocument();
  });
});
