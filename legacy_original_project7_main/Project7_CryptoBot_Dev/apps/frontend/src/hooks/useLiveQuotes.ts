import { useCallback, useEffect, useMemo, useState } from 'react';
import type { QuoteSnapshot } from '@common/types/quotes';
import { getQuotes } from '../services/api/quotesApi';

const DEFAULT_REFRESH_MS = Number(process.env.NEXT_PUBLIC_QUOTES_REFRESH_MS ?? '15000');

type Status = 'idle' | 'loading' | 'ready' | 'error';

export function useLiveQuotes(symbols?: string[], refreshMs: number = DEFAULT_REFRESH_MS) {
  const [quotes, setQuotes] = useState<QuoteSnapshot[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<Error | null>(null);

  const normalizedSymbols = useMemo(() => symbols?.map((s) => s.toUpperCase()), [symbols]);

  const fetchQuotes = useCallback(async () => {
    try {
      setStatus((prev) => (prev === 'idle' ? 'loading' : prev));
      const data = await getQuotes(normalizedSymbols);
      setQuotes(data);
      setStatus('ready');
      setError(null);
    } catch (err) {
      setError(err as Error);
      setStatus('error');
    }
  }, [normalizedSymbols]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const hydrate = async () => {
      await fetchQuotes();
      if (!cancelled && refreshMs > 0) {
        timer = setTimeout(hydrate, refreshMs);
      }
    };

    hydrate();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [fetchQuotes, refreshMs]);

  return {
    quotes,
    status,
    error,
    refresh: fetchQuotes,
  };
}
