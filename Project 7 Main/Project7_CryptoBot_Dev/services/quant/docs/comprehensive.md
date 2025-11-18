# Comprehensive Guide

This document explains all components, how to run them, and how to extend the system.

## Architecture (crypto-native)

- **Risk-as-code** with policy hashing and deterministic guard chain.
- **Execution Engine v2.0** with smart routing, TWAP/VWAP/iceberg, maker/taker toggle, and venue reliability.
- **Portfolio**: Kelly sizing (fractional), correlation caps, volatility overlays, convexity-aware drawdown guard (placeholder).
- **Strategy Vault**: momentum+funding, basis carry, perp skew MM, and cross-exchange arb.
- **Self-Evolving Backtest Lab**: parameter sweeps plus model card outputs.
- **Monitoring & Observability**: health score, FastAPI endpoint, TCA ledger with Merkle sealing.
- **Compliance + Replay Mode**: append-only JSONL fills and deterministic daily Merkle roots.

## Mapping Equities → Crypto

- LULD/SSR ⇒ **Volatility & Liquidation Buffer** guards.
- Short-sale constraints ⇒ **Position/Leverage & Venue** checks.
- T+2 settlement ⇒ **Funding PnL & Perpetuals mechanics**.
- Exchange microstructure ⇒ **CEX/DEX routing, maker/taker, gas-aware planning**.

## Runbook

1. `pip install -e .`
2. `python scripts/run_smoke.py` – OMS + guards sanity.
3. `python scripts/run_backtest.py --steps 1000` – synthetic backtest, artifacts emitted.
4. Review `artifacts/model_card.json` (Sharpe, PSR, winrate).
5. (Optional) Start the monitoring API: `uvicorn crypto_quant_ai.monitoring.api:app --port 8000`.

## Data connectors

- `CSVTicks` for offline runs.
- `SyntheticTicks` for quick smoke tests.
- CCXT-based connectors can be dropped into `data/` (see `feed.py` scaffold).

## Strategy of strategies

- Compute per-strategy Sharpe.
- Weight via `meta_allocate` with correlation cap and fractional Kelly sizing.

## Execution details

- Maker/taker toggling, reduce-only/post-only flags.
- TWAP/VWAP/iceberg child order generators.
- Venue ranking and failover in `SmartRouter`.

## Validation gates

- **Backtest promotion** targets: MIN_NET_SHARPE ≥ 1.5, PSR ≥ 0.95 (after costs).

## Next extensions

- Funding curves ingestion, liquidation maps, whale wallets, token unlock schedules.
- DEX router with gas/MEV-aware pathing.
- LangChain agent to mine alpha from papers, repos, and forums.
