# var.py
from __future__ import annotations

import math
from typing import Iterable, List, Tuple


def _to_array(xs: Iterable[float]) -> List[float]:
    return [float(x) for x in xs]


def historical_var(returns: Iterable[float], alpha: float = 0.95) -> float:
    """
    Historical VaR (right tail, losses positive) for returns series.
    We assume returns are arithmetic (e.g., daily PnL / equity).
    """
    if not (0.0 < alpha < 1.0):
        raise ValueError("alpha must be in (0,1)")
    arr = sorted(_to_array(returns))
    if not arr:
        raise ValueError("returns must be non-empty")

    # For losses: VaR at alpha is -quantile of returns at (1-alpha)
    q_idx = int((1.0 - alpha) * (len(arr) - 1))
    q = arr[q_idx]
    return -q


def cvar_historical(returns: Iterable[float], alpha: float = 0.95) -> float:
    """Conditional VaR = average of tail beyond VaR."""
    if not (0.0 < alpha < 1.0):
        raise ValueError("alpha must be in (0,1)")
    arr = sorted(_to_array(returns))
    if not arr:
        raise ValueError("returns must be non-empty")
    q_idx = int((1.0 - alpha) * (len(arr) - 1))
    tail = arr[: q_idx + 1]
    return -sum(tail) / len(tail)


def parametric_var(
    mu: float,
    sigma: float,
    alpha: float = 0.95,
    horizon: float = 1.0,
) -> float:
    """
    Parametric (Gaussian) VaR for PnL ~ N(mu*horizon, sigma*sqrt(horizon)).
    Returns positive number for loss at level alpha.
    """
    if sigma < 0.0:
        raise ValueError("sigma must be >= 0")
    if not (0.0 < alpha < 1.0):
        raise ValueError("alpha must be in (0,1)")

    z = _norm_ppf(1.0 - alpha)
    mu_h = mu * horizon
    sig_h = sigma * math.sqrt(horizon)
    return -(mu_h + z * sig_h)


def cvar_parametric(
    mu: float,
    sigma: float,
    alpha: float = 0.95,
    horizon: float = 1.0,
) -> float:
    """Gaussian CVaR."""
    if sigma <= 0.0:
        raise ValueError("sigma must be > 0")
    if not (0.0 < alpha < 1.0):
        raise ValueError("alpha must be in (0,1)")

    z = _norm_ppf(1.0 - alpha)
    mu_h = mu * horizon
    sig_h = sigma * math.sqrt(horizon)
    pdf = math.exp(-0.5 * z * z) / math.sqrt(2.0 * math.pi)
    es = -(mu_h + sig_h * pdf / (1.0 - alpha))
    return es


def cornish_fisher_var(
    mu: float,
    sigma: float,
    skew: float,
    kurt: float,
    alpha: float = 0.95,
    horizon: float = 1.0,
) -> float:
    """
    Cornish–Fisher expansion VaR including skew & kurtosis.
    """
    if sigma < 0.0:
        raise ValueError("sigma must be >= 0")
    if not (0.0 < alpha < 1.0):
        raise ValueError("alpha must be in (0,1)")

    z = _norm_ppf(1.0 - alpha)
    z2 = z * z
    z3 = z2 * z
    # Cornish–Fisher adjusted quantile
    z_cf = (
        z
        + (skew / 6.0) * (z2 - 1.0)
        + (kurt / 24.0) * (z3 - 3.0 * z)
        - (skew * skew / 36.0) * (2.0 * z3 - 5.0 * z)
    )

    mu_h = mu * horizon
    sig_h = sigma * math.sqrt(horizon)
    return -(mu_h + z_cf * sig_h)


def monte_carlo_var(
    mu: float,
    sigma: float,
    alpha: float = 0.95,
    horizon: float = 1.0,
    paths: int = 10000,
) -> float:
    """
    Monte Carlo VaR assuming Gaussian PnL with (mu, sigma).
    """
    if sigma < 0.0:
        raise ValueError("sigma must be >= 0")
    if paths <= 0:
        raise ValueError("paths must be > 0")
    if not (0.0 < alpha < 1.0):
        raise ValueError("alpha must be in (0,1)")

    import random

    samples: List[float] = []
    sig_h = sigma * math.sqrt(horizon)
    mu_h = mu * horizon
    for _ in range(paths):
        z = random.gauss(0.0, 1.0)
        pnl = mu_h + sig_h * z
        samples.append(pnl)
    samples.sort()
    idx = int((1.0 - alpha) * (len(samples) - 1))
    return -samples[idx]


def var_es(returns: Iterable[float], alpha: float = 0.95) -> Tuple[float, float]:
    """Convenience: (VaR, CVaR) via historical method."""
    return historical_var(returns, alpha), cvar_historical(returns, alpha)


def _norm_ppf(p: float) -> float:
    """Inverse CDF for standard normal via Acklam approximation."""
    if not (0.0 < p < 1.0):
        raise ValueError("p must be in (0,1)")

    # Coefficients from Peter J. Acklam's approximation
    a1 = -3.969683028665376e01
    a2 = 2.209460984245205e02
    a3 = -2.759285104469687e02
    a4 = 1.383577518672690e02
    a5 = -3.066479806614716e01
    a6 = 2.506628277459239e00

    b1 = -5.447609879822406e01
    b2 = 1.615858368580409e02
    b3 = -1.556989798598866e02
    b4 = 6.680131188771972e01
    b5 = -1.328068155288572e01

    c1 = -7.784894002430293e-03
    c2 = -3.223964580411365e-01
    c3 = -2.400758277161838e00
    c4 = -2.549732539343734e00
    c5 = 4.374664141464968e00
    c6 = 2.938163982698783e00

    d1 = 7.784695709041462e-03
    d2 = 3.224671290700398e-01
    d3 = 2.445134137142996e00
    d4 = 3.754408661907416e00

    plow = 0.02425
    phigh = 1.0 - plow

    if p < plow:
        q = math.sqrt(-2.0 * math.log(p))
        return (
            (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6)
            / ((((d1 * q + d2) * q + d3) * q + d4) * q + 1.0)
        )
    if phigh < p:
        q = math.sqrt(-2.0 * math.log(1.0 - p))
        return -(
            (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6)
            / ((((d1 * q + d2) * q + d3) * q + d4) * q + 1.0)
        )

    q = p - 0.5
    r = q * q
    return (
        (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q
        / (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1.0)
    )
