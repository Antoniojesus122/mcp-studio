import Link from 'next/link'
import { query } from '@/lib/db'
import { Logo } from '@/components/Logo'
import { SearchBar } from '@/components/SearchBar'
import { ServerCard, type ServerCardData } from '@/components/ServerCard'

export const revalidate = 600

interface Stats {
  total_servers: number
  total_stars: number
  total_categories: number
  total_languages: number
  last_crawl_at: string | null
}

interface Category {
  slug: string
  name: string
  icon: string | null
  server_count: number
}

export default async function LandingPage() {
  let stats: Stats | null = null
  let featured: ServerCardData[] = []
  let categories: Category[] = []
  try {
    const [s, f, c] = await Promise.all([
      query<Stats>('SELECT * FROM marts.global_stats'),
      query<ServerCardData>(
        `SELECT full_name, owner, name, summary, description, language, stars, category, category_name, is_official
           FROM marts.servers_public
          WHERE is_featured = TRUE OR is_official = TRUE OR stars >= 500
          ORDER BY is_featured DESC, is_official DESC, stars DESC
          LIMIT 6`
      ),
      query<Category>('SELECT slug, name, icon, server_count FROM marts.category_counts WHERE server_count > 0'),
    ])
    stats = s[0] ?? null
    featured = f
    categories = c
  } catch (e) {
    console.error('[landing] query failed', e)
  }

  return (
    <main className="min-h-screen">
      <header className="px-6 md:px-10 py-6 flex items-center justify-between">
        <Logo size="md" />
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/browse" className="text-text-dim hover:text-text">Browse</Link>
          <a
            href="https://github.com/Antoniojesus122/mcp-studio"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-dim hover:text-text flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            GitHub
          </a>
        </nav>
      </header>

      <section className="px-6 md:px-10 pt-16 md:pt-28 pb-16 max-w-4xl mx-auto text-center">
        <div className="font-mono text-[11px] text-brand uppercase tracking-widest mb-4">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand mr-2 align-middle animate-pulse-soft" />
          updated hourly · {stats?.total_servers ?? '—'} MCP servers indexed
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1.05] mb-6">
          The <span style={{ color: 'var(--color-brand)' }}>App Store</span>
          <br />for your AI agents.
        </h1>
        <p className="text-text-dim text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Discover, browse and install Model Context Protocol servers in one click.
          Works with <span className="text-text">Claude Desktop</span>, <span className="text-text">Cursor</span>, <span className="text-text">Cline</span> and <span className="text-text">Continue</span>.
        </p>
        <div className="max-w-xl mx-auto">
          <SearchBar autoFocus />
          <Link
            href="/ask"
            className="mt-4 inline-flex items-center gap-2 font-mono text-[12px] text-text-dim hover:text-brand transition-colors"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand animate-pulse-soft" />
            or ask in plain English →
          </Link>
        </div>
        {stats && (
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 md:gap-10 font-mono text-[12px] text-text-dim">
            <Stat label="servers" value={stats.total_servers} />
            <Stat label="total stars" value={stats.total_stars} />
            <Stat label="categories" value={stats.total_categories} />
            <Stat label="languages" value={stats.total_languages} />
          </div>
        )}
      </section>

      <section className="px-6 md:px-10 py-12 max-w-6xl mx-auto">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-bold text-2xl md:text-3xl tracking-tight">Browse by capability</h2>
          <Link href="/browse" className="text-text-dim hover:text-brand font-mono text-[12px]">all servers →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/browse?category=${c.slug}`}
              className="group bg-surface border border-border rounded-xl p-5 hover:border-brand/60 hover:bg-surface-2 transition-all"
            >
              <div className="text-2xl mb-2 opacity-70">{categoryEmoji(c.slug)}</div>
              <div className="font-semibold text-text group-hover:text-brand transition-colors">
                {c.name}
              </div>
              <div className="font-mono text-[11px] text-text-mute mt-1">
                {c.server_count} servers
              </div>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="px-6 md:px-10 py-12 max-w-6xl mx-auto">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-bold text-2xl md:text-3xl tracking-tight">Featured</h2>
            <Link href="/browse" className="text-text-dim hover:text-brand font-mono text-[12px]">view all →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {featured.map((s) => <ServerCard key={s.full_name} s={s} />)}
          </div>
        </section>
      )}

      <section className="px-6 md:px-10 py-16 max-w-5xl mx-auto">
        <h2 className="font-bold text-2xl md:text-3xl tracking-tight text-center mb-12">
          From discovery to install in 10 seconds
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Step n="01" title="Find" body="Search by capability or browse curated categories. Each server is auto-tagged by Claude." />
          <Step n="02" title="Inspect" body="Read the AI-generated summary, GitHub stars, license and last-commit signal." />
          <Step n="03" title="Install" body="Copy the JSON snippet for Claude Desktop, Cursor or Cline. Paste, restart, done." />
        </div>
      </section>

      <footer className="px-6 md:px-10 py-10 border-t border-border mt-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <span className="font-mono text-[10px] text-text-mute">v0.1 · not affiliated with Anthropic</span>
          </div>
          <div className="flex gap-5 font-mono text-[12px] text-text-mute">
            <a href="https://github.com/Antoniojesus122/mcp-studio" target="_blank" rel="noopener noreferrer" className="hover:text-text">GitHub</a>
            <Link href="/browse" className="hover:text-text">Browse</Link>
            <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer" className="hover:text-text">About MCP</a>
          </div>
        </div>
      </footer>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-text font-bold text-2xl tracking-tight">{value.toLocaleString('en-US')}</span>
      <span className="text-text-mute uppercase tracking-widest text-[10px] mt-1">{label}</span>
    </div>
  )
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="font-mono text-[10px] text-brand tracking-widest mb-2">{n}</div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-text-dim text-sm leading-relaxed">{body}</p>
    </div>
  )
}

function categoryEmoji(slug: string): string {
  return {
    filesystem: '📁', search: '🔍', database: '🗄️', devtools: '🔧',
    'ai-tools': '🤖', productivity: '📅', cloud: '☁️', comms: '💬',
    finance: '💸', media: '🎨', iot: '🏠', misc: '🧩',
  }[slug] || '📦'
}
