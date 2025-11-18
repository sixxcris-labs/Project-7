import type { QuoteSnapshot } from '@common/types/quotes';

export async function getQuotes(symbols?: string[]): Promise<QuoteSnapshot[]> {
  const params = new URLSearchParams();
  if (symbols && symbols.length > 0) {
    params.set('symbols', symbols.join(','));
  }
  const query = params.toString();
  const response = await fetch(
    `/api/market-data/quotes${query ? `?${query}` : ''}`,
    {
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error('Failed to load live quotes');
  }

  const payload: { quotes?: QuoteSnapshot[] } = await response.json();
  return payload.quotes ?? [];
}
