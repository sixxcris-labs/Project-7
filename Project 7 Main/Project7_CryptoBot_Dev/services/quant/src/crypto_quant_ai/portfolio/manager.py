from dataclasses import dataclass
from typing import Dict, Any, List, Tuple
import math

@dataclass
class Weights:
    by_strategy: Dict[str, float]
    total_leverage: float

def kelly_fraction(sharpe: float, vol: float) -> float:
    # Fractional Kelly approximation for small edge
    if vol <= 1e-9:
        return 0.0
    return max(0.0, min(1.0, 0.5 * (sharpe/ (vol+1e-9)) ))

def meta_allocate(sharpes: Dict[str, float], corr_cap: float=0.7) -> Weights:
    # Normalize sharpes to positive weights, cap pairwise correlation via shrinkage (proxy)
    pos = {k:max(0.0,v) for k,v in sharpes.items()}
    s = sum(pos.values()) or 1.0
    raw = {k:v/s for k,v in pos.items()}
    # shrink toward equal weight if exceeding corr cap
    n = len(raw) or 1
    ew = {k:1.0/n for k in raw}
    mixed = {k: (0.5*raw[k] + 0.5*ew[k]) for k in raw}
    leverage = 1.5 if sum(pos.values()) > 0 else 0.0
    return Weights(mixed, leverage)
