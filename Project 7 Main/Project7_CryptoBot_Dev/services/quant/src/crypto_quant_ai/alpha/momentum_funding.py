from typing import Dict, Any, Optional
from .base import Strategy

class MomentumFunding(Strategy):
    name = "momentum_funding"

    def __init__(self, lookback:int=30, thresh:float=0.5, funding_bias:float=5e-6):
        self.lookback = lookback
        self.thresh = thresh
        self.funding_bias = funding_bias
        self.window = []

    def step(self, tick: Dict[str, Any], pos: float) -> Optional[Dict[str, Any]]:
        self.window.append(tick["mid"])
        if len(self.window) > self.lookback:
            self.window.pop(0)
        if len(self.window) < self.lookback:
            return None
        ret = (self.window[-1] - self.window[0]) / max(self.window[0], 1e-9)
        adj = ret - self.funding_bias * self.lookback
        if adj > self.thresh/1e3:
            return {"action":"buy", "weight": 1.0}
        elif adj < -self.thresh/1e3:
            return {"action":"sell", "weight": 1.0}
        return None
