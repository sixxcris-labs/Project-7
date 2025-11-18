
from dataclasses import dataclass
from typing import List

@dataclass
class VenueQuote:
    venue: str
    bid: float
    bid_size: float
    ask: float
    ask_size: float
    taker_fee_bps: float = 0.0

@dataclass
class ChildOrder:
    venue: str
    side: str
    qty: float
    limit_price: float

def _eff_ask(q: VenueQuote) -> float:
    return q.ask * (1.0 + q.taker_fee_bps/1e4)

def route_buy(qty: float, quotes: List[VenueQuote], max_slices: int = 5) -> List[ChildOrder]:
    books = sorted([q for q in quotes if q.ask > 0 and q.ask_size > 0], key=_eff_ask)
    remaining = float(qty)
    children: List[ChildOrder] = []
    for q in books:
        if remaining <= 0:
            break
        take_qty = min(remaining, q.ask_size)
        if take_qty > 0:
            children.append(ChildOrder(venue=q.venue, side="buy", qty=float(take_qty), limit_price=float(q.ask)))
            remaining -= take_qty
    if remaining > 0 and books:
        best = books[0]
        slice_qty = remaining / max(1, max_slices)
        for _ in range(max_slices):
            children.append(ChildOrder(venue=best.venue, side="buy", qty=float(slice_qty), limit_price=float(best.ask)))
        remaining = 0.0
    return children
