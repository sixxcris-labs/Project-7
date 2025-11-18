from typing import Any, Dict
import os
from fm_sdk import FMClient

_fm_client = FMClient(
    base_url=os.getenv("FM_BASE_URL", "http://fm:8080/v1"),
    timeout=float(os.getenv("FM_TIMEOUT", "1.0")),
)

def gate_decision(symbol: str, context: Dict[str, Any], features: Dict[str, Any], risk_appetite: str = "normal"):
    return _fm_client.gate_decision(symbol, context, features, risk_appetite)

def toxicity_score(symbol: str, microstructure: Dict[str, Any], window: Dict[str, Any]):
    return _fm_client.toxicity_score(symbol, microstructure, window)

def regime_classify(symbol: str, feature_summary: Dict[str, Any], horizon_sec: int):
    return _fm_client.regime_classify(symbol, feature_summary, horizon_sec)
