# __init__.py
"""
Quant toolkit for a crypto trading app.

Provides:
- Black–Scholes pricing and Greeks
- Kelly position sizing
- VaR / ES estimators (historical, parametric, Cornish–Fisher, Monte Carlo)
- Simple GBM Monte Carlo path simulator
- Tiny linear-programming solver (simplex)
"""
from __future__ import annotations

from .black_scholes import bs_price, bs_greeks
from .kelly import kelly_fraction, kelly_optimal_fraction
from .var import (
    historical_var,
    cvar_historical,
    parametric_var,
    cvar_parametric,
    cornish_fisher_var,
    monte_carlo_var,
    var_es,
)
from .monte_carlo import GBMSimulator
from .lp import solve_lp
from .precision import hp_decimal, set_precision

__all__ = [
    "bs_price",
    "bs_greeks",
    "kelly_fraction",
    "kelly_optimal_fraction",
    "historical_var",
    "cvar_historical",
    "parametric_var",
    "cvar_parametric",
    "cornish_fisher_var",
    "monte_carlo_var",
    "var_es",
    "GBMSimulator",
    "solve_lp",
    "hp_decimal",
    "set_precision",
]
