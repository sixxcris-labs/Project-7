import { useDashboardStore } from "../../stores/dashboardStore";
import { updateWatchlist, useWatchlist } from "../../services/dashboard/hooks";

export default function WatchlistWidget() {
  const { data, error, mutate } = useWatchlist();
  const setCurrentSymbol = useDashboardStore((state) => state.setCurrentSymbol);
  const loading = !data && !error;

  const handleStar = async (symbol: string, favorite: boolean) => {
    await updateWatchlist({ symbol, favorite: !favorite });
    mutate();
  };

  return (
    <section className="widget-card">
      <header className="widget-header">
        <div>
          <p className="widget-label">Watchlist</p>
          <h2>Markets & Watchlist</h2>
        </div>
      </header>

      {loading && <p className="widget-empty">Loading watchlist…</p>}
      {error && <p className="widget-error">Watchlist unavailable.</p>}

      {data && (
        <div className="widget-list">
          {data.map((item) => (
            <article key={item.symbol} className="watchlist-row">
              <div>
                <strong>{item.symbol}</strong>
                <div className="muted">{item.exchange}</div>
              </div>
              <div>
                <span>{item.price.toFixed(2)}</span>
                <span className={item.change24hPct >= 0 ? "badge-positive" : "badge-negative"}>
                  {item.change24hPct.toFixed(2)}%
                </span>
              </div>
              <div className="watchlist-actions">
                <button type="button" onClick={() => setCurrentSymbol(item.symbol)}>
                  Open in chart
                </button>
                <button type="button" onClick={() => alert(`Alert modal placeholder for ${item.symbol}`)}>
                  Alert
                </button>
                <button type="button" onClick={() => handleStar(item.symbol, item.favorite)}>
                  {item.favorite ? "Unfavorite" : "Favorite"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
