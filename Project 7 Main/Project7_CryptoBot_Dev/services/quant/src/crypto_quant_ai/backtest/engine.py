from dataclasses import dataclass, asdict
from typing import Dict, Any, List, Tuple
from ..execution.oms_async import OMS, Order, SimExchange, SmartRouter
from ..risk.guards import run_guard_chain
from ..data.feed import predicted_slippage_bps
import time, json, math, statistics, hashlib, os, pathlib, random

@dataclass
class Metrics:
    pnl: float
    fees: float
    funding_pnl: float
    sharpe: float
    psr: float
    trades: int
    winrate: float

def _psr(returns: List[float]) -> float:
    if len(returns) < 10:
        return 0.0
    mu = statistics.mean(returns)
    sd = statistics.pstdev(returns) or 1e-9
    sr = (mu / sd) * (len(returns)**0.5)
    # Probabilistic Sharpe Ratio (approx): Phi((sr - 0)/sqrt(1 - 0.5))
    import math
    from math import erf, sqrt
    z = sr / math.sqrt(1.0 - 0.5)
    return 0.5 * (1 + erf(z / math.sqrt(2)))

class Backtest:
    def __init__(self, policy, strategies: List, artifacts_dir: str):
        venues = [SimExchange(name="CEX_A"), SimExchange(name="CEX_B")]
        self.oms = OMS(SmartRouter(venues), policy, tca_ledger=None)
        self.strats = strategies
        self.artifacts = artifacts_dir
        os.makedirs(self.artifacts, exist_ok=True)

    def run(self, ticks) -> Metrics:
        cash = 0.0
        pos = 0.0
        fees = 0.0
        funding_pnl = 0.0
        rets = []
        wins = 0
        trades = 0
        prev_mid = None

        for t in ticks:
            mid = t["mid"]
            if prev_mid is None:
                prev_mid = mid
            ctx = {
                "mid": mid,
                "spread": t["spread"],
                "md_age_ms": 100,
                "bp_per_min": t["bp_per_min"],
                "venue_score": 0.8,
                "pred_slippage_bps": predicted_slippage_bps(t["spread"], t["bp_per_min"]),
                "liq_buffer_bps": 200,
                "position_usd": abs(pos) * mid
            }
            # Strategy decisions
            for s in self.strats:
                sig = s.step(t, pos)
                if not sig:
                    continue
                side = sig.get("action")
                w = sig.get("weight", 0.25)
                qty = max(0.001, w * 0.01)  # fixed tiny sizing for demo
                price = None if side in ("buy","sell") else None
                order = Order(symbol="BTC/USDT", side=side, qty=qty, price=price, post_only=sig.get("post_only", False))
                resp = self.oms.submit(order, ctx)
                if resp["status"] == "ACK":
                    f = resp["fill"]
                    trades += 1
                    fees += f["fee"]
                    cash += -f["price"] * f["qty"] if side=="buy" else f["price"] * f["qty"]
                    pos += f["qty"] if side=="buy" else -f["qty"]
                    pnl_tick = (mid - prev_mid) * pos
                    rets.append(pnl_tick - f["fee"])
                    if pnl_tick > 0:
                        wins += 1
            # funding
            funding_pnl += pos * mid * t.get("funding_rate", 0.0) / 24.0
            prev_mid = mid

        final_pnl = cash + pos * prev_mid
        sharpe = (statistics.mean(rets)/(statistics.pstdev(rets) or 1e-9)) * (len(rets)**0.5) if rets else 0.0
        psr = _psr(rets) if rets else 0.0
        winrate = wins / max(1, trades)
        # model card
        card = {
            "final_pnl": final_pnl, "fees": fees, "funding_pnl": funding_pnl,
            "sharpe": sharpe, "psr": psr, "trades": trades, "winrate": winrate,
            "ts": time.time()
        }
        with open(os.path.join(self.artifacts, "model_card.json"), "w") as f:
            json.dump(card, f, indent=2)
        return Metrics(final_pnl, fees, funding_pnl, sharpe, psr, trades, winrate)
