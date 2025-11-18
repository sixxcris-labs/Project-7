# lp.py
from __future__ import annotations

from typing import Dict, List, Tuple


def solve_lp(
    c: List[float],
    A: List[List[float]],
    b: List[float],
) -> Dict[str, object]:
    """
    Very small dense simplex for:

        max c^T x
        s.t. A x <= b, x >= 0

    Returns dict with:
      - "x": primal solution list
      - "objective": optimal value
      - "status": "optimal" | "infeasible" | "unbounded" | "iter_limit"
    """
    m = len(A)
    n = len(c)
    if any(len(row) != n for row in A):
        raise ValueError("All rows of A must have length len(c)")
    if len(b) != m:
        raise ValueError("b length must equal number of rows in A")

    # Build initial tableau with slack variables
    # [x vars ... | slack vars ... | RHS]
    tableau: List[List[float]] = []
    for i in range(m):
        row = list(A[i]) + [0.0] * m + [float(b[i])]
        row[n + i] = 1.0  # slack i
        tableau.append(row)

    # Objective row (we maximize, simplex uses -c)
    obj = [-ci for ci in c] + [0.0] * m + [0.0]

    basis = list(range(n, n + m))  # indices of slack vars

    def _pivot(piv_row: int, piv_col: int) -> None:
        # Normalize pivot row
        pivot = tableau[piv_row][piv_col]
        if abs(pivot) < 1e-12:
            raise ZeroDivisionError("Pivot too small")
        inv = 1.0 / pivot
        tableau[piv_row] = [v * inv for v in tableau[piv_row]]
        # Eliminate other rows
        for r in range(m):
            if r == piv_row:
                continue
            factor = tableau[r][piv_col]
            if abs(factor) < 1e-12:
                continue
            tableau[r] = [
                tableau[r][j] - factor * tableau[piv_row][j]
                for j in range(len(obj))
            ]
        # Objective
        factor = obj[piv_col]
        if abs(factor) >= 1e-12:
            for j in range(len(obj)):
                obj[j] -= factor * tableau[piv_row][j]

    max_iter = 1000
    for _ in range(max_iter):
        # Entering variable: most negative reduced cost
        entering = min(range(len(obj) - 1), key=lambda j: obj[j])
        if obj[entering] >= -1e-9:
            status = "optimal"
            break

        # Leaving variable: minimum positive ratio test
        ratios: List[Tuple[float, int]] = []
        for i in range(m):
            col = tableau[i][entering]
            if col > 1e-12:
                ratios.append((tableau[i][-1] / col, i))
        if not ratios:
            return {"status": "unbounded", "x": None, "objective": float("inf")}

        _, piv_row = min(ratios)
        basis[piv_row] = entering
        _pivot(piv_row, entering)
    else:
        status = "iter_limit"

    # Extract solution
    x = [0.0] * (len(obj) - 1)
    for i, var_idx in enumerate(basis):
        if var_idx < len(x):
            x[var_idx] = tableau[i][-1]
    objective = -obj[-1]  # undo sign

    return {"status": status, "x": x, "objective": objective}
