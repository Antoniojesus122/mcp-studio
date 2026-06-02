import Link from 'next/link'
import { query } from '@/lib/db'
import { Header } from '@/components/Header'
import { SearchBar } from '@/components/SearchBar'
import { ServerCard, type ServerCardData } from '@/components/ServerCard'
import { FloatingAskBot } from '@/components/FloatingAskBot'
import { getLang } from '@/lib/lang-server'
import { getDict } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 24

interface Category {
  slug: string
  name: string
  server_count: number
}
interface LanguageRow {
  language: string
  server_count: number
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; language?: string; page?: string }>
}) {
  const sp = await searchParams
  const q = (sp.q ?? '').trim()
  const category = sp.category || null
  const language = sp.language || null
  const page = Math.max(1, Number(sp.page) || 1)
  const offset = (page - 1) * PAGE_SIZE
  const lang = await getLang()
  const t = getDict(lang)

  let servers: ServerCardData[] = []
  let categories: Category[] = []
  let languages: LanguageRow[] = []
  let total = 0
  try {
    const [rows, cats, langs, count] = await Promise.all([
      query<ServerCardData>(
        `SELECT full_name, owner, name, summary, description, language, stars, category, category_name, is_official
           FROM marts.search_servers($1, $2, $3, $4, $5)`,
        [q, category, language, PAGE_SIZE, offset]
      ),
      query<Category>('SELECT slug, name, server_count FROM marts.category_counts WHERE server_count > 0'),
      query<LanguageRow>('SELECT language, server_count FROM marts.language_counts LIMIT 12'),
      query<{ c: string }>(
        `SELECT COUNT(*)::text AS c
           FROM marts.servers_public s
          WHERE ($1 = '' OR
                 s.name % $1 OR s.description % $1 OR s.summary % $1)
            AND ($2::text IS NULL OR s.category = $2)
            AND ($3::text IS NULL OR s.language = $3)`,
        [q, category, language]
      ),
    ])
    servers = rows
    categories = cats
    languages = langs
    total = Number(count[0]?.c ?? 0)
  } catch (e) {
    console.error('[browse] query failed', e)
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function buildHref(params: Partial<{ q: string; category: string | null; language: string | null; page: number }>) {
    const u = new URLSearchParams()
    const newQ = params.q !== undefined ? params.q : q
    const newCat = params.category !== undefined ? params.category : category
    const newLang = params.language !== undefined ? params.language : language
    const newPage = params.page !== undefined ? params.page : page
    if (newQ) u.set('q', newQ)
    if (newCat) u.set('category', newCat)
    if (newLang) u.set('language', newLang)
    if (newPage && newPage > 1) u.set('page', String(newPage))
    return `/browse${u.toString() ? '?' + u.toString() : ''}`
  }

  return (
    <main className="min-h-screen">
      <Header
        lang={lang}
        dict={t}
        middle={<SearchBar defaultValue={q} size="md" placeholder={t.search_placeholder} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 px-6 md:px-10 py-8 max-w-7xl mx-auto">
        {/* Sidebar filters */}
        <aside className="lg:sticky lg:top-6 self-start space-y-6">
          <div>
            <h3 className="font-mono text-[10px] text-text-mute uppercase tracking-widest mb-2">
              {t.browse_filter_category}
            </h3>
            <ul className="space-y-1">
              <li>
                <Link
                  href={buildHref({ category: null, page: 1 })}
                  className={`block px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                    !category ? 'bg-brand-soft text-brand' : 'text-text-dim hover:text-text hover:bg-surface'
                  }`}
                >
                  {t.browse_filter_all}{' '}
                  <span className="float-right font-mono text-[10px] text-text-mute">
                    {categories.reduce((s, c) => s + c.server_count, 0)}
                  </span>
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={buildHref({ category: c.slug, page: 1 })}
                    className={`block px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                      category === c.slug ? 'bg-brand-soft text-brand' : 'text-text-dim hover:text-text hover:bg-surface'
                    }`}
                  >
                    {c.name}
                    <span className="float-right font-mono text-[10px] text-text-mute">{c.server_count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-[10px] text-text-mute uppercase tracking-widest mb-2">
              {t.browse_filter_language}
            </h3>
            <ul className="space-y-1">
              <li>
                <Link
                  href={buildHref({ language: null, page: 1 })}
                  className={`block px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                    !language ? 'bg-brand-soft text-brand' : 'text-text-dim hover:text-text hover:bg-surface'
                  }`}
                >
                  {t.browse_filter_all_languages}
                </Link>
              </li>
              {languages.map((l) => (
                <li key={l.language}>
                  <Link
                    href={buildHref({ language: l.language, page: 1 })}
                    className={`block px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                      language === l.language ? 'bg-brand-soft text-brand' : 'text-text-dim hover:text-text hover:bg-surface'
                    }`}
                  >
                    {l.language}
                    <span className="float-right font-mono text-[10px] text-text-mute">{l.server_count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Results */}
        <section>
          <div className="flex items-baseline justify-between mb-5">
            <h1 className="font-bold text-2xl tracking-tight">
              {q ? <>{t.browse_results_for(q)}</> : t.browse_all_title}
            </h1>
            <span className="font-mono text-[11px] text-text-mute">{t.servers_count(total)}</span>
          </div>

          {servers.length === 0 ? (
            <div className="bg-surface border border-dashed border-border rounded-2xl p-12 text-center">
              <div className="font-mono text-[10px] text-brand uppercase tracking-widest mb-2">
                {t.browse_no_results_eyebrow}
              </div>
              <p className="text-text-dim">{t.browse_no_results_body}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {servers.map((s) => (
                <ServerCard key={s.full_name} s={s} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-between gap-3 flex-wrap">
              <span className="font-mono text-[11px] text-text-mute">
                {t.browse_pagination_range(offset + 1, Math.min(offset + PAGE_SIZE, total), total)}
              </span>
              <div className="flex items-center gap-1">
                {page > 1 && (
                  <Link
                    href={buildHref({ page: page - 1 })}
                    scroll={false}
                    className="px-3 py-1.5 rounded-lg border border-border text-text-dim hover:text-text hover:bg-surface font-mono text-[11px]"
                  >
                    {t.browse_pagination_prev}
                  </Link>
                )}
                <span className="font-mono text-[11px] text-text-dim px-2">
                  {t.browse_pagination_page_of(page, totalPages)}
                </span>
                {page < totalPages && (
                  <Link
                    href={buildHref({ page: page + 1 })}
                    scroll={false}
                    className="px-3 py-1.5 rounded-lg border border-border text-text-dim hover:text-text hover:bg-surface font-mono text-[11px]"
                  >
                    {t.browse_pagination_next}
                  </Link>
                )}
              </div>
            </nav>
          )}
        </section>
      </div>

      {/* Floating bot → /ask, solo en /browse */}
      <FloatingAskBot label={t.fab_ask} />
    </main>
  )
}
