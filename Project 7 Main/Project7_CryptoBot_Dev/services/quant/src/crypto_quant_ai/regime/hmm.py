
import numpy as np
try:
    from hmmlearn.hmm import GaussianHMM
except Exception:
    GaussianHMM = None

def fit_hmm(returns: np.ndarray, n_states: int = 2, seed: int = 42):
    if GaussianHMM is None:
        raise ImportError("hmmlearn not installed. pip install hmmlearn")
    X = returns.reshape(-1, 1).astype(float)
    model = GaussianHMM(n_components=n_states, covariance_type='full', random_state=seed, n_iter=200)
    model.fit(X)
    states = model.predict(X)
    return model, states
