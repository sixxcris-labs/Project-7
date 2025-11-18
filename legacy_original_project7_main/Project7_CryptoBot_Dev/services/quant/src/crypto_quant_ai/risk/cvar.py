
import numpy as np

def cvar_threshold(returns: np.ndarray, alpha: float = 0.95) -> float:
    q = np.quantile(returns, 1 - alpha)
    tail = returns[returns <= q]
    if tail.size == 0:
        return float(q)
    return float(tail.mean())

def size_from_cvar(target_cvar_bps: float, pnl_per_unit_bps: float) -> float:
    if pnl_per_unit_bps <= 0:
        return 0.0
    return float(max(target_cvar_bps / pnl_per_unit_bps, 0.0))
