# kelly.py
from __future__ import annotations


def kelly_fraction(p: float, b: float) -> float:
    """
    Binary Kelly fraction given win probability p and odds b (decimal).

    p: probability of win in (0,1)
    b: net odds (e.g. 1.0 == even money; profit 1 per 1 staked)
    Returns optimal fraction of bankroll to wager (clipped to [0,1]).
    """
    if b <= 0:
        raise ValueError("b must be > 0")
    if not (0.0 < p < 1.0):
        raise ValueError("p must be in (0,1)")
    f_star = (p * (b + 1.0) - 1.0) / b
    return max(0.0, min(1.0, f_star))


def kelly_optimal_fraction(mu: float, sigma2: float, horizon: float = 1.0) -> float:
    """
    Continuous Kelly fraction for lognormal asset: f* = mu / sigma^2.

    mu: expected log-return per unit time
    sigma2: variance of log-returns per unit time
    horizon: included for clarity; we assume mu,sigma2 already scaled.
    """
    if sigma2 <= 0.0:
        raise ValueError("sigma2 must be > 0")
    return mu / sigma2
