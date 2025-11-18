import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useLiveQuotes } from '../useLiveQuotes';

describe('useLiveQuotes', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('fetches and stores quotes', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        quotes: [
          {
            exchange: 'polygon',
            symbol: { base: 'BTC', quote: 'USD', id: 'BTC-USD' },
            bid: 10,
            ask: 11,
            spread: 1,
            mid: 10.5,
            ts: Date.now(),
            source: 'polygon',
          },
        ],
      }),
    });

    const { result } = renderHook(() => useLiveQuotes(['btc-usd'], 0));

    await waitFor(() => {
      expect(result.current.quotes).toHaveLength(1);
      expect(result.current.status).toBe('ready');
    });
  });

  it('records errors when request fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false });
    const { result } = renderHook(() => useLiveQuotes(['ETH-USD'], 0));
    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
  });
});
