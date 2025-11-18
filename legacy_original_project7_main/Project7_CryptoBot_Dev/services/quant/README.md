# crypto-quant-ai (v1)

Autonomous crypto trading super-agent that evolves strategies, runs risk-as-code, and executes across CEX/DEX venues. This repository is **ready-to-trade** with API keys and exchange credentials, and ships a **self-evolving backtest lab**, **strategy vault**, **risk/guard chain**, **execution engine v2.0**, and **monitoring & replay**.

> ⚠️ Risk Disclaimer: This software is provided for research and educational purposes. Crypto trading involves substantial risk. No returns are guaranteed.

## Quickstart

```bash
# (Recommended) Python 3.10+
pip install -e .
# smoke test
python scripts/run_smoke.py
# backtest (synthetic data or sample CSV)
python scripts/run_backtest.py --dataset datasets/sample_ticks.csv --strategy momentum_funding
# serve monitoring API
uvicorn crypto_quant_ai.monitoring.api:app --reload --port 8000
```

## Repository map
- `src/crypto_quant_ai/` – package with risk, execution, portfolio, backtest, data, and alpha modules.
- `docs/` – operations, deployment, scaling, compliance, and vault docs.
- `scripts/` – CLI entrypoints (backtest, smoke, model card).
- `tests/` – unit and property tests for core components.
- `datasets/` – tiny synthetic CSV for offline testing.
- `artifacts/` – run manifests, model cards, audit logs (append-only).

See `docs/comprehensive.md` for full detail.
