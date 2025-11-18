import os, json, time
from typing import List

def harvest_alpha_ideas(sources: List[str], out_dir: str):
    os.makedirs(out_dir, exist_ok=True)
    idea = {
        "ts": time.time(),
        "source_count": len(sources),
        "ideas": [
            "Explore liquidation heatmap + perp skew drift features",
            "Funding-basis divergence arb with regime gating",
            "Validator churn shock as volatility predictor"
        ]
    }
    with open(os.path.join(out_dir, "alpha_ideas.json"), "w") as f:
        json.dump(idea, f, indent=2)
