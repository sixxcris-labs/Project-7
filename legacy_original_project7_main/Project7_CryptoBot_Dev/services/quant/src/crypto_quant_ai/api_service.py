
import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from .execution.tca import tca, TCAResult
from .routing.sor import VenueQuote, route_buy
try:
    from prometheus_fastapi_instrumentator import Instrumentator
except Exception:
    Instrumentator = None

app = FastAPI(title="quant-service")

class Fill(BaseModel):
    price: float
    qty: float

class TCAIn(BaseModel):
    arrival: float
    fills: List[Fill]
    ref_vwap: float
    ref_twap: float
    fee_bps: float
    q_usd: float
    daily_vol: float
    daily_vol_usd: float
    y: float = 0.5

class QuoteIn(BaseModel):
    venue: str
    bid: float
    bid_size: float
    ask: float
    ask_size: float
    taker_fee_bps: float = 0.0

class RouteIn(BaseModel):
    qty: float
    quotes: List[QuoteIn]

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/tca", response_model=TCAResult)
def tca_endpoint(inp: TCAIn):
    res = tca(
        arrival=inp.arrival,
        fills_prices=[f.price for f in inp.fills],
        fills_qty=[f.qty for f in inp.fills],
        ref_vwap=inp.ref_vwap,
        ref_twap=inp.ref_twap,
        fee_bps=inp.fee_bps,
        q_usd=inp.q_usd,
        daily_vol=inp.daily_vol,
        daily_vol_usd=inp.daily_vol_usd,
        y=inp.y
    )
    return res

@app.post("/sor")
def sor_endpoint(inp: RouteIn):
    quotes = [VenueQuote(**q.dict()) for q in inp.quotes]
    children = route_buy(inp.qty, quotes)
    return {"orders": [c.__dict__ for c in children]}

if Instrumentator is not None:
    Instrumentator().instrument(app).expose(app, include_in_schema=False, should_gzip=True)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
