import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { query } from '@/lib/db'
import { Logo } from '@/components/Logo'
import { InstallTabs } from '@/components/InstallTabs'

export const revalidate = 300

interface Server {
  id: number
  full_name: string
  owner: string
  name: string
  html_url: string
  description: string | null
  homepage: string | null
  language: string | null
  license: string | null
  topics: string[]
  tags: string[]
  summary: string | null
  category: string | null
  category_name: string | null
  category_icon: string | null
  stars: number
  forks: number
  open_issues: number
  repo_pushed_at: string | null
  readme_excerpt: string | null
  install_command: string | null
  install_config: Record<string, unknown> | null
  is_official: boolean
}

async function getServer(owner: string, name: string): Promise<Server | null> {
  try {
    const rows = await query<Server>(
      `SELECT * FROM marts.servers_public WHERE owner = $1 AND name = $2`,
      [owner, name]
    )
    return rows[0] ?? null
  } catch (e) {
    console.error('[server detail] query failed', e)
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ owner: string; name: string }>
}): Promise<Metadata> {
  const { owner, name } = await params
  const s = await getServer(owner, name)
  if (!s) return { title: 'Server not found' }
  const desc =
    s.summary ??
    s.description ??
    `${s.name} — an MCP server by ${s.owner}. Install in Claude Desktop, Cursor or Cline.`
  const canonical = `https://mcpstudio.dev/server/${s.owner}/${s.name}`
  return {
    title: `${s.name} · MCP Server`,
    description: desc,
    alternates: { canonical },
    openGraph: {
      title: `${s.name} — MCP server by ${s.owner}`,
      description: desc,
      url: canonical,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${s.name} — MCP server`,
      description: desc,
    },
  }
}

export default async function ServerDetailPage({
  params,
}: {
  params: Promise<{ owner: string; name: string }>
}) {
  const { owner, name } = await params
  const s = await getServer(owner, name)
  if (!s) notFound()

  // JSON-LD: SoftwareApplication para que Google muestre rich results
  // (ratings, descripción, autor, lenguaje) en las SERP.
  const ldJson = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: s.name,
    description: s.summary ?? s.description ?? undefined,
    url: `https://mcpstudio.dev/server/${s.owner}/${s.name}`,
    applicationCategory: 'DeveloperApplication',
    applicationSubCategory: s.category_name ?? 'MCP Server',
    operatingSystem: 'Cross-platform',
    programmingLanguage: s.language ?? undefined,
    codeRepository: s.html_url,
    license: s.license ?? undefined,
    author: { '@type': 'Organization', name: s.owner, url: `https://github.com/${s.owner}` },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    aggregateRating:
      s.stars > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: '5',
            ratingCount: s.stars,
            bestRating: '5',
            worstRating: '1',
          }
        : undefined,
  }

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJson) }}
      />
      <header className="px-6 md:px-10 py-6 flex items-center justify-between border-b border-border">
        <Logo size="md" />
        <Link href="/browse" className="text-text-dim hover:text-text text-sm">← Browse</Link>
      </header>

      <div className="px-6 md:px-10 py-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 font-mono text-[12px] text-text-mute">
              <span>{s.owner}</span>
              <span>/</span>
              {s.is_official && (
                <span className="font-mono text-[10px] uppercase tracking-wider text-brand bg-brand-soft px-1.5 py-0.5 rounded">official</span>
              )}
              {s.category_name && (
                <Link
                  href={`/browse?category=${s.category}`}
                  className="font-mono text-[10px] uppercase tracking-wider text-text-dim hover:text-brand bg-surface border border-border px-1.5 py-0.5 rounded"
                >
                  {s.category_name}
                </Link>
              )}
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
              {s.name}
            </h1>
            <p className="text-text-dim text-lg leading-relaxed max-w-2xl">
              {s.summary || s.description || 'No description.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href={s.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border hover:border-text-mute text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
              GitHub
            </a>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Stat label="stars" value={s.stars.toLocaleString()} />
          <Stat label="forks" value={s.forks.toLocaleString()} />
          <Stat label="language" value={s.language ?? '—'} />
          <Stat label="license" value={s.license ?? '—'} />
        </div>

        {/* Install */}
        <h2 className="font-bold text-xl tracking-tight mb-3">Install</h2>
        <InstallTabs
          serverName={s.name}
          installCommand={s.install_command}
          installConfig={s.install_config}
          fullName={s.full_name}
        />

        {/* Tags */}
        {(s.tags?.length > 0 || s.topics?.length > 0) && (
          <div className="mt-8">
            <h3 className="font-mono text-[10px] text-text-mute uppercase tracking-widest mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {[...new Set([...(s.tags ?? []), ...(s.topics ?? [])])].slice(0, 12).map((t) => (
                <span key={t} className="font-mono text-[11px] text-text-dim bg-surface border border-border px-2.5 py-1 rounded">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Readme excerpt */}
        {s.readme_excerpt && (
          <div className="mt-10">
            <h3 className="font-mono text-[10px] text-text-mute uppercase tracking-widest mb-3">About</h3>
            <p className="text-text-dim leading-relaxed">{s.readme_excerpt}</p>
            <a
              href={s.html_url + '#readme'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 font-mono text-[12px] text-brand hover:underline"
            >
              read full README on GitHub →
            </a>
          </div>
        )}

        {/* Footer meta */}
        <div className="mt-12 pt-6 border-t border-border font-mono text-[11px] text-text-mute">
          {s.repo_pushed_at && (
            <span>last updated {formatDate(s.repo_pushed_at)} · </span>
          )}
          {s.open_issues > 0 && <span>{s.open_issues} open issues</span>}
        </div>
      </div>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-3.5">
      <div className="font-mono text-[10px] text-text-mute uppercase tracking-widest mb-1">{label}</div>
      <div className="font-mono text-lg font-semibold tracking-tight">{value}</div>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (days < 1) return 'today'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}
