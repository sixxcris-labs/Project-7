import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import EventEmitter from 'events';
import type WebSocket from 'ws';
import { PolygonWebSocketClient, type PolygonQuote } from '../PolygonWebSocketClient';

class FakeSocket extends EventEmitter {
  public sent: string[] = [];
  public readyState = 0;

  constructor(public readonly url: string) {
    super();
  }

  send(payload: string) {
    this.sent.push(payload);
  }

  close() {
    this.emit('close');
  }

  terminate() {}
}

type Factory = (url: string) => FakeSocket;

const baseConfig = {
  enabled: true,
  apiKey: 'test-key',
  streamUrl: 'wss://test',
  symbols: ['BTC-USD', 'ETH-USD'],
  reconnectMinDelayMs: 10,
  reconnectMaxDelayMs: 20,
};

describe('PolygonWebSocketClient', () => {
  let sockets: FakeSocket[];
  let factory: Factory;

  beforeEach(() => {
    sockets = [];
    factory = (url) => {
      const socket = new FakeSocket(url);
      sockets.push(socket);
      return socket;
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('emits quote events', async () => {
    const client = new PolygonWebSocketClient(baseConfig, factory as unknown as (url: string) => WebSocket);
    const quotePromise = new Promise<PolygonQuote>((resolve) => {
      client.once('quote', resolve);
    });

    client.start();
    const socket = sockets[0];
    socket.emit('open');

    socket.emit(
      'message',
      JSON.stringify([
        { ev: 'XA', pair: 'BTC-USD', bp: 50100, ap: 50120, t: 123 },
      ]),
    );

    const quote = await quotePromise;
    expect(quote.symbol).toBe('BTC-USD');
    expect(quote.bid).toBe(50100);
    expect(quote.ask).toBe(50120);
  });

  it('reconnects with backoff', async () => {
    vi.useFakeTimers();
    const client = new PolygonWebSocketClient(baseConfig, factory as unknown as (url: string) => WebSocket);
    client.start();
    sockets[0].emit('open');
    sockets[0].emit('close');
    await vi.advanceTimersByTimeAsync(10);
    expect(sockets.length).toBe(2);
  });

  it('does nothing when disabled', () => {
    const disabled = { ...baseConfig, enabled: false };
    const client = new PolygonWebSocketClient(disabled, factory as unknown as (url: string) => WebSocket);
    client.start();
    expect(sockets.length).toBe(0);
  });
});
