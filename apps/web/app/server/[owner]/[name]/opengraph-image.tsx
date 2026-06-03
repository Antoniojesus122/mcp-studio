import { ImageResponse } from 'next/og'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const alt = 'MCP Server detail'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

interface Row {
  owner: string
  name: string
  summary: string | null
  description: string | null
  stars: number
  language: string | null
  category_name: string | null
  is_official: boolean
}

export default async function ServerOG({
  params,
}: {
  params: Promise<{ owner: string; name: string }>
}) {
  const { owner: ownerParam, name: nameParam } = await params
  let s: Row | null = null
  try {
    const rows = await query<Row>(
      `SELECT owner, name, summary, description, stars, language, category_name, is_official
         FROM marts.servers_public WHERE owner = $1 AND name = $2`,
      [ownerParam, nameParam]
    )
    s = rows[0] ?? null
  } catch (e) {
    console.error('[og:server] query failed', e)
  }

  const blurb = (s?.summary ?? s?.description ?? 'An MCP server for AI agents.').slice(0, 200)
  const owner = s?.owner ?? ownerParam
  const name = s?.name ?? nameParam
  const stars = s?.stars ?? 0
  const category = s?.category_name ?? 'MCP server'
  const language = s?.language ?? ''
  const isOfficial = s?.is_official ?? false

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '70px 80px',
          backgroundColor: '#0a0a0c',
          backgroundImage:
            'radial-gradient(circle at top left, rgba(255,119,51,0.16), transparent 55%)',
          color: '#fafafa',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top: logo + category chip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                display: 'flex',
                width: 28,
                height: 28,
                borderRadius: 6,
                background:
                  'linear-gradient(135deg, #ff7733 0%, rgba(166,226,46,0.4) 100%)',
              }}
            />
            <div style={{ display: 'flex', fontSize: 22, fontWeight: 800 }}>
              <span style={{ color: '#fafafa' }}>mcp</span>
              <span style={{ color: '#ff7733' }}>.</span>
              <span style={{ color: '#a3a3a3' }}>studio</span>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              fontFamily: 'monospace',
              fontSize: 18,
              padding: '8px 14px',
              borderRadius: 10,
              background: 'rgba(255,119,51,0.14)',
              color: '#ff7733',
              border: '1px solid rgba(255,119,51,0.3)',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {category}
          </div>
        </div>

        {/* Middle: server name + blurb */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              display: 'flex',
              fontFamily: 'monospace',
              fontSize: 24,
              color: '#a3a3a3',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>{owner}</span>
            <span>/</span>
            {isOfficial ? (
              <span style={{ display: 'flex', color: '#ff7733', fontWeight: 700, fontSize: 18 }}>
                ✓&nbsp;
              </span>
            ) : null}
            <span>{name}</span>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 64,
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: -2,
              color: '#fafafa',
              maxWidth: 1040,
            }}
          >
            {name}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 26,
              color: '#d4d4d4',
              lineHeight: 1.35,
              maxWidth: 1040,
            }}
          >
            {blurb}
          </div>
        </div>

        {/* Bottom: stars + language + cta */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'monospace',
            fontSize: 22,
            color: '#a3a3a3',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Star inline SVG (Satori no tiene emoji nativo) */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#ff7733">
                <path d="M12 .587l3.668 7.568L24 9.75l-6 5.847L19.336 24 12 20.014 4.664 24 6 15.597 0 9.75l8.332-1.595z" />
              </svg>
              <span style={{ color: '#fafafa', fontWeight: 700 }}>
                {stars.toLocaleString('en-US')}
              </span>
            </div>
            {language ? (
              <div style={{ display: 'flex' }}>
                <span style={{ color: '#fafafa' }}>{language}</span>
              </div>
            ) : null}
          </div>
          <div style={{ display: 'flex', color: '#a3a3a3' }}>install in one click →</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
