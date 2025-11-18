from crypto_quant_ai.execution.oms_async import OMS, SmartRouter, SimExchange, Order
from crypto_quant_ai.config.config import load_policy, project_root
from crypto_quant_ai.risk.guards import run_guard_chain
import os

pol = load_policy(os.path.join(project_root(), "src/crypto_quant_ai/config/policy.yml"))
router = SmartRouter([SimExchange(name="simA")])
oms = OMS(router, pol, tca_ledger=None)

ctx = {"mid": 30000.0, "spread": 1.0, "md_age_ms": 100, "bp_per_min": 20.0, "venue_score": 0.9, "pred_slippage_bps": 5.0, "liq_buffer_bps": 200, "position_usd": 100}
order = Order(symbol="BTC/USDT", side="buy", qty=0.001)
resp = oms.submit(order, ctx)
print(resp)
