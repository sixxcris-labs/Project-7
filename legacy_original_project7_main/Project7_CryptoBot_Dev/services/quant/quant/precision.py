# precision.py
from __future__ import annotations

from decimal import Decimal, getcontext


def set_precision(prec: int = 50) -> None:
    """
    Set global Decimal precision.
    Useful when summing PnL legs or tiny probabilities.
    """
    if prec <= 0:
        raise ValueError("prec must be > 0")
    getcontext().prec = prec


def hp_decimal(x: float | str) -> Decimal:
    """High-precision Decimal from float or string."""
    return Decimal(str(x))
