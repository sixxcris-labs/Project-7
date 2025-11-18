import DailyPerformanceWidget from "../../components/widgets/DailyPerformanceWidget";
import MindSafetyWidget from "../../components/widgets/MindSafetyWidget";
import WatchlistWidget from "../../components/widgets/WatchlistWidget";
import MarketPanelWidget from "../../components/widgets/MarketPanelWidget";
import OrderTicketWidget from "../../components/widgets/OrderTicketWidget";
import PolymarketWhalesWidget from "../../components/widgets/PolymarketWhalesWidget";
import BacktestSummaryWidget from "../../components/widgets/BacktestSummaryWidget";
import NewCoinsAndNewsWidget from "../../components/widgets/NewCoinsAndNewsWidget";

export default function DashboardContainer() {
  return (
    <div className="dashboard-board">
      <section className="dashboard-band top-strip">
        <DailyPerformanceWidget />
        <MindSafetyWidget />
      </section>

      <section className="dashboard-band markets">
        <WatchlistWidget />
        <MarketPanelWidget />
        <OrderTicketWidget />
      </section>

      <section className="dashboard-band whales">
        <PolymarketWhalesWidget />
      </section>

      <section className="dashboard-band bottom">
        <BacktestSummaryWidget />
        <NewCoinsAndNewsWidget />
      </section>
    </div>
  );
}
