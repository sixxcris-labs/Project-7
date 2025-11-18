from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import random, time
app=FastAPI(title='Quant Service')
class AnalysisReq(BaseModel): symbol:str; timeframe:str; capital:float
@app.post('/analysis')
def analysis(req:AnalysisReq):
    random.seed(req.symbol+req.timeframe)
    sig=[{'name':'Momentum','value':round(random.uniform(-0.5,0.8),2),'weight':0.5}]
    return {'summary': f'Composite score for {req.symbol}', 'signals': sig}
class PlanReq(BaseModel): analysisId:str; symbol:str; timeframe:str; capital:float
@app.post('/trade-plan/generate')
def plan(req:PlanReq):
    return {'id': f'plan_{int(time.time())}', 'analysisId': req.analysisId, 'symbol': req.symbol, 'timeframe': req.timeframe, 'capital': req.capital, 'entries':[{'side':'BUY','qtyPct':0.02,'rationale':'quant'}], 'exitRules':{'stopLossPct':0.025,'takeProfitPct':0.05}, 'meta': {'lastPrice': 50000}}
