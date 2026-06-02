#!/usr/bin/env node
/**
 * Verifica que POSTGRES_URL conecta y que los schemas raw+marts están aplicados.
 * Nunca imprime la password.
 *
 * Uso:  node --env-file=.env.local scripts/check-pg.mjs
 */
import { Client } from 'pg'

const url = process.env.POSTGRES_URL
if (!url) {
  console.error('❌ POSTGRES_URL no está definido en .env.local')
  process.exit(1)
}

const masked = url.replace(/(:\/\/[^:]+:)[^@]+(@)/, '$1***$2')
console.log('→ POSTGRES_URL =', masked)

let parsed
try {
  parsed = new URL(url)
} catch (e) {
  console.error('❌ URL no parseable:', e.message)
  console.error('   Si tu password tiene "/", "#", "@", etc., debe estar URL-encoded.')
  process.exit(1)
}
console.log('   host =', parsed.host)
console.log('   db   =', parsed.pathname.slice(1))
console.log('   user =', parsed.username)
console.log('   pwd  =', parsed.password ? `yes (${parsed.password.length} chars)` : 'NO ❌')
console.log()

console.log('→ Conectando a Supabase...')
const client = new Client({ connectionString: url })
try {
  await client.connect()
  console.log('✅ Conectado')

  // Schemas
  const schemas = (await client.query(
    `SELECT schema_name FROM information_schema.schemata
      WHERE schema_name IN ('raw', 'marts')
      ORDER BY schema_name`
  )).rows.map((r) => r.schema_name)
  console.log()
  console.log('→ Schemas:')
  for (const s of ['raw', 'marts']) {
    if (schemas.includes(s)) console.log('   ✅', s)
    else console.log('   ❌', s, '· falta aplicar el SQL correspondiente')
  }

  // Tablas críticas
  console.log()
  console.log('→ Tablas:')
  const tables = (await client.query(
    `SELECT table_schema, table_name FROM information_schema.tables
      WHERE table_schema IN ('raw', 'marts')
      ORDER BY table_schema, table_name`
  )).rows
  const want = [
    ['raw', 'servers'],
    ['raw', 'stars_history'],
    ['raw', 'crawls'],
    ['raw', 'categories'],
  ]
  for (const [s, t] of want) {
    const found = tables.some((r) => r.table_schema === s && r.table_name === t)
    console.log(found ? '   ✅' : '   ❌', `${s}.${t}`)
  }

  // Función search_servers
  const fn = (await client.query(
    `SELECT proname FROM pg_proc p
       JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'marts' AND proname = 'search_servers'`
  )).rows
  console.log()
  console.log('→ Función marts.search_servers:', fn.length > 0 ? '✅' : '❌')

  // Categorías seed
  const cats = (await client.query('SELECT COUNT(*)::int AS c FROM raw.categories')).rows[0].c
  console.log('→ Categorías seed:', cats > 0 ? `✅ (${cats})` : '❌ falta seed')

  // pg_trgm
  const trgm = (await client.query(
    `SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'`
  )).rows.length
  console.log('→ Extensión pg_trgm:', trgm > 0 ? '✅' : '❌')
} catch (e) {
  console.error('❌ Conexión fallida:', e.message)
  process.exit(1)
} finally {
  await client.end()
}
