'use client'

import Link from 'next/link'
import { useState } from 'react'

interface ServerLite {
  id: number
  full_name: string
  owner: string
  name: string
  summary: string | null
  description: string | null
  category: string | null
  language: string | null
  stars: number
}

interface ApiResponse {
  is_off_topic: boolean
  off_topic_reply: string | null
  answer: string
  recommendations: { server: ServerLite; reasoning: string }[]
}

const SUGGESTIONS = [
  'Read my emails from Gmail',
  'Connect Claude to my Postgres database',
  'Search the web with citations',
  'Manage my Notion workspace',
  'Run shell commands safely',
  'Read PDFs and summarise',
]

export function AskChat() {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ApiResponse | null>(null)

  async function ask(query: string) {
    const trimmed = query.trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    setResult(null)
    setQ(trimmed)
    try {
      const r = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: trimmed }),
      })
      if (r.status === 429) {
        setError('You\'re asking too fast. Wait a moment.')
        return
      }
      if (!r.ok) {
        const data = await r.json().catch(() => ({}))
        setError(data.message || 'Something went wrong.')
        return
      }
      const data = (await r.json()) as ApiResponse
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    ask(q)
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit}>
        <div className="flex items-center bg-surface border border-border rounded-2xl px-5 py-3 focus-within:border-brand transition-colors">
          <svg className="w-5 h-5 text-text-mute shrink-0 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. I need to read my Gmail with Claude"
            disabled={loading}
            maxLength={500}
            autoFocus
            className="flex-1 bg-transparent outline-none text-text placeholder:text-text-mute disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !q.trim()}
            className="ml-3 px-4 py-1.5 rounded-lg bg-brand text-bg font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand/90 transition-colors"
          >
            {loading ? '…' : 'Ask'}
          </button>
        </div>
      </form>

      {/* Suggestions cuando no hay resultado */}
      {!result && !loading && !error && (
        <div>
          <div className="font-mono text-[10px] text-text-mute uppercase tracking-widest mb-3">
            try
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="text-sm px-3 py-1.5 rounded-full bg-surface border border-border text-text-dim hover:text-text hover:border-brand/60 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="bg-surface border border-border rounded-2xl p-6 animate-pulse">
          <div className="h-3 bg-border rounded w-1/3 mb-3" />
          <div className="h-3 bg-border rounded w-2/3" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-surface border border-pink/40 rounded-2xl p-5">
          <div className="font-mono text-[10px] text-pink uppercase tracking-widest mb-2">error</div>
          <p className="text-text-dim">{error}</p>
        </div>
      )}

      {/* Off-topic */}
      {result && result.is_off_topic && (
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="font-mono text-[10px] text-brand uppercase tracking-widest mb-2">off-topic</div>
          <p className="text-text-dim leading-relaxed">
            {result.off_topic_reply ||
              "I can only help finding MCP servers. Try asking about what you'd like to connect to Claude."}
          </p>
        </div>
      )}

      {/* Answer + recommendations */}
      {result && !result.is_off_topic && (
        <div className="space-y-4">
          {result.answer && (
            <div className="bg-surface border border-border rounded-2xl p-6">
              <div className="font-mono text-[10px] text-brand uppercase tracking-widest mb-2">studio says</div>
              <p className="text-text leading-relaxed">{result.answer}</p>
            </div>
          )}

          {result.recommendations.length === 0 ? (
            <div className="bg-surface border border-dashed border-border rounded-2xl p-6 text-center">
              <p className="text-text-dim">
                No MCP server in our index matches that. Try{' '}
                <Link href="/browse" className="text-brand hover:underline">browse</Link> manually.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {result.recommendations.map((rec, i) => (
                <li key={rec.server.id}>
                  <Link
                    href={`/server/${rec.server.owner}/${rec.server.name}`}
                    className="block bg-surface border border-border rounded-2xl p-5 hover:border-brand/60 hover:bg-surface-2 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 font-mono text-[11px] text-text-mute mb-1">
                          <span className="text-brand">#{i + 1}</span>
                          <span>{rec.server.owner}/{rec.server.name}</span>
                          {rec.server.category && (
                            <span className="px-1.5 py-0.5 rounded bg-brand-soft text-brand uppercase tracking-wider text-[10px]">
                              {rec.server.category}
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg group-hover:text-brand transition-colors">
                          {rec.server.name}
                        </h3>
                      </div>
                      <span className="font-mono text-[11px] text-text-dim shrink-0">★ {rec.server.stars.toLocaleString()}</span>
                    </div>
                    <p className="text-text-dim text-sm leading-relaxed mb-2">
                      {rec.server.summary || rec.server.description}
                    </p>
                    <div className="font-mono text-[11px] text-cyan border-l-2 border-cyan/40 pl-3 italic">
                      → {rec.reasoning}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="pt-3 text-center">
            <button
              onClick={() => { setResult(null); setQ('') }}
              className="font-mono text-[12px] text-text-mute hover:text-text-dim"
            >
              ← ask another question
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
