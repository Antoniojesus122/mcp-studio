/**
 * Rate limit en memoria (sliding window simple).
 * Suficiente para serverless en una sola región; en producción real
 * usaríamos Upstash Redis. Para nuestro tráfico esperado, vale.
 */

declare global {
  // eslint-disable-next-line no-var
  var __mcp_rate_limit_map: Map<string, number[]> | undefined
}

function getMap(): Map<string, number[]> {
  if (!global.__mcp_rate_limit_map) {
    global.__mcp_rate_limit_map = new Map()
  }
  return global.__mcp_rate_limit_map
}

export interface RateLimitConfig {
  windowMs: number
  max: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function checkRateLimit(key: string, cfg: RateLimitConfig): RateLimitResult {
  const map = getMap()
  const now = Date.now()
  const windowStart = now - cfg.windowMs

  const history = (map.get(key) ?? []).filter((t) => t > windowStart)

  if (history.length >= cfg.max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: (history[0] ?? now) + cfg.windowMs,
    }
  }

  history.push(now)
  map.set(key, history)

  // GC opportunistic: si el map crece mucho, podamos
  if (map.size > 5000) {
    for (const [k, v] of map.entries()) {
      if (v.length === 0 || v[v.length - 1] < windowStart) map.delete(k)
    }
  }

  return {
    allowed: true,
    remaining: cfg.max - history.length,
    resetAt: now + cfg.windowMs,
  }
}

export function ipFromRequest(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real
  return 'anon'
}
