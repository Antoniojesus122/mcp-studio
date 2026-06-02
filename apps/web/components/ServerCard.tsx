import Link from 'next/link'

export interface ServerCardData {
  full_name: string
  owner: string
  name: string
  summary: string | null
  description: string | null
  language: string | null
  stars: number
  category: string | null
  category_name: string | null
  is_official: boolean
}

export function ServerCard({ s }: { s: ServerCardData }) {
  return (
    <Link
      href={`/server/${s.owner}/${s.name}`}
      className="group bg-surface border border-border rounded-xl p-4 hover:border-brand/60 hover:bg-surface-2 transition-all flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-text truncate group-hover:text-brand transition-colors">
            {s.name}
          </div>
          <div className="font-mono text-[11px] text-text-mute truncate mt-0.5">
            {s.owner}
            {s.is_official && (
              <span className="ml-2 text-[10px] uppercase tracking-wider text-brand">official</span>
            )}
          </div>
        </div>
        <div className="font-mono text-[12px] text-text-dim shrink-0 flex items-center gap-1">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .587l3.668 7.568L24 9.75l-6 5.847L19.336 24 12 20.014 4.664 24 6 15.597 0 9.75l8.332-1.595z"/></svg>
          {formatStars(s.stars)}
        </div>
      </div>

      <p className="text-[13px] text-text-dim line-clamp-2 leading-snug">
        {s.summary || s.description || 'No description'}
      </p>

      <div className="flex items-center gap-2 mt-auto flex-wrap">
        {s.category_name && (
          <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-brand-soft text-brand">
            {s.category_name}
          </span>
        )}
        {s.language && (
          <span className="font-mono text-[10px] text-text-mute">{s.language}</span>
        )}
      </div>
    </Link>
  )
}

function formatStars(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(n)
}
