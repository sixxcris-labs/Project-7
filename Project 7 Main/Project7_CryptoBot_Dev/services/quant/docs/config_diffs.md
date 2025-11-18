# Config & Behavior Diffs (Equities → Crypto)

| Equities Concept | Crypto Equivalent | Notes |
|---|---|---|
| LULD | Volatility Cap | `volatility_cap_bp_per_min` |
| SSR | Position & Leverage Guard | `position_limit_usd`, `leverage_limit` |
| Borrow/SSR | Funding PnL & Perp Mechanics | Dailyized funding proxy |
| TCA with IS | Same + Maker/Taker split | Logged per fill |
