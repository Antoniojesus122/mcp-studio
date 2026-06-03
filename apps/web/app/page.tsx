import Link from 'next/link'
import { query } from '@/lib/db'
import { Header } from '@/components/Header'
import { Logo } from '@/components/Logo'
import { SearchBar } from '@/components/SearchBar'
import { ServerCard, type ServerCardData } from '@/components/ServerCard'
import { getLang } from '@/lib/lang-server'
import { getDict } from '@/lib/i18n'

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
  const lang = await getLang()
  const t = getDict(lang)
  const numFmt = lang === 'es' ? 'es-ES' : 'en-US'

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

  // JSON-LD: WebSite + SearchAction → Google muestra una sitelinks searchbox
  // bajo el resultado de mcpstudio.dev en SERP.
  const ldJson = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MCP Studio',
    alternateName: 'mcp.studio',
    url: 'https://mcpstudio.dev',
    description:
      'Discover, browse and install Model Context Protocol (MCP) servers in one click.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://mcpstudio.dev/browse?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'MCP Studio',
      url: 'https://mcpstudio.dev',
    },
  }

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJson) }}
      />
      <Header lang={lang} dict={t} bordered={false} />

      <section className="px-6 md:px-10 pt-12 md:pt-24 pb-16 max-w-4xl mx-auto text-center">
        <div className="font-mono text-[11px] text-brand uppercase tracking-widest mb-4">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand mr-2 align-middle animate-pulse-soft" />
          {t.hero_eyebrow(stats?.total_servers?.toLocaleString(numFmt) ?? '—')}
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1.05] mb-6">
          {t.hero_title_a}{' '}
          <span style={{ color: 'var(--color-brand)' }}>{t.hero_title_b}</span>
          <br />
          {t.hero_title_c}
        </h1>
        <p className="text-text-dim text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          {t.hero_desc_a} <span className="text-text">Claude Desktop</span>,{' '}
          <span className="text-text">Cursor</span>, <span className="text-text">Cline</span> {t.hero_desc_and}{' '}
          <span className="text-text">Continue</span>.
        </p>
        <div className="max-w-xl mx-auto">
          <SearchBar autoFocus placeholder={t.search_placeholder} />
          <Link
            href="/ask"
            className="mt-4 inline-flex items-center gap-2 font-mono text-[12px] text-text-dim hover:text-brand transition-colors"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand animate-pulse-soft" />
            {t.hero_ask_cta}
          </Link>
        </div>
        {stats && (
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 md:gap-10 font-mono text-[12px] text-text-dim">
            <Stat label={t.kpi_servers} value={stats.total_servers} fmt={numFmt} />
            <Stat label={t.kpi_stars} value={stats.total_stars} fmt={numFmt} />
            <Stat label={t.kpi_categories} value={stats.total_categories} fmt={numFmt} />
            <Stat label={t.kpi_languages} value={stats.total_languages} fmt={numFmt} />
          </div>
        )}
      </section>

      <section className="px-6 md:px-10 py-12 max-w-6xl mx-auto">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-bold text-2xl md:text-3xl tracking-tight">{t.browse_by_capability}</h2>
          <Link href="/browse" className="text-text-dim hover:text-brand font-mono text-[12px]">
            {t.all_servers}
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/browse?category=${c.slug}`}
              className="group bg-surface border border-border rounded-xl p-5 hover:border-brand/60 hover:bg-surface-2 transition-all"
            >
              <div className="text-2xl mb-2 opacity-70">{categoryEmoji(c.slug)}</div>
              <div className="font-semibold text-text group-hover:text-brand transition-colors">{c.name}</div>
              <div className="font-mono text-[11px] text-text-mute mt-1">{t.servers_count(c.server_count)}</div>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="px-6 md:px-10 py-12 max-w-6xl mx-auto">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-bold text-2xl md:text-3xl tracking-tight">{t.featured}</h2>
            <Link href="/browse" className="text-text-dim hover:text-brand font-mono text-[12px]">
              {t.view_all}
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {featured.map((s) => (
              <ServerCard key={s.full_name} s={s} />
            ))}
          </div>
        </section>
      )}

      <section className="px-6 md:px-10 py-16 max-w-5xl mx-auto">
        <h2 className="font-bold text-2xl md:text-3xl tracking-tight text-center mb-12">{t.how_title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Step n="01" title={t.step1_title} body={t.step1_body} />
          <Step n="02" title={t.step2_title} body={t.step2_body} />
          <Step n="03" title={t.step3_title} body={t.step3_body} />
        </div>
      </section>

      <footer className="px-6 md:px-10 py-10 border-t border-border mt-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <span className="font-mono text-[10px] text-text-mute">{t.footer_disclaimer}</span>
          </div>
          <div className="flex gap-5 font-mono text-[12px] text-text-mute">
            <a
              href="https://github.com/Antoniojesus122/mcp-studio"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text"
            >
              {t.nav_github}
            </a>
            <Link href="/browse" className="hover:text-text">
              {t.nav_browse}
            </Link>
            <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer" className="hover:text-text">
              {t.footer_about_mcp}
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}

function Stat({ label, value, fmt }: { label: string; value: number; fmt: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-text font-bold text-2xl tracking-tight">{value.toLocaleString(fmt)}</span>
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
  return (
    {
      filesystem: '📁',
      search: '🔍',
      database: '🗄️',
      devtools: '🔧',
      'ai-tools': '🤖',
      productivity: '📅',
      cloud: '☁️',
      comms: '💬',
      finance: '💸',
      media: '🎨',
      iot: '🏠',
      misc: '🧩',
    }[slug] || '📦'
  )
}
