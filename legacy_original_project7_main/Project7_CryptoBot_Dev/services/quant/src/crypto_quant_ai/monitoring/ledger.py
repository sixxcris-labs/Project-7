import os, json, hashlib, datetime
from dataclasses import asdict

class TCALedger:
    def __init__(self, path: str):
        self.path = path
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        if not os.path.exists(self.path):
            with open(self.path, 'w') as f:
                pass

    def log_fill(self, order, fill, venue, ctx):
        rec = {
            "ts": fill.ts,
            "venue": venue,
            "order": order.__dict__,
            "fill": fill.__dict__,
            "ctx": ctx
        }
        with open(self.path, 'a') as f:
            f.write(json.dumps(rec) + "\n")

def daily_merkle(path: str, out_path: str):
    by_day = {}
    with open(path, 'r') as f:
        for line in f:
            if not line.strip():
                continue
            j = json.loads(line)
            day = datetime.datetime.utcfromtimestamp(j["ts"]).strftime("%Y-%m-%d")
            by_day.setdefault(day, []).append(line.strip())
    out = {}
    for k, lines in by_day.items():
        h = hashlib.sha256()
        for ln in lines:
            h.update(ln.encode())
        out[k] = h.hexdigest()
    with open(out_path, 'w') as f:
        json.dump(out, f, indent=2)
