# monte_carlo.py
from __future__ import annotations

import math
import random
from typing import List


class GBMSimulator:
    """
    Simple geometric Brownian motion simulator.

    dS_t = mu S_t dt + sigma S_t dW_t
    """

    def __init__(
        self,
        S0: float,
        mu: float,
        sigma: float,
        dt: float = 1.0 / 252.0,
        seed: int | None = None,
    ) -> None:
        if sigma < 0.0:
            raise ValueError("sigma must be >= 0")
        if dt <= 0.0:
            raise ValueError("dt must be > 0")
        self.S0 = float(S0)
        self.mu = float(mu)
        self.sigma = float(sigma)
        self.dt = float(dt)
        self.rng = random.Random(seed)

    def _step(self, S: float) -> float:
        z = self.rng.normalvariate(0.0, 1.0)
        drift = (self.mu - 0.5 * self.sigma * self.sigma) * self.dt
        diff = self.sigma * math.sqrt(self.dt) * z
        return S * math.exp(drift + diff)

    def path(self, steps: int) -> List[float]:
        """One GBM path with given number of steps (including S0)."""
        if steps <= 0:
            raise ValueError("steps must be > 0")
        S = self.S0
        out = [S]
        for _ in range(steps - 1):
            S = self._step(S)
            out.append(S)
        return out

    def terminal(self, horizon_steps: int, paths: int) -> List[float]:
        """Terminal values after horizon_steps for multiple paths."""
        if horizon_steps <= 0 or paths <= 0:
            raise ValueError("horizon_steps and paths must be > 0")
        out: List[float] = []
        for _ in range(paths):
            S = self.S0
            for _ in range(horizon_steps):
                S = self._step(S)
            out.append(S)
        return out
