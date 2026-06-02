/**
 * POST /api/recommend
 * body: { q: string }
 *
 * Rate-limited: 8 requests por minuto por IP, 30 por hora.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { recommendMcpServers } from '@/lib/recommender'
import { checkRateLimit, ipFromRequest } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const ip = ipFromRequest(req)

  const minuteLimit = checkRateLimit(`recommend:min:${ip}`, { windowMs: 60_000, max: 8 })
  const hourLimit = checkRateLimit(`recommend:hour:${ip}`, { windowMs: 3_600_000, max: 30 })
  if (!minuteLimit.allowed || !hourLimit.allowed) {
    const headers = new Headers({
      'X-RateLimit-Remaining-Minute': String(minuteLimit.remaining),
      'X-RateLimit-Remaining-Hour': String(hourLimit.remaining),
      'Retry-After': String(Math.max(1, Math.ceil((Math.max(minuteLimit.resetAt, hourLimit.resetAt) - Date.now()) / 1000))),
    })
    return NextResponse.json(
      { error: 'rate_limited', message: 'Too many requests. Try again in a moment.' },
      { status: 429, headers }
    )
  }

  let body: { q?: string }
  try {
    body = (await req.json()) as { q?: string }
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const q = String(body.q ?? '').trim()
  if (!q) {
    return NextResponse.json({ error: 'missing_query' }, { status: 400 })
  }

  try {
    const result = await recommendMcpServers(q)
    return NextResponse.json(result, {
      headers: {
        'X-RateLimit-Remaining-Minute': String(minuteLimit.remaining),
        'X-RateLimit-Remaining-Hour': String(hourLimit.remaining),
      },
    })
  } catch (e) {
    console.error('[recommend] failed', e)
    return NextResponse.json(
      { error: 'internal_error', message: e instanceof Error ? e.message.slice(0, 200) : 'unknown' },
      { status: 500 }
    )
  }
}
