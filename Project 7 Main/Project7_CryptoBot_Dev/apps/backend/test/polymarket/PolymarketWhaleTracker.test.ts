import { PolymarketWhaleTracker } from '../../src/services/polymarket/PolymarketWhaleTracker';
import type {
  PolymarketTrade,
  PolymarketWhaleTrackerConfig,
} from '../../../../packages/common/src/types/polymarketWhales';

describe('PolymarketWhaleTracker', () => {
  const config: PolymarketWhaleTrackerConfig = {
    notionalThreshold: 10_000,
    maxSampleTrades: 5,
    maxWhales: 100,
    explorerBaseUrl: 'https://polygonscan.com/address',
  };

  it('aggregates stats and promotes whales once', () => {
    const tracker = new PolymarketWhaleTracker(config);
    const trader = '0xabc';

    const baseTrade: PolymarketTrade = {
      txHash: '0x1',
      trader,
      marketId: 'market-1',
      price: 100,
      size: 50,
      notional: 5000,
      side: 'buy',
      timestamp: Date.now(),
    };

    const promoted: string[] = [];
    tracker.on('whalePromoted', (evt) => {
      promoted.push(evt.trader);
    });

    tracker.handleWhaleTrade(baseTrade);
    tracker.handleWhaleTrade({ ...baseTrade, txHash: '0x2' });

    expect(promoted).toEqual([trader.toLowerCase()]);

    const whales = tracker.getWhalesAboveThreshold(10);
    expect(whales).toHaveLength(1);

    const w = whales[0];
    expect(w.trader).toBe(trader.toLowerCase());
    expect(w.totalNotional).toBe(10_000);
    expect(w.tradeCount).toBe(2);
    expect(w.explorerUrl).toBe(
      'https://polygonscan.com/address/' + trader.toLowerCase(),
    );
  });
});
