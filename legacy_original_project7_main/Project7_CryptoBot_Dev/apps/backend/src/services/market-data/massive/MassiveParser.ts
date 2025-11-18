import {
  MassiveAggregateMinute,
  MassiveTrade,
  MassiveStatusMessage,
} from "@common/types/market/MassiveTypes";
import {
  NormalizedBar,
  NormalizedTrade,
} from "@common/types/market/NormalizedMarketTypes";

export function normalizeMassiveEvent(
  event: unknown
): NormalizedBar | NormalizedTrade | null {
  if (!event || typeof event !== "object") return null;

  const ev = (event as any).ev;

  switch (ev) {
    case "AM":
      return normalizeAggregate(event as MassiveAggregateMinute);
    case "T":
      return normalizeTrade(event as MassiveTrade);
    default:
      return null;
  }
}

function normalizeAggregate(ev: MassiveAggregateMinute): NormalizedBar {
  return {
    source: "massive",
    symbol: ev.sym,
    intervalMs: ev.e - ev.s,
    startTime: ev.s,
    endTime: ev.e,
    open: ev.o,
    high: ev.h,
    low: ev.l,
    close: ev.c,
    volume: ev.v,
    vwap: ev.a,
  };
}

function normalizeTrade(ev: MassiveTrade): NormalizedTrade {
  return {
    source: "massive",
    symbol: ev.sym,
    tradeId: ev.i,
    exchangeId: ev.x,
    price: ev.p,
    size: ev.s,
    conditions: ev.c ?? [],
    timestamp: ev.t,
    tape: ev.z,
  };
}

export function isMassiveStatusMessage(
  event: unknown
): event is MassiveStatusMessage {
  return Boolean(
    event &&
      typeof event === "object" &&
      (event as any).ev === "status"
  );
}
