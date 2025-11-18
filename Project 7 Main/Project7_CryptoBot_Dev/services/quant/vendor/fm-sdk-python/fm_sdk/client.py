import os
import uuid
from typing import Any, Dict, Optional
import requests
from .exceptions import FMError, FMTimeout, FMServerError


class FMClient:
    def __init__(
        self,
        base_url: Optional[str] = None,
        timeout: float = 1.0,
    ) -> None:
        self.base_url = base_url or os.getenv("FM_BASE_URL", "http://localhost:8080/v1")
        self.timeout = timeout

    def _post(self, path: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}{path}"
        if "req_id" not in payload:
            payload["req_id"] = str(uuid.uuid4())

        try:
            resp = requests.post(url, json=payload, timeout=self.timeout)
        except requests.Timeout as exc:
            raise FMTimeout(f"Timeout calling {url}") from exc
        except Exception as exc:
            raise FMError(f"Error calling {url}: {exc}") from exc

        if resp.status_code >= 500:
            raise FMServerError(f"Server error {resp.status_code}: {resp.text}")
        if resp.status_code >= 400:
            raise FMError(f"Client error {resp.status_code}: {resp.text}")

        return resp.json()

    def robust_mean_cov(self, symbol: str, features, timestamps=None, method="mrcd", options=None):
        payload: Dict[str, Any] = {
            "symbol": symbol,
            "features": features,
            "timestamps": timestamps or [],
            "method": method,
            "options": options or {}
        }
        return self._post("/robust/mean-cov", payload)

    def toxicity_score(self, symbol: str, microstructure: Dict[str, Any], window: Dict[str, Any]):
        payload = {
            "symbol": symbol,
            "microstructure": microstructure,
            "window": window
        }
        return self._post("/toxicity/score", payload)

    def regime_classify(self, symbol: str, feature_summary: Dict[str, Any], horizon_sec: int):
        payload = {
            "symbol": symbol,
            "feature_summary": feature_summary,
            "horizon_sec": horizon_sec
        }
        return self._post("/regime/classify", payload)

    def gate_decision(self, symbol: str, context: Dict[str, Any], features: Dict[str, Any], risk_appetite: str = "normal"):
        payload = {
            "symbol": symbol,
            "context": context,
            "features": features,
            "risk_appetite": risk_appetite
        }
        return self._post("/gate/decision", payload)

    def drift_detect(self, symbol: str, ref_distribution: Dict[str, Any], current_distribution: Dict[str, Any], tests=None):
        payload = {
            "symbol": symbol,
            "ref_distribution": ref_distribution,
            "current_distribution": current_distribution,
            "tests": tests or []
        }
        return self._post("/drift/detect", payload)
