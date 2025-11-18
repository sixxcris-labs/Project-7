from dataclasses import dataclass, asdict
import yaml, json, hashlib, pathlib

@dataclass
class RiskPolicy:
    freshness_ms: int
    max_spread_bps: int
    max_slippage_bps: int
    volatility_cap_bp_per_min: int
    liquidation_buffer_bps: int
    venue_min_score: float
    position_limit_usd: float
    leverage_limit: float
    funding_pnl_daily_limit_usd: float
    maker_taker_toggle: str
    reduce_only_enabled: bool
    post_only_enabled: bool
    circuit_breakers: dict

def load_policy(path: str) -> RiskPolicy:
    with open(path, 'r') as f:
        cfg = yaml.safe_load(f)
    return RiskPolicy(**cfg)

def policy_hash(policy: RiskPolicy) -> str:
    blob = json.dumps(asdict(policy), sort_keys=True, separators=(',',':')).encode()
    return hashlib.sha256(blob).hexdigest()

def project_root() -> str:
    return str(pathlib.Path(__file__).resolve().parents[3])
