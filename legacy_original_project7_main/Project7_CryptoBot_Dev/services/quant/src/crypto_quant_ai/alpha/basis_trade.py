from typing import Dict, Any, Optional
from .base import Strategy

class BasisCarry(Strategy):
    name = "basis_carry"

    def __init__(self, fwd_basis_bps:int=20, cap_bps:int=120):
        self.fwd_basis_bps = fwd_basis_bps
        self.cap_bps = cap_bps

    def step(self, tick: Dict[str, Any], pos: float) -> Optional[Dict[str, Any]]:
        # Use funding_rate as proxy for basis drift
        basis_bps = tick.get("funding_rate", 0.0) * 1e4 * 1440  # dailyized proxy
        if basis_bps > self.fwd_basis_bps:
            return {"action":"sell", "weight": 0.5}
        elif basis_bps < -self.fwd_basis_bps:
            return {"action":"buy", "weight": 0.5}
        return None
