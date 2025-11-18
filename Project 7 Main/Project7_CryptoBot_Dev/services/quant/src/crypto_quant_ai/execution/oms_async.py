from dataclasses import dataclass, asdict, replace
from typing import Optional, Dict, Any, List, Tuple
import time, math, random, json

from ..risk.guards import run_guard_chain, GuardResult
from ..fm.client import gate_decision

@dataclass
class Order:
    symbol: str
    side: str               # 'buy' or 'sell'
    qty: float
    price: Optional[float] = None
    reduce_only: bool = False
    post_only: bool = False
    tif: str = "GTC"        # GTC|IOC|FOK
    meta: dict = None

@dataclass
class Fill:
    order_id: str
    ts: float
    price: float
    qty: float
    fee: float
    liquidity: str          # 'M' or 'T'

class SimExchange:
    def __init__(self, taker_fee_bps=2.0, maker_fee_bps=1.0, name="sim"):
        self.taker_fee_bps = taker_fee_bps
        self.maker_fee_bps = maker_fee_bps
        self.name = name
        self._oid = 0

    def _next_id(self) -> str:
        self._oid += 1
        return f"{self.name}-{self._oid}"

    def execute(self, order: Order, ctx: Dict[str, Any]) -> Tuple[str, Optional[Fill]]:
        oid = self._next_id()
        mid = ctx.get('mid', order.price or 0)
        spread = ctx.get('spread', 0.0)
        bpmin = ctx.get('bp_per_min', 10.0)

        if order.price is None:
            # marketable
            price = mid + (spread/2 if order.side == 'buy' else -spread/2)
            fee = (self.taker_fee_bps/1e4) * price * order.qty
            return oid, Fill(oid, time.time(), price, order.qty, fee, 'T')

        # limit: assume partial cross probability driven by microstructure proxy
        cross_prob = min(0.95, 0.1 + 0.6 * (bpmin/100.0))
        maker = random.random() > cross_prob or order.post_only
        if maker:
            price = order.price
            fee = (self.maker_fee_bps/1e4) * price * order.qty
            return oid, Fill(oid, time.time(), price, order.qty, fee, 'M')
        else:
            # slip toward opposite touch
            slip_bps = max(0.0, (bpmin * 0.15))
            slip = (slip_bps/1e4) * (order.price)
            price = order.price + (slip if order.side=='buy' else -slip)
            fee = (self.taker_fee_bps/1e4) * price * order.qty
            return oid, Fill(oid, time.time(), price, order.qty, fee, 'T')

class SmartRouter:
    def __init__(self, venues: List[SimExchange]):
        self.venues = venues

    def rank(self, ctx: Dict[str, Any]) -> List[SimExchange]:
        # Rank by venue_score, then maker preference if toggle
        scored = []
        for v in self.venues:
            score = ctx.get('venue_score', 0.7)
            if v.name in ctx.get('venue_overrides', {}):
                score = ctx['venue_overrides'][v.name]
            scored.append((score, v))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [v for _, v in scored]

    def route(self, order: Order, ctx: Dict[str, Any]) -> Tuple[str, Optional[Fill], str]:
        # Failover: attempt ranked venues
        for venue in self.rank(ctx):
            try:
                oid, fill = venue.execute(order, ctx)
                return oid, fill, venue.name
            except Exception as e:
                continue
        return "NACK", None, "none"

class OMS:
    def __init__(self, router: SmartRouter, policy, tca_ledger=None):
        self.router = router
        self.policy = policy
        self.tca = tca_ledger

    def submit(self, order: Order, ctx: Dict[str, Any]) -> Dict[str, Any]:
        # Guard chain
        g = run_guard_chain(ctx, self.policy)
        if not g.ok:
            return {"status":"REJECT", "reason": g.reason, "order": asdict(order)}

        fm_context = ctx.get('fm_context', ctx)
        fm_features = ctx.get('fm_features', ctx.get('features', {}))
        decision = gate_decision(order.symbol, fm_context, fm_features)
        if not decision.get("allowed", True):
            return {
                "status": "REJECT",
                "reason": "fm_gate_blocked",
                "order": asdict(order),
                "decision": decision,
            }
        size_multiplier = float(decision.get("size_multiplier", 1.0))
        if size_multiplier != 1.0:
            order = replace(order, qty=order.qty * size_multiplier)
        oid, fill, venue = self.router.route(order, ctx)
        resp = {"status": "ACK" if fill else "NACK", "venue": venue, "order_id": oid, "fill": None}
        if fill:
            resp["fill"] = fill.__dict__
            if self.tca:
                self.tca.log_fill(order, fill, venue, ctx)
        return resp

# Child order algos
def twap(parent: Order, slices: int) -> List[Order]:
    q = parent.qty / max(1, slices)
    return [Order(parent.symbol, parent.side, q, parent.price, parent.reduce_only, parent.post_only, parent.tif, {"parent":"twap"}) for _ in range(slices)]

def vwap(parent: Order, bars: List[Dict[str, Any]]) -> List[Order]:
    total_vol = sum(b.get('vol', 1) for b in bars) or 1
    out = []
    for b in bars:
        w = b.get('vol', 1)/total_vol
        out.append(Order(parent.symbol, parent.side, parent.qty*w, parent.price, parent.reduce_only, parent.post_only, parent.tif, {"parent":"vwap"}))
    return out

def iceberg(parent: Order, clip: float) -> List[Order]:
    n = int(math.ceil(parent.qty/max(clip, 1e-9)))
    return [Order(parent.symbol, parent.side, min(clip, parent.qty - i*clip), parent.price, parent.reduce_only, True, parent.tif, {"parent":"iceberg"}) for i in range(n)]
