export interface MassiveStatusMessage {
  ev: "status";
  status: string;
  message?: string;
}

export interface MassiveAggregateMinute {
  ev: "AM";
  sym: string;
  v: number;
  o: number;
  c: number;
  h: number;
  l: number;
  a: number;
  s: number;
  e: number;
}

export interface MassiveTrade {
  ev: "T";
  sym: string;
  i: string;
  x: number;
  p: number;
  s: number;
  t: number;
  z: number;
  c?: number[];
}

export type MassiveKnownEvent =
  | MassiveStatusMessage
  | MassiveAggregateMinute
  | MassiveTrade;
