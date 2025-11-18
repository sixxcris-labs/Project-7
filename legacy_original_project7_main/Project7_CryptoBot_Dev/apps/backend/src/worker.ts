
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { spawn } from 'node:child_process';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

const worker = new Worker('backtestQueue', async (job: Job<any>) => {
  if (process.env.LEAN_CLI === '1') {
    console.log('Running LEAN backtest for', job.data.project);
    const child = spawn('lean', ['backtest', job.data.project], { stdio: 'inherit' });
    await new Promise((resolve, reject) => {
      child.on('exit', (code) => code === 0 ? resolve(0) : reject(new Error('LEAN exited '+code)));
    });
  } else {
    console.log('Simulated backtest for', job.data);
  }
  return { ok: true };
}, { connection });

worker.on('completed', (job: Job) => console.log('Job completed', job.id));
worker.on('failed', (job: Job | null, err: Error) => console.error('Job failed', job?.id, err));
