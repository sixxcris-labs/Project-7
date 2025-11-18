
from dataclasses import dataclass
import numpy as np

@dataclass
class TCAResult:
    arrival_slippage_bps: float
    vwap_slippage_bps: float
    twap_slippage_bps: float
    fees_bps: float
    market_impact_bps: float
    implementation_shortfall_bps: float

def square_root_impact(q: float, daily_vol: float, daily_vol_usd: float, y: float = 0.5) -> float:
    if daily_vol_usd <= 0 or q <= 0:
        return 0.0
    psi = q / daily_vol_usd
    impact_frac = y * daily_vol * np.sqrt(max(psi, 0.0))
    return float(impact_frac * 1e4)

def tca(arrival: float, fills_prices, fills_qty, ref_vwap: float, ref_twap: float,
        fee_bps: float, q_usd: float, daily_vol: float, daily_vol_usd: float, y: float = 0.5) -> TCAResult:
    px = np.array(fills_prices, dtype=float)
    qty = np.array(fills_qty, dtype=float)
    vwap = (px*qty).sum() / max(qty.sum(), 1e-12)
    twap = px.mean()
    arrival_slip = (vwap/arrival - 1.0) * 1e4
    vwap_slip = (vwap/ref_vwap - 1.0) * 1e4 if ref_vwap > 0 else 0.0
    twap_slip = (vwap/ref_twap - 1.0) * 1e4 if ref_twap > 0 else 0.0
    mi_bps = square_root_impact(q_usd, daily_vol, daily_vol_usd, y)
    is_bps = float(arrival_slip + fee_bps + mi_bps)
    return TCAResult(float(arrival_slip), float(vwap_slip), float(twap_slip),
                     float(fee_bps), float(mi_bps), is_bps)
