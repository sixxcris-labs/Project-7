import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';

test('market stream plugin exposes SSE ping heartbeat endpoint', async () => {
  const { default: marketStream } = await import('../src/api/marketData.stream.ts');

  let registeredPath: string | undefined;
  let handler: ((req: any, res: any) => any) | undefined;

  const fakeApp = {
    get: (path: string, routeHandler: any) => {
      registeredPath = path;
      handler = routeHandler;
    },
  };

  await marketStream(fakeApp as any);

  assert.equal(registeredPath, '/api/market/stream');
  assert.ok(handler, 'route handler registered');

  const headers: Record<string, string> = {};
  const writes: string[] = [];
  let flushed = false;

  const res = {
    raw: {
      setHeader: (name: string, value: string) => {
        headers[name.toLowerCase()] = value;
      },
      flushHeaders: () => {
        flushed = true;
      },
      write: (chunk: string) => {
        writes.push(chunk);
      },
    },
  };

  const req = { raw: new EventEmitter() };

  const originalSetInterval = global.setInterval;
  const originalClearInterval = global.clearInterval;

  let intervalFn: (() => void) | undefined;
  const timerId = {};
  let cleared = false;

  global.setInterval = ((cb: TimerHandler) => {
    intervalFn = cb as () => void;
    return timerId;
  }) as unknown as typeof setInterval;

  global.clearInterval = ((id: unknown) => {
    if (id === timerId) {
      cleared = true;
    }
  }) as unknown as typeof clearInterval;

  try {
    const result = handler!(req as any, res as any);
    if (result && typeof result.then === 'function') {
      await result;
    }

    assert.equal(headers['content-type'], 'text/event-stream');
    assert.equal(headers['cache-control'], 'no-cache');
    assert.equal(headers['connection'], 'keep-alive');
    assert.ok(flushed, 'flushHeaders called to establish stream');

    assert.ok(writes.length > 0, 'initial SSE payload written');
    assert.ok(
      writes[0].includes('event: ping') && writes[0].includes('data: {}'),
      'initial payload includes ping event'
    );

    assert.ok(intervalFn, 'ping interval scheduled');
    intervalFn?.();

    assert.ok(
      writes.some((chunk) => chunk.includes('event: ping') && chunk.includes('data: {}')),
      'interval writes ping events'
    );

    req.raw.emit('close');
    assert.ok(cleared, 'interval cleared when client disconnects');
  } finally {
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
  }
});
