export class BinanceError extends Error {
  public readonly code?: string | number;
  public readonly status?: number;
  public readonly payload?: unknown;

  constructor(message: string, options?: { code?: string | number; status?: number; payload?: unknown }) {
    super(message);
    this.name = 'BinanceError';
    this.code = options?.code;
    this.status = options?.status;
    this.payload = options?.payload;
  }
}
