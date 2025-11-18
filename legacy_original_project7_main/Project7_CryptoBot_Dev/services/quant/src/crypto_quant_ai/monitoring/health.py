from typing import Dict, Any

def health_score(sample: Dict[str, Any]) -> float:
    # 1.0 is perfect, <0.5 needs attention
    score = 1.0
    if sample.get("stale_msgs", 0) > 10: score -= 0.2
    if sample.get("slippage_bps", 0) > 20: score -= 0.3
    if sample.get("venue_failures", 0) > 1: score -= 0.3
    return max(0.0, min(1.0, score))
