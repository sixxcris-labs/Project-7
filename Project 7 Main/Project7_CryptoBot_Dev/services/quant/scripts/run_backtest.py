import argparse, os, json
from crypto_quant_ai.config.config import load_policy, policy_hash, project_root
from crypto_quant_ai.alpha.momentum_funding import MomentumFunding
from crypto_quant_ai.alpha.perp_skew_mm import PerpSkewMM
from crypto_quant_ai.alpha.basis_trade import BasisCarry
from crypto_quant_ai.backtest.engine import Backtest
from crypto_quant_ai.data.feed import SyntheticTicks, CSVTicks

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--policy", default=os.path.join(project_root(), "src/crypto_quant_ai/config/policy.yml"))
    parser.add_argument("--dataset", default="")
    parser.add_argument("--strategy", choices=["momentum_funding","perp_skew_mm","basis_carry","all"], default="all")
    parser.add_argument("--steps", type=int, default=500)
    args = parser.parse_args()

    pol = load_policy(args.policy)
    print("Policy hash:", policy_hash(pol))

    if args.dataset and os.path.exists(args.dataset):
        ticks = CSVTicks(args.dataset)
    else:
        ticks = SyntheticTicks(steps=args.steps)

    strats = []
    if args.strategy in ("momentum_funding","all"): strats.append(MomentumFunding())
    if args.strategy in ("perp_skew_mm","all"): strats.append(PerpSkewMM())
    if args.strategy in ("basis_carry","all"): strats.append(BasisCarry())

    bt = Backtest(pol, strats, artifacts_dir=os.path.join(project_root(), "artifacts"))
    metrics = bt.run(ticks)
    print("Backtest:", metrics)

if __name__ == "__main__":
    main()
