from dataclasses import dataclass
from typing import Dict, Any

@dataclass
class GuardResult:
    ok: bool
    reason: str = "OK"

def _bps(x: float) -> float:
    return x * 1e4

def guard_freshness(ctx: Dict[str, Any], policy) -> GuardResult:
    # ctx['md_age_ms']
    if ctx.get('md_age_ms', 999999) <= policy.freshness_ms:
        return GuardResult(True, "fresh")
    return GuardResult(False, f"StaleQuotes(age_ms={ctx.get('md_age_ms')})")

def guard_spread(ctx: Dict[str, Any], policy) -> GuardResult:
    # ctx['spread'] as absolute price difference
    mid = ctx.get('mid')
    spread = ctx.get('spread')
    if mid is None or spread is None or mid <= 0:
        return GuardResult(False, "BadMidOrSpread")
    if _bps(spread / mid) <= policy.max_spread_bps:
        return GuardResult(True, "spread_ok")
    return GuardResult(False, f"SpreadTooWide(bps={_bps(spread/mid):.1f})")

def guard_volatility(ctx: Dict[str, Any], policy) -> GuardResult:
    # ctx['bp_per_min']
    if ctx.get('bp_per_min', 999999) <= policy.volatility_cap_bp_per_min:
        return GuardResult(True, "volatility_ok")
    return GuardResult(False, f"VolTooHigh(bp/min={ctx.get('bp_per_min')})")

def guard_liquidation_buffer(ctx: Dict[str, Any], policy) -> GuardResult:
    # ctx['liq_buffer_bps'] positive buffer to liq price
    if ctx.get('liq_buffer_bps', -1) >= policy.liquidation_buffer_bps:
        return GuardResult(True, "liq_buffer_ok")
    return GuardResult(False, f"LiqBufferTooSmall({ctx.get('liq_buffer_bps')})")

def guard_slippage(ctx: Dict[str, Any], policy) -> GuardResult:
    # ctx['pred_slippage_bps']
    if ctx.get('pred_slippage_bps', 999999) <= policy.max_slippage_bps:
        return GuardResult(True, "slippage_ok")
    return GuardResult(False, f"SlippageTooHigh({ctx.get('pred_slippage_bps')})")

def guard_venue_reliability(ctx: Dict[str, Any], policy) -> GuardResult:
    # ctx['venue_score'] in [0,1]
    if ctx.get('venue_score', 0.0) >= policy.venue_min_score:
        return GuardResult(True, "venue_ok")
    return GuardResult(False, f"VenueUnreliable(score={ctx.get('venue_score')})")

def guard_position_limit(ctx: Dict[str, Any], policy) -> GuardResult:
    # ctx['position_usd']
    if ctx.get('position_usd', 0.0) <= policy.position_limit_usd:
        return GuardResult(True, "pos_limit_ok")
    return GuardResult(False, f"PositionLimit({ctx.get('position_usd')}>{policy.position_limit_usd})")

GUARD_ORDER = [
    guard_freshness,
    guard_spread,
    guard_volatility,
    guard_liquidation_buffer,
    guard_slippage,
    guard_venue_reliability,
    guard_position_limit
]

def run_guard_chain(ctx: Dict[str, Any], policy) -> GuardResult:
    for g in GUARD_ORDER:
        res = g(ctx, policy)
        if not res.ok:
            return res
    return GuardResult(True, "ALL_OK")
