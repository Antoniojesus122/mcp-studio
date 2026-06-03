import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'MCP Studio — The App Store for your AI agents'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * OG image global de mcpstudio.dev — la que se ve al compartir la home en
 * Twitter, HN, Discord, Slack, etc.
 *
 * Importante: Satori (motor de next/og) exige `display: 'flex'` explícito
 * en CADA div con más de un hijo. No tolera el default implícito ni 'inline-block'.
 */
export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px 90px',
          backgroundColor: '#0a0a0c',
          backgroundImage:
            'radial-gradient(circle at top left, rgba(255,119,51,0.18), transparent 55%)',
          color: '#fafafa',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top: logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              display: 'flex',
              width: 36,
              height: 36,
              borderRadius: 8,
              background:
                'linear-gradient(135deg, #ff7733 0%, #ffaa66 60%, rgba(166,226,46,0.55) 100%)',
              boxShadow: '0 0 0 2px rgba(255,119,51,0.4)',
            }}
          />
          <div style={{ display: 'flex', fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>
            <span style={{ color: '#fafafa' }}>mcp</span>
            <span style={{ color: '#ff7733' }}>.</span>
            <span style={{ color: '#a3a3a3' }}>studio</span>
          </div>
        </div>

        {/* Hero */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 86,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: -3,
              color: '#fafafa',
            }}
          >
            The&nbsp;
            <span style={{ color: '#ff7733' }}>App Store</span>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 86,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: -3,
              color: '#fafafa',
            }}
          >
            for your AI agents.
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 26,
              color: '#a3a3a3',
              maxWidth: 950,
              lineHeight: 1.4,
              marginTop: 8,
            }}
          >
            Discover, browse and install Model Context Protocol servers in one click.
            Works with Claude Desktop, Cursor, Cline & Continue.
          </div>
        </div>

        {/* KPIs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 36,
            fontFamily: 'monospace',
            fontSize: 22,
            color: '#a3a3a3',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                display: 'flex',
                width: 12,
                height: 12,
                borderRadius: 9999,
                background: '#ff7733',
              }}
            />
            <span style={{ color: '#fafafa', fontWeight: 700 }}>1,470+</span>
            <span>&nbsp;servers indexed</span>
          </div>
          <div style={{ display: 'flex' }}>·</div>
          <div style={{ display: 'flex' }}>
            <span style={{ color: '#fafafa', fontWeight: 700 }}>12</span>&nbsp;categories
          </div>
          <div style={{ display: 'flex' }}>·</div>
          <div style={{ display: 'flex' }}>updated hourly</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
