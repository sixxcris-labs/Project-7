# Strategy Vault

- `momentum_funding`: momentum gated by funding bias.
- `basis_carry`: funding/basis proxy mean-reversion.
- `perp_skew_mm`: maker skew when spreads widen.
- `xex_arb`: cross-exchange delta capture.

Configure weights in your orchestration layer; meta-allocation in `portfolio/manager.py` provides defaults.
