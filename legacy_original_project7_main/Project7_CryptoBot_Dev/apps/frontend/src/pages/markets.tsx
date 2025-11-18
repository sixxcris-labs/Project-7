import MarketPanelWidget from "../components/widgets/MarketPanelWidget";
import WatchlistWidget from "../components/widgets/WatchlistWidget";
import OrderTicketWidget from "../components/widgets/OrderTicketWidget";

export default function MarketsPage() {
  return (
    <div className="page-grid">
      <h1>Markets</h1>
      <div className="dashboard-band markets">
        <WatchlistWidget />
        <MarketPanelWidget />
        <OrderTicketWidget />
      </div>
    </div>
  );
}
