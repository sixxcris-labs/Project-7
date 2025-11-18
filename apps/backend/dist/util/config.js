export function getConfig() {
    return {
        PAPER_DATA_PATH: process.env.PAPER_DATA_PATH || './data/paper_state.json',
        QUANT_API_URL: process.env.QUANT_API_URL || 'http://localhost:8100',
        BINANCE_TRADING_ENABLED: (process.env.BINANCE_TRADING_ENABLED || 'false').toLowerCase() === 'true'
    };
}
