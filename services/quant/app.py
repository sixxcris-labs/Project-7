from fastapi import FastAPI
from pydantic import BaseModel
from strategy_engine import build_analysis, build_plan
import random

app = FastAPI(title='Quant Service')


class AnalysisReq(BaseModel):
    symbol: str
    timeframe: str
    capital: float


@app.post('/analysis')
def analysis(req: AnalysisReq):
    random.seed(req.symbol + req.timeframe)
    result = build_analysis(req.symbol, req.timeframe, req.capital)
    result['id'] = f'analysis_{int(random.random() * 1e6)}'
    return result


class PlanReq(BaseModel):
    analysisId: str
    symbol: str
    timeframe: str
    capital: float


@app.post('/trade-plan/generate')
def plan(req: PlanReq):
    result = build_plan({'id': req.analysisId, 'meta': {}}, req.symbol, req.timeframe, req.capital)
    return result
