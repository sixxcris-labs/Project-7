import type { PlaceOrderResponse, CancelOrderResponse, AccountSnapshot } from '../../../../../packages/common/src/types/trading';

const base = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/\/$/, '');

const buildUrl = (path: string) => `${base}${path}`;

const requestJson = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Trading API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
};

export interface PlaceOrderPayload {
  symbol: string;
  side: 'buy' | 'sell';
  type?: 'limit' | 'market';
  quantity: number;
  price?: number;
  tif?: string;
  clientOrderId?: string;
}

export const placeOrder = (payload: PlaceOrderPayload): Promise<PlaceOrderResponse> => {
  return requestJson<PlaceOrderResponse>(buildUrl('/api/trading/orders'), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const cancelOrder = (orderId: string, symbol?: string): Promise<CancelOrderResponse> => {
  const url = new URL(buildUrl(`/api/trading/orders/${encodeURIComponent(orderId)}`));
  if (symbol) {
    url.searchParams.set('symbol', symbol);
  }
  return requestJson<CancelOrderResponse>(url.toString(), { method: 'DELETE' });
};

export const fetchAccount = (): Promise<AccountSnapshot> => {
  return requestJson<AccountSnapshot>(buildUrl('/api/trading/account'));
};
