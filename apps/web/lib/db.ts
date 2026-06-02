import { Pool } from 'pg'
import { env } from './env'

declare global {
  // eslint-disable-next-line no-var
  var __mcp_pg_pool: Pool | undefined
}

function getPool(): Pool {
  if (!global.__mcp_pg_pool) {
    global.__mcp_pg_pool = new Pool({
      connectionString: env.postgres.url,
      max: 10,
      idleTimeoutMillis: 30_000,
    })
  }
  return global.__mcp_pg_pool
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await getPool().query(text, params)
  return result.rows as T[]
}
