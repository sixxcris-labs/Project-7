import json, os
p = os.path.join("artifacts","model_card.json")
if os.path.exists(p):
    print(open(p).read())
else:
    print("No model_card.json found. Run backtest first.")
