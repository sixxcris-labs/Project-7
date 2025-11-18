# qcli.py
#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from typing import List

from .black_scholes import bs_price, bs_greeks
from .kelly import kelly_fraction, kelly_optimal_fraction
from .var import (
    historical_var,
    cvar_historical,
    parametric_var,
    cvar_parametric,
    cornish_fisher_var,
    monte_carlo_var,
)
from .lp import solve_lp


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="quant-cli",
        description="Small quant toolkit for a crypto trading app",
    )
    sub = p.add_subparsers(dest="cmd", required=True)

    # Black–Scholes
    b = sub.add_parser("bs", help="Black–Scholes pricing")
    b.add_argument("cp", choices=["c", "p", "call", "put"])
    b.add_argument("S", type=float)
    b.add_argument("K", type=float)
    b.add_argument("T", type=float, help="Time to expiry in years")
    b.add_argument("r", type=float, help="Risk-free rate (cont, annual)")
    b.add_argument("sigma", type=float, help="Volatility (annual)")
    b.add_argument("--q", type=float, default=0.0, help="Dividend / funding yield")
    b.add_argument(
        "--greeks",
        action="store_true",
        help="Return Greeks instead of just price",
    )

    # Kelly
    k = sub.add_parser("kelly", help="Kelly position sizing")
    k.add_argument("--p", type=float, help="Win probability for binary bet")
    k.add_argument("--b", type=float, help="Odds (decimal) for binary bet")
    k.add_argument("--mu", type=float, help="Expected log-return per period")
    k.add_argument("--sigma2", type=float, help="Variance of log-returns per period")

    # Historical VaR
    hv = sub.add_parser("var_hist", help="Historical VaR/CVaR from returns")
    hv.add_argument("alpha", type=float, nargs="?", default=0.95)
    hv.add_argument(
        "returns",
        type=float,
        nargs="+",
        help="Series of returns (space separated)",
    )

    # Parametric VaR
    pv = sub.add_parser("var_param", help="Gaussian parametric VaR/CVaR")
    pv.add_argument("mu", type=float)
    pv.add_argument("sigma", type=float)
    pv.add_argument("alpha", type=float, nargs="?", default=0.95)
    pv.add_argument("--horizon", type=float, default=1.0)

    # Cornish–Fisher VaR
    cf = sub.add_parser("var_cf", help="Cornish–Fisher VaR")
    cf.add_argument("mu", type=float)
    cf.add_argument("sigma", type=float)
    cf.add_argument("skew", type=float)
    cf.add_argument("kurt", type=float)
    cf.add_argument("alpha", type=float, nargs="?", default=0.95)
    cf.add_argument("--horizon", type=float, default=1.0)

    # Monte Carlo VaR
    mv = sub.add_parser("var_mc", help="Monte Carlo VaR (Gaussian)")
    mv.add_argument("mu", type=float)
    mv.add_argument("sigma", type=float)
    mv.add_argument("alpha", type=float, nargs="?", default=0.95)
    mv.add_argument("--horizon", type=float, default=1.0)
    mv.add_argument("--paths", type=int, default=10000)

    # LP solver
    lp = sub.add_parser("lp", help="Solve tiny LP: max c^T x, s.t. A x <= b, x>=0")
    lp.add_argument("c", type=float, nargs="+", help="Objective coefficients")
    lp.add_argument("--A", type=float, nargs="+", required=True, help="Row-major A")
    lp.add_argument("--rows", type=int, required=True, help="Number of rows of A")
    lp.add_argument("--b", type=float, nargs="+", required=True, help="RHS vector")

    return p


def main(argv: List[str] | None = None) -> None:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.cmd == "bs":
        if args.greeks:
            out = bs_greeks(args.cp, args.S, args.K, args.T, args.r, args.sigma, args.q)
        else:
            out = {
                "price": bs_price(
                    args.cp, args.S, args.K, args.T, args.r, args.sigma, args.q
                )
            }
        print(json.dumps(out, indent=2))
        return

    if args.cmd == "kelly":
        if args.p is not None and args.b is not None:
            out = {"fraction": kelly_fraction(args.p, args.b)}
        elif args.mu is not None and args.sigma2 is not None:
            out = {"fraction": kelly_optimal_fraction(args.mu, args.sigma2)}
        else:
            raise SystemExit("Provide either (p,b) or (mu,sigma2) for kelly")
        print(json.dumps(out, indent=2))
        return

    if args.cmd == "var_hist":
        var = historical_var(args.returns, args.alpha)
        cvar = cvar_historical(args.returns, args.alpha)
        out = {"VaR": var, "CVaR": cvar}
        print(json.dumps(out, indent=2))
        return

    if args.cmd == "var_param":
        var = parametric_var(args.mu, args.sigma, args.alpha, args.horizon)
        cvar = cvar_parametric(args.mu, args.sigma, args.alpha, args.horizon)
        out = {"VaR": var, "CVaR": cvar}
        print(json.dumps(out, indent=2))
        return

    if args.cmd == "var_cf":
        var = cornish_fisher_var(
            args.mu, args.sigma, args.skew, args.kurt, args.alpha, args.horizon
        )
        out = {"VaR": var}
        print(json.dumps(out, indent=2))
        return

    if args.cmd == "var_mc":
        var = monte_carlo_var(args.mu, args.sigma, args.alpha, args.horizon, args.paths)
        out = {"VaR": var}
        print(json.dumps(out, indent=2))
        return

    if args.cmd == "lp":
        c = args.c
        A_flat = args.A
        rows = args.rows
        if len(A_flat) % rows != 0:
            raise SystemExit("length of A must be divisible by rows")
        cols = len(A_flat) // rows
        A = [A_flat[i * cols : (i + 1) * cols] for i in range(rows)]
        result = solve_lp(c, A, args.b)
        print(json.dumps(result, indent=2))
        return


if __name__ == "__main__":
    main()
