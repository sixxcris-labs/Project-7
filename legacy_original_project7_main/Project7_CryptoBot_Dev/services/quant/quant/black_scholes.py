# black_scholes.py
from __future__ import annotations

import math
from typing import Dict


def _norm_cdf(x: float) -> float:
    """Standard normal CDF using math.erf."""
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))


def _norm_pdf(x: float) -> float:
    """Standard normal PDF."""
    return math.exp(-0.5 * x * x) / math.sqrt(2.0 * math.pi)


def bs_price(
    cp: str,
    S: float,
    K: float,
    T: float,
    r: float,
    sigma: float,
    q: float = 0.0,
) -> float:
    """
    Black–Scholes price for a European call/put.

    cp: "c"/"call" or "p"/"put"
    S: spot
    K: strike
    T: time to expiry in years
    r: risk-free rate (cont)
    sigma: volatility (annual)
    q: dividend / funding yield (cont)
    """
    cp = cp.lower()
    if cp not in {"c", "call", "p", "put"}:
        raise ValueError("cp must be 'c'/'call' or 'p'/'put'")

    S = float(S)
    K = float(K)
    T = max(0.0, float(T))
    r = float(r)
    sigma = float(sigma)
    q = float(q)

    if T == 0.0 or sigma <= 0.0:
        # At expiry or zero vol: intrinsic value on forward, discounted
        forward = S * math.exp(-q * T)
        strike_disc = K * math.exp(-r * T)
        intrinsic = max(0.0, forward - strike_disc)
        return intrinsic if cp[0] == "c" else max(0.0, strike_disc - forward)

    sqrtT = math.sqrt(T)
    d1 = (math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqrtT)
    d2 = d1 - sigma * sqrtT

    Nd1 = _norm_cdf(d1)
    Nd2 = _norm_cdf(d2)
    ediv = math.exp(-q * T)
    er = math.exp(-r * T)

    if cp[0] == "c":
        return S * ediv * Nd1 - K * er * Nd2
    else:
        return K * er * _norm_cdf(-d2) - S * ediv * _norm_cdf(-d1)


def bs_greeks(
    cp: str,
    S: float,
    K: float,
    T: float,
    r: float,
    sigma: float,
    q: float = 0.0,
) -> Dict[str, float]:
    """
    Price + Greeks for European Black–Scholes.
    Returns dict with: price, delta, gamma, vega, theta, rho.
    All rates assumed continuous.
    """
    cp = cp.lower()
    if cp not in {"c", "call", "p", "put"}:
        raise ValueError("cp must be 'c'/'call' or 'p'/'put'")

    S = float(S)
    K = float(K)
    T = max(0.0, float(T))
    r = float(r)
    sigma = float(sigma)
    q = float(q)

    if T == 0.0 or sigma <= 0.0:
        price = bs_price(cp, S, K, T, r, sigma, q)
        # Greeks become distributions at expiry; we give simple approximations
        return {
            "price": price,
            "delta": 1.0
            if (cp[0] == "c" and S * math.exp(-q * T) > K * math.exp(-r * T))
            else 0.0,
            "gamma": 0.0,
            "vega": 0.0,
            "theta": 0.0,
            "rho": 0.0,
        }

    sqrtT = math.sqrt(T)
    d1 = (math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqrtT)
    d2 = d1 - sigma * sqrtT

    Nd1 = _norm_cdf(d1)
    Nd2 = _norm_cdf(d2)
    nd1 = _norm_pdf(d1)
    ediv = math.exp(-q * T)
    er = math.exp(-r * T)

    price = bs_price(cp, S, K, T, r, sigma, q)

    if cp[0] == "c":
        delta = ediv * Nd1
        theta = (
            -S * ediv * nd1 * sigma / (2.0 * sqrtT)
            - r * K * er * Nd2
            + q * S * ediv * Nd1
        )
        rho = K * T * er * Nd2
    else:
        delta = -ediv * _norm_cdf(-d1)
        theta = (
            -S * ediv * nd1 * sigma / (2.0 * sqrtT)
            + r * K * er * _norm_cdf(-d2)
            - q * S * ediv * _norm_cdf(-d1)
        )
        rho = -K * T * er * _norm_cdf(-d2)

    gamma = ediv * nd1 / (S * sigma * sqrtT)
    vega = S * ediv * nd1 * sqrtT

    return {
        "price": price,
        "delta": delta,
        "gamma": gamma,
        "vega": vega,
        "theta": theta,
        "rho": rho,
    }
