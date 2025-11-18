import { useDashboardStore } from "../../stores/dashboardStore";
import { DataPanel } from "./DataPanel";
import { useWatchlist } from "../../services/dashboard/hooks";

export default function WatchlistPanel() {
  const setCurrentSymbol = useDashboardStore((state) => state.setCurrentSymbol);
  const { data, error, mutate } = useWatchlist();
  const state = error ? "error" : data ? "ready" : "loading";

  return (
    <DataPanel
      title="Markets & Watchlist"
      state={state}
      actionLabel="Refresh"
      onAction={() => mutate()}
      loadingText="Loading watchlist…"
      errorText="Watchlist unavailable."
      emptyText="Add symbols to your watchlist."
    >
      {data && (
        <ul className="watchlist-table">
          {data.slice(0, 6).map((row) => (
            <li key={row.symbol}>
              <button type="button" onClick={() => setCurrentSymbol(row.symbol)}>
                {row.symbol}
              </button>
              <span>{row.price.toFixed(2)}</span>
              <span className={row.change24hPct >= 0 ? "badge-positive" : "badge-negative"}>
                {row.change24hPct.toFixed(2)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </DataPanel>
  );
}
