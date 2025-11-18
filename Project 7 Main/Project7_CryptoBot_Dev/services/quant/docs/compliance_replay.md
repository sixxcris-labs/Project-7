# Compliance & Replay

- Fills recorded to `artifacts/tca_ledger.jsonl` (append-only).
- Daily Merkle roots written to `artifacts/merkle_roots.json`.
- Replay by re-feeding ticks and loading fills to reproduce P&L.
