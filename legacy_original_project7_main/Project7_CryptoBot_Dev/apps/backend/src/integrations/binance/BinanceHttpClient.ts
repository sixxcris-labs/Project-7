import crypto from 'crypto';
import { URLSearchParams } from 'url';

type Method = 'GET' | 'POST' | 'DELETE';

interface RequestOpts {
  path: string;
  method: Method;
  signed?: boolean;
  params?: Record<string, string | number | boolean | undefined>;
  json?: unknown; // if provided, send JSON (for unsigned endpoints)
}

const REST_BASE = process.env.BINANCE_REST_BASE_URL ?? 'https://api.binance.us';

export class BinanceHttpClient {
  constructor(
    private readonly apiKey?: string,
    private readonly apiSecret?: string,
  ) {}

  private sign(query: string): string {
    if (!this.apiSecret) {
      throw new Error('Missing API secret for signed call');
    }
    return crypto.createHmac('sha256', this.apiSecret).update(query).digest('hex');
  }

  async request<T>(opts: RequestOpts): Promise<T> {
    const url = new URL(opts.path, REST_BASE);
    const headers: Record<string, string> = {};

    if (this.apiKey) {
      headers['X-MBX-APIKEY'] = this.apiKey;
    }

    let body: string | undefined;

    if (opts.signed) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(opts.params ?? {})) {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      }

      params.append('timestamp', Date.now().toString());
      const signature = this.sign(params.toString());
      params.append('signature', signature);

      if (opts.method === 'GET' || opts.method === 'DELETE') {
        url.search = params.toString();
      } else {
        // Signed POST: form-encoded body
        body = params.toString();
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }
    } else {
      // Unsigned requests
      for (const [key, value] of Object.entries(opts.params ?? {})) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }

      if (opts.json !== undefined) {
        body = JSON.stringify(opts.json);
        headers['Content-Type'] = 'application/json';
      }
    }

    const res = await fetch(url.toString(), {
      method: opts.method,
      headers,
      body,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '<no body>');
      throw new Error(`Binance ${res.status}: ${text}`);
    }

    return (await res.json()) as T;
  }

  async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>({
      path,
      method: 'GET',
      params,
    });
  }

  async signedRequest<T>(opts: Omit<RequestOpts, 'signed'>): Promise<T> {
    return this.request<T>({
      ...opts,
      signed: true,
    });
  }
}
