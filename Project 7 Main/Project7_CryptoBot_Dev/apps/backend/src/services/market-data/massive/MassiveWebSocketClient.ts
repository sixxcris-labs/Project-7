import EventEmitter from "events";
import WebSocket from "ws";

export interface MassiveWebSocketClientOptions {
  url: string;
  apiKey: string;
  subscriptions?: string[];
  reconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
}

export interface MassiveWebSocketEvents {
  connected: () => void;
  disconnected: (code: number, reason: Buffer) => void;
  event: (data: unknown) => void;
  raw: (raw: unknown) => void;
  error: (err: Error) => void;
  status: (status: unknown) => void;
}


export class MassiveWebSocketClient extends EventEmitter {
  private options: Required<Pick<MassiveWebSocketClientOptions, "url" | "apiKey">> &
    Omit<MassiveWebSocketClientOptions, "url" | "apiKey">;

  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private manuallyClosed = false;
  private authenticated = false;
  private pendingSubscriptions: Set<string> = new Set();

  constructor(opts: MassiveWebSocketClientOptions) {
    super();

    if (!opts.url) {
      throw new Error("MassiveWebSocketClient: url is required");
    }
    if (!opts.apiKey) {
      throw new Error("MassiveWebSocketClient: apiKey is required");
    }

    this.options = {
      url: opts.url,
      apiKey: opts.apiKey,
      subscriptions: opts.subscriptions ?? [],
      reconnectDelayMs: opts.reconnectDelayMs ?? 1_000,
      maxReconnectDelayMs: opts.maxReconnectDelayMs ?? 30_000,
    };

    this.options.subscriptions?.forEach((s) => this.pendingSubscriptions.add(s));
  }

  public start(): void {
    this.manuallyClosed = false;
    this.connect();
  }

  public stop(): void {
    this.manuallyClosed = true;
    this.clearReconnectTimer();
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close(1000, "client_shutdown");
    }
    this.ws = null;
  }

  public subscribe(params: string | string[]): void {
    const list = Array.isArray(params) ? params : [params];
    list.forEach((p) => this.pendingSubscriptions.add(p));
    this.sendSubscriptionsIfReady();
  }

  public unsubscribe(params: string | string[]): void {
    const list = Array.isArray(params) ? params : [params];
    list.forEach((p) => this.pendingSubscriptions.delete(p));
  }

  private connect(): void {
    this.clearReconnectTimer();

    this.ws = new WebSocket(this.options.url);

    this.ws.on("open", () => this.handleOpen());
    this.ws.on("message", (data: any) => this.handleMessage(data));
    this.ws.on("close", (code: any, reason: any) => this.handleClose(code, reason));
    this.ws.on("error", (err: any) => this.handleError(err));
  }

  private handleOpen(): void {
    this.reconnectAttempts = 0;
    this.authenticated = false;
    this.sendAuth();
  }

  private sendAuth(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const payload = {
      action: "auth",
      params: this.options.apiKey,
    };

    this.ws.send(JSON.stringify(payload));
  }

  private handleMessage(data: WebSocket.RawData): void {
    const text = data.toString("utf8");

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      this.emit("error", new Error(`MassiveWebSocketClient: failed to parse JSON: ${(err as Error).message}`));
      return;
    }

    this.emit("raw", parsed);

    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        this.routeEvent(item);
      }
    } else {
      this.routeEvent(parsed);
    }
  }

  private routeEvent(msg: any): void {
    if (!msg || typeof msg !== "object") return;

    if (msg.ev === "status") {
      this.emit("status", msg);

      if (msg.status === "connected") {
        return;
      }

      if (msg.status === "auth_success") {
        this.authenticated = true;
        this.emit("connected");
        this.sendSubscriptionsIfReady();
        return;
      }

      if (msg.status === "auth_failed" || msg.status === "error") {
        this.emit("error", new Error(`Massive status error: ${JSON.stringify(msg)}`));
      }

      return;
    }

    this.emit("event", msg);
  }

  private sendSubscriptionsIfReady(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.authenticated) return;
    if (!this.pendingSubscriptions.size) return;

    const params = Array.from(this.pendingSubscriptions).join(",");

    const payload = {
      action: "subscribe",
      params,
    };

    try {
      this.ws.send(JSON.stringify(payload));
    } catch (err) {
      this.emit("error", new Error(`MassiveWebSocketClient: failed to send subscribe: ${(err as Error).message}`));
    }
  }

  private handleClose(code: number, reason: Buffer): void {
    this.authenticated = false;
    this.emit("disconnected", code, reason);

    if (this.manuallyClosed) {
      return;
    }

    this.scheduleReconnect();
  }

  private handleError(err: Error): void {
    this.emit("error", err);
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    this.reconnectAttempts += 1;

    const base = this.options.reconnectDelayMs ?? 1_000;
    const max = this.options.maxReconnectDelayMs ?? 30_000;
    const delay = Math.min(max, base * Math.pow(2, this.reconnectAttempts - 1));

    this.reconnectTimeout = setTimeout(() => {
      if (!this.manuallyClosed) {
        this.connect();
      }
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
}
