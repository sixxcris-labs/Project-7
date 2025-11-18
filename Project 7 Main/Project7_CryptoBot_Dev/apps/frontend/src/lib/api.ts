import useSWR, { SWRConfiguration } from 'swr';

export type KpiResponse = {
  portfolio: { value: number; equity: number; currency?: string };
  execution: { avgIs: number; slippage: number; fillRate: number };
  risk: { status: string; maxDrawdown: number; cvar: number };
  meta?: { strategiesCount?: number };
};

export type ExecutionMetaOrder = {
  time: string;
  symbol: string;
  side: string;
  notional: number;
  venue: string;
  isBps: number;
  feesBps: number;
  impactBps: number;
};

export type ExecutionResponse = {
  metaOrders: ExecutionMetaOrder[];
  summary: { avgIs: number; fillRate: number; totalOrders: number };
};

export class ApiError extends Error {
  status: number;
  body: string;
  constructor(message: string, status: number, body: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export function getBase(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE?.trim() || '';
  return base.replace(/\/$/, '');
}

function buildUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${getBase()}${p}`;
}

function isJsonContentType(ct: string | null): boolean {
  return !!ct && ct.toLowerCase().includes('application/json');
}

async function parseBody<T>(res: Response): Promise<T | undefined> {
  if (res.status === 204) return undefined as unknown as T;
  const text = await res.text();
  if (!text) return undefined as unknown as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

function withTimeout(init?: RequestInit, ms = 15000) {
  if (init?.signal) return { init };
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  const wrapped: RequestInit = { ...init, signal: controller.signal };
  (wrapped as any).__timeoutId = id;
  return { init: wrapped };
}

export async function apiGet<T = any>(path: string, init?: RequestInit): Promise<T> {
  const { init: withSig } = withTimeout(init);
  const res = await fetch(buildUrl(path), {
    method: 'GET',
    headers: { Accept: 'application/json', ...(withSig?.headers || {}) },
    ...withSig,
  }).finally(() => {
    const id = (withSig as any)?.__timeoutId;
    if (id) clearTimeout(id);
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(`GET ${path} ${res.status}`, res.status, body);
  }
  return (await parseBody<T>(res)) as T;
}

export async function apiPost<T = any>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const { init: withSig } = withTimeout(init);
  const hasBody = body !== undefined;
  const res = await fetch(buildUrl(path), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(withSig?.headers || {}),
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    },
    body: hasBody ? JSON.stringify(body) : undefined,
    ...withSig,
  }).finally(() => {
    const id = (withSig as any)?.__timeoutId;
    if (id) clearTimeout(id);
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new ApiError(`POST ${path} ${res.status}`, res.status, txt);
  }
  return (await parseBody<T>(res)) as T;
}

type SWRKey = string | [string, RequestInit?];
export const swrFetcher = (key: SWRKey) => {
  if (typeof key === 'string') return apiGet(key);
  const [url, init] = key;
  return apiGet(url, init);
};

// Hooks
export function useHealth(config?: SWRConfiguration<any, ApiError>) {
  const { data, error, isLoading, mutate } = useSWR<any>('/health', swrFetcher, config);
  const healthy = !!data && !error;
  return { data, error, isLoading, mutate, healthy };
}

export function useStrategies(config?: SWRConfiguration<any[], ApiError>) {
  return useSWR<any[]>('/strategies', swrFetcher, config);
}

export function useStrategy(id?: string, config?: SWRConfiguration<any, ApiError>) {
  const key = id ? `/strategies/${id}` : null;
  return useSWR<any>(key, swrFetcher, config);
}

export function useKpi(config?: SWRConfiguration<KpiResponse, ApiError>) {
  return useSWR<KpiResponse>('/api/kpi', swrFetcher, config);
}

export function useExecution(config?: SWRConfiguration<ExecutionResponse, ApiError>) {
  return useSWR<ExecutionResponse>('/api/execution', swrFetcher, config);
}

export function useDashboardMetrics() {
  const health = useHealth({ revalidateOnFocus: false });
  const { data: kpi, error: kpiError, isLoading: loadingKpi } = useKpi({ revalidateOnFocus: false });
  return {
    health,
    kpi,
    strategiesCount: kpi?.meta?.strategiesCount ?? 0,
    loading: health.isLoading || loadingKpi,
    error: (health.error as ApiError | undefined) || (kpiError as ApiError | undefined),
  };
}
