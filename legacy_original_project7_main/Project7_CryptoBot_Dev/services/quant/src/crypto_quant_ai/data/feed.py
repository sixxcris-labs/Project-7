import csv, random, time
from typing import Dict, Iterator, Optional, List

class SyntheticTicks:
    def __init__(self, steps=1000, start_price=30000.0, seed=42):
        random.seed(seed)
        self.steps = steps
        self.p = start_price

    def __iter__(self) -> Iterator[Dict]:
        for i in range(self.steps):
            drift = 0.0001
            shock = random.gauss(0, 1) * 20
            self.p = max(10.0, self.p * (1 + drift) + shock)
            spread = max(0.5, abs(random.gauss(1.0, 0.3)))
            yield {
                "ts": time.time() + i,
                "mid": self.p,
                "bid": self.p - spread/2,
                "ask": self.p + spread/2,
                "spread": spread,
                "bp_per_min": abs(shock) / max(self.p, 1) * 1e4,
                "funding_rate": random.gauss(0, 0.00001)
            }

class CSVTicks:
    def __init__(self, path: str):
        self.path = path

    def __iter__(self) -> Iterator[Dict]:
        with open(self.path, 'r') as f:
            r = csv.DictReader(f)
            for row in r:
                yield {
                    "ts": float(row["timestamp"]),
                    "mid": float(row["mid"]),
                    "bid": float(row["bid"]),
                    "ask": float(row["ask"]),
                    "spread": float(row["spread"]),
                    "bp_per_min": float(row.get("bp_per_min", 10.0)),
                    "funding_rate": float(row.get("funding_rate", 0.0))
                }

def predicted_slippage_bps(spread: float, bp_per_min: float) -> float:
    return min(50.0, 0.5 * (spread) + 0.2 * (bp_per_min))
