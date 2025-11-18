declare module 'bullmq' {
  export class Queue<T = any> {
    constructor(name: string, opts?: any);
    add(name: string, data: T, opts?: any): Promise<{ id: string }>;
  }

  export class Worker<T = any, R = any> {
    constructor(name: string, processor: (job: Job<T>) => Promise<R> | R, opts?: any);
    on(event: string, handler: (...args: any[]) => void): this;
  }

  export interface Job<T = any> {
    id?: string;
    name: string;
    data: T;
  }
}
