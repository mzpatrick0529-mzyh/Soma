import { Pool, PoolClient } from 'pg';
import 'dotenv/config';

let pool: Pool | null = null;

export function getPgPool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Missing SUPABASE_DB_URL (or DATABASE_URL) in env');
  }
  pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  return pool;
}

export async function withUserClient<T>(userId: string, fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const p = getPgPool();
  const client = await p.connect();
  try {
    // Set RLS session variable
    await client.query("SET app.user_id = $1", [userId]);
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function healthcheck(): Promise<boolean> {
  const p = getPgPool();
  const r = await p.query('SELECT 1 as ok');
  return r.rows?.[0]?.ok === 1;
}
