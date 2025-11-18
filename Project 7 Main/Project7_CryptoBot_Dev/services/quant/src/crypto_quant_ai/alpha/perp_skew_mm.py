from typing import Dict, Any, Optional
from .base import Strategy

class PerpSkewMM(Strategy):
    name = "perp_skew_mm"

    def __init__(self, skew_bps:int=5):
        self.skew_bps = skew_bps

    def step(self, tick: Dict[str, Any], pos: float) -> Optional[Dict[str, Any]]:
        # If spread is wide, post maker orders with small size
        spread_bps = (tick["spread"]/tick["mid"]) * 1e4
        if spread_bps >= self.skew_bps:
            # skew toward taking the edge if we are unbalanced
            side = "sell" if pos > 0 else "buy"
            return {"action": side, "weight": 0.25, "post_only": True}
        return None
