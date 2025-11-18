export interface PolygonConfig {
  enabled: boolean;
  apiKey?: string;
  streamUrl: string;
  symbols: string[];
  reconnectMinDelayMs: number;
  reconnectMaxDelayMs: number;
}

const DEFAULT_STREAM_URL = 'wss://socket.polygon.io/crypto';
const DEFAULT_SYMBOLS = ['BTC-USD', 'ETH-USD'];

function parseBool(value: string | undefined, fallback = false): boolean {
  if (value == null) return fallback;
  return value.toLowerCase() === 'true';
}

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseSymbols(value: string | undefined): string[] {
  if (!value) return DEFAULT_SYMBOLS;
  return value
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

export function createPolygonConfig(env: NodeJS.ProcessEnv = process.env): PolygonConfig {
  const enabled = parseBool(env.POLYGON_LIVE_ENABLED, false);
  const apiKey = env.POLYGON_API_KEY?.trim();
  const streamUrl = env.POLYGON_STREAM_URL?.trim() || DEFAULT_STREAM_URL;
  const symbols = parseSymbols(env.POLYGON_SYMBOLS);

  return {
    enabled: enabled && Boolean(apiKey) && symbols.length > 0,
    apiKey,
    streamUrl,
    symbols,
    reconnectMinDelayMs: parseNumber(env.POLYGON_RECONNECT_MIN_MS, 5_000),
    reconnectMaxDelayMs: parseNumber(env.POLYGON_RECONNECT_MAX_MS, 60_000),
  };
}
