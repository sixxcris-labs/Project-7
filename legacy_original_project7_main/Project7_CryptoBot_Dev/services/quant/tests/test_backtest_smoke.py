from crypto_quant_ai.config.config import load_policy, project_root
from crypto_quant_ai.alpha.momentum_funding import MomentumFunding
from crypto_quant_ai.backtest.engine import Backtest
from crypto_quant_ai.data.feed import SyntheticTicks
import os

def test_backtest_smoke():
    pol = load_policy(os.path.join(project_root(), "src/crypto_quant_ai/config/policy.yml"))
    bt = Backtest(pol, [MomentumFunding()], artifacts_dir=os.path.join(project_root(), "artifacts"))
    m = bt.run(SyntheticTicks(steps=50))
    assert m.trades >= 1
