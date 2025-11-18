export type AppConfig={PAPER_DATA_PATH:string;QUANT_API_URL:string;BINANCE_TRADING_ENABLED:boolean};
export function getConfig():AppConfig{ return {
  PAPER_DATA_PATH: process.env.PAPER_DATA_PATH || './data/paper_state.json',
  QUANT_API_URL: process.env.QUANT_API_URL || 'http://localhost:8100',
  BINANCE_TRADING_ENABLED: (process.env.BINANCE_TRADING_ENABLED || 'false').toLowerCase()==='true'
}; }