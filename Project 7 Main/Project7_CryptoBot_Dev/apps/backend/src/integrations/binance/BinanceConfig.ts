import dotenv from 'dotenv';

dotenv.config();

export interface BinanceConfig {
  restUrl: string;
  apiKey?: string;
  apiSecret?: string;
  recvWindow: number;
  symbols: string[];
  pollIntervalMs: number;
  tradingEnabled: boolean;
}

export const createBinanceConfig = (): BinanceConfig => {
  const symbols = (process.env.BINANCE_SYMBOLS || 'BTCUSDT,ETHUSDT')
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  return {
    restUrl: process.env.BINANCE_REST_URL || 'https://api.binance.com',
    apiKey: process.env.BINANCE_API_KEY,
    apiSecret: process.env.BINANCE_API_SECRET,
    recvWindow: Number(process.env.BINANCE_RECV_WINDOW || 5000),
    symbols,
    pollIntervalMs: Number(process.env.BINANCE_MD_POLL_INTERVAL || 5000),
    tradingEnabled: /^true$/i.test(process.env.BINANCE_TRADING_ENABLED || 'false'),
  };
};
