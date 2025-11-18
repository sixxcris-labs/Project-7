import React from "react";

const coins = [
  {
    name: "Bitcoin (BTC)",
    value: "$50,156.01",
    holdings: "2.17 BTC",
    change: "+3.01%",
  },
  {
    name: "Ethereum (ETH)",
    value: "$38,903.45",
    holdings: "25.78 ETH",
    change: "+5.80%",
  },
  {
    name: "Polygon (MATIC)",
    value: "$0.89",
    holdings: "12,450 MATIC",
    change: "+7.42%",
  },
  {
    name: "Ripple (XRP)",
    value: "$0.47",
    holdings: "30,000 XRP",
    change: "-14.24%",
  },
];

const cards = [
  { brand: "Visa", masked: "•••• 4541" },
  { brand: "Visa", masked: "•••• 2072" },
  { brand: "American Express", masked: "•••• 1147" },
  { brand: "Discover", masked: "•••• 5651" },
];

const miniMetrics = [
  { label: "Sharpe", value: 1.18, change: "+0.04" },
  { label: "DSR", value: 1.02, change: "-0.02" },
  { label: "Max DD", value: "-7.8%", change: "+0.4%" },
  { label: "Fill Rate", value: 92, change: "+1%" },
];

const backtestMetrics = {
  worstLoss: "-$18,400",
  worstLossPct: "-11.2%",
  recoveryDays: 37,
  profit: "+$42,300",
  monthsProfitable: "18 / 24",
};

const marketCoins = [
  { name: "Bitcoin", symbol: "BTC", price: "$103,689.18", change: "+0.40%" },
  { name: "Ethereum", symbol: "ETH", price: "$3,541.47", change: "+2.59%" },
  { name: "Polygon", symbol: "MATIC", price: "$0.89", change: "+7.42%" },
  { name: "XRP", symbol: "XRP", price: "$2.50", change: "+4.56%" },
  { name: "BNB", symbol: "BNB", price: "$966.62", change: "+0.87%" },
  { name: "Solana", symbol: "SOL", price: "$156.14", change: "-0.11%" },
];

export default function WalletDashboard() {
  const [exchangeMode, setExchangeMode] = React.useState<'buy' | 'sell'>('buy');
  const [activeTab, setActiveTab] = React.useState('tradable');

  return (
    <div>
      <section className="wallet-panel" aria-label="Wallet overview">
        <div className="wallet-header">
          <h1>Wallet</h1>
          <div className="wallet-badges">
            <span className="badge">Total fees today: $2.99</span>
            <span className="badge">USD</span>
          </div>
        </div>

        <div className="wallet-stats">
          <div className="wallet-stat">
            <label>
              <span>Total Balance</span>
              <span>•</span>
            </label>
            <h2>$176,676.72</h2>
            <div className="wallet-bar" />
          </div>
          <div className="wallet-stat">
            <label>
              <span>Crypto</span>
              <span>BTC · ETH</span>
            </label>
            <h2>$76,676.72</h2>
            <div className="wallet-bar" />
          </div>
          <div className="wallet-stat">
            <label>
              <span>Fiat</span>
              <span>USD · EUR</span>
            </label>
            <h2>$100,000.72</h2>
            <div className="wallet-bar" />
          </div>
        </div>

        <div className="main-grid">
          <article className="exchange-card" aria-label="Exchange module">
            <div className="exchange-heading">
              <span>Exchange</span>
              <div className="pill-toggle">
                <span className="active">Buy</span>
                <span>Sell</span>
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Amount</label>
                <input defaultValue="100" />
              </div>
              <div className="field">
                <label>From</label>
                <input defaultValue="USD" />
              </div>
              <div className="field">
                <label>To</label>
                <input defaultValue="ETH" />
              </div>
            </div>

            <div className="fee-row">
              <span>1 ETH = 1,889.01 USD</span>
              <span>$0.00</span>
            </div>

            <button className="primary-btn" type="button">
              Buy
            </button>
          </article>

          <section className="coins-grid" aria-label="Assets">
            {coins.map((coin) => (
              <article key={coin.name} className="coin-card">
                <header>
                  <h3>{coin.name}</h3>
                </header>
                <div>{coin.value}</div>
                <div>{coin.holdings}</div>
                <div className="coin-trend" aria-hidden="true" />
                <div
                  className={
                    "coin-change" + (coin.change.startsWith("-") ? " negative" : "")
                  }
                >
                  {coin.change}
                </div>
              </article>
            ))}
          </section>
        </div>

        <section className="market-widget" aria-label="Market list">
          <div className="market-tabs" role="tablist">
            <button className="market-tab active" type="button">Tradable</button>
            <button className="market-tab" type="button">Top gainers</button>
            <button className="market-tab" type="button">New on Coinbase</button>
          </div>

          <div className="market-list">
            {marketCoins.map((coin) => (
              <div key={coin.name} className="market-row">
                <div className="market-left">
                  <div className="market-icon" aria-hidden="true" />
                  <div className="market-symbol-name">
                    <span>{coin.name}</span>
                    <span>{coin.symbol}</span>
                  </div>
                </div>

                <div className="market-right">
                  <div className="market-price">{coin.price}</div>
                  <div
                    className={
                      "market-change" + (coin.change.startsWith("-") ? " negative" : "")
                    }
                  >
                    {coin.change.startsWith("-") ? "↓ " : "↑ "}
                    {coin.change.replace(/[+\-]/, "")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="accounts-panel" aria-label="Accounts and cards">
          <div className="accounts-header">
            <span>Accounts and Cards</span>
            <span className="badge">4 active</span>
          </div>

          <div className="cards-row">
            {cards.map((card) => (
              <article key={card.brand + card.masked} className="card-tile">
                <div>{card.brand}</div>
                <small>Debit · {card.masked}</small>
              </article>
            ))}
          </div>

          <div className="add-method">
            <span className="buttonish">+ Add Payment Method</span>
          </div>
        </section>

        <section className="metrics-strip" aria-label="Strategy metrics">
          {miniMetrics.map((metric) => (
            <article key={metric.label} className="metric-pill">
              <p className="metric-label">{metric.label}</p>
              <h3>
                {metric.value}
                {metric.label === "Fill Rate" ? "%" : ""}
              </h3>
              <span
                className={
                  "metric-change" + (metric.change.startsWith("-") ? " negative" : "")
                }
              >
                {metric.change}
              </span>
              <div className="metric-progress" aria-hidden="true" />
            </article>
          ))}
        </section>

        <section className="backtest-panel" aria-label="Backtesting snapshot">
          <div>
            <div className="backtest-hero-label">Worst historical loss at your size</div>
            <div className="backtest-hero-value">
              {backtestMetrics.worstLoss} <span>({backtestMetrics.worstLossPct})</span>
            </div>
            <div className="backtest-hero-sub">
              Largest peak-to-trough dip during the test period. Would have recovered in
              ~{backtestMetrics.recoveryDays} days.
            </div>
          </div>
          <div className="backtest-chip-row">
            <div className="backtest-chip">
              <strong>P&amp;L</strong> {backtestMetrics.profit}
            </div>
            <div className="backtest-chip">
              <strong>Profitable months</strong> {backtestMetrics.monthsProfitable}
            </div>
            <div className="backtest-chip">
              <strong>Risk status</strong> Moderate
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}