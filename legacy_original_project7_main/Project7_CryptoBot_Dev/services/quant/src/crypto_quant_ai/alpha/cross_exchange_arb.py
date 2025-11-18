from typing import Dict, Any, Optional
from .base import Strategy

class CrossExchangeArb(Strategy):
    name = "xex_arb"

    def __init__(self, other_price_key:str="mid_other", trigger_bps:float=6.0):
        self.key = other_price_key
        self.thresh = trigger_bps

    def step(self, tick: Dict[str, Any], pos: float) -> Optional[Dict[str, Any]]:
        if self.key not in tick:
            return None
        delta = (tick[self.key] - tick["mid"]) / max(tick["mid"], 1e-9) * 1e4
        if abs(delta) >= self.thresh:
            return {"action": "buy" if delta>0 else "sell", "weight": 0.7}
        return None
