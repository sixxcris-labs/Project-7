from typing import Dict, Any, Optional

class Strategy:
    name = "base"

    def step(self, tick: Dict[str, Any], pos: float) -> Optional[Dict[str, Any]]:
        raise NotImplementedError
