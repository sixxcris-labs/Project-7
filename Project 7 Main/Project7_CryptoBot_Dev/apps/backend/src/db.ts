
import { Pool, PoolClient } from 'pg';

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function withTenant<T>(tenantId: string, fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("select set_config('app.tenant', $1, true)", [tenantId]);
    return await fn(client);
  } finally {
    client.release();
  }
}
