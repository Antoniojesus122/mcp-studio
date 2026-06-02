'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  defaultValue?: string
  placeholder?: string
  autoFocus?: boolean
  size?: 'lg' | 'md'
}

export function SearchBar({ defaultValue = '', placeholder = 'Search 600+ MCP servers…', autoFocus = false, size = 'lg' }: Props) {
  const router = useRouter()
  const [q, setQ] = useState(defaultValue)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    router.push(`/browse${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const cls = size === 'lg'
    ? 'h-14 text-[16px] px-5'
    : 'h-11 text-[14px] px-4'

  return (
    <form onSubmit={onSubmit} className="relative w-full">
      <div className={`flex items-center bg-surface border border-border rounded-xl ${cls} focus-within:border-brand transition-colors`}>
        <svg className="w-5 h-5 text-text-mute shrink-0 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <input
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-text placeholder:text-text-mute"
        />
        <kbd className="font-mono text-[10px] text-text-mute border border-border rounded px-1.5 py-0.5 ml-2 hidden md:inline">
          ⏎
        </kbd>
      </div>
    </form>
  )
}
