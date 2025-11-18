from crypto_quant_ai.config.config import load_policy, project_root
from crypto_quant_ai.risk.guards import run_guard_chain
import os

def test_guard_chain_ok():
    pol = load_policy(os.path.join(project_root(), "src/crypto_quant_ai/config/policy.yml"))
    ctx = {"mid": 100.0, "spread": 0.02, "md_age_ms": 100, "bp_per_min": 10, "liq_buffer_bps": 200, "venue_score": 0.8, "pred_slippage_bps": 5, "position_usd": 100}
    res = run_guard_chain(ctx, pol)
    assert res.ok
