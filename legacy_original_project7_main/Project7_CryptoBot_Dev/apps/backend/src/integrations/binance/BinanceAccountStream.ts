import EventEmitter from 'node:events';

/**
 * Placeholder for future user-data stream support. Currently emits no events but keeps the
 * interface ready so wiring does not need to change when we add WebSocket listeners.
 */
export class BinanceAccountStream extends EventEmitter {
  private running = false;

  start(): void {
    this.running = true;
  }

  stop(): void {
    this.running = false;
    this.removeAllListeners();
  }

  isRunning(): boolean {
    return this.running;
  }
}
