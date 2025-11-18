from __future__ import annotations

import math
import random
import sys
from pathlib import Path

LEGACY_PATH = Path(__file__).resolve().parents[2] / 'legacy_original_project7_main' / 'Project7_CryptoBot_Dev' / 'services' / 'quant'
if str(LEGACY_PATH) not in sys.path:
    sys.path.insert(0, str(LEGACY_PATH))

from quant import kelly_fraction, monte_carlo_var  # type: ignore


def build_analysis(symbol: str, timeframe: str, capital: float) -> dict:
    win_prob = 0.52 + random.random() * 0.08
    odds = 1.2 + random.random() * 0.5
    kelly = kelly_fraction(win_prob, odds)
    var = monte_carlo_var(0.02, 0.06, 0.95, 1.0, 4000)
    signals = [
        {'name': 'Momentum', 'value': round(random.uniform(-0.3, 0.7), 2), 'weight': 0.4},
        {'name': 'Signal Strength', 'value': round(kelly, 2), 'weight': 0.3},
        {'name': 'VaR Confidence', 'value': round(var, 2), 'weight': 0.2},
    ]
    return {
        'summary': f'{symbol} composite score with Kelly = {kelly:.2f} and VaR {var:.2f}',
        'signals': signals,
        'meta': {
            'kelly': round(kelly, 4),
            'var95': round(var, 2),
            'timeframe': timeframe,
            'capital': capital,
        },
    }


def build_plan(analysis: dict, symbol: str, timeframe: str, capital: float) -> dict:
    qty_pct = min(0.05, math.sqrt(analysis['meta']['kelly']) * 0.04)
    stop_loss = 0.02
    take_profit = 0.04
    rationale = f"Kelly sizing {analysis['meta']['kelly']:.2f} with VaR {analysis['meta']['var95']:.2f}"
    return {
        'id': f'plan_{int(random.random()*1e6)}',
        'analysisId': analysis.get('id', 'analysis_1'),
        'symbol': symbol,
        'timeframe': timeframe,
        'capital': capital,
        'entries': [{'side': 'BUY', 'qtyPct': round(qty_pct, 4), 'rationale': rationale}],
        'exitRules': {'stopLossPct': stop_loss, 'takeProfitPct': take_profit},
        'meta': {'source': 'legacy-strategy', 'kelly': analysis['meta']['kelly']},
    }
