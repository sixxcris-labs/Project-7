
import numpy as np
from math import erf, sqrt, log

def deflated_sharpe_ratio(sr: float, n_trials: int, t: int, skew: float = 0.0, kurt: float = 3.0) -> float:
    """Approximate Deflated Sharpe Ratio (Bailey & López de Prado).

    Returns a probability in [0,1] that the in-sample Sharpe is not a false discovery.
    """
    n_trials = max(int(n_trials), 1)
    t = max(int(t), 2)
    gamma3, gamma4 = float(skew), float(kurt)
    sr_std = np.sqrt((1 + 0.5*sr**2 - gamma3*sr/6 + (gamma4-3)/24) / (t-1))
    mu_gumbel = sr_std * np.sqrt(2*np.log(max(n_trials, 2)))
    beta_gumbel = sr_std / np.sqrt(2*np.log(max(n_trials, 2)))
    z = (sr - mu_gumbel) / max(beta_gumbel, 1e-12)
    p = 0.5*(1 + erf(z/sqrt(2)))
    return float(max(0.0, min(1.0, p)))
