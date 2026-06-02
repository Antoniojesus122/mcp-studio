'use client'

import Link from 'next/link'

interface Props {
  label: string
}

/**
 * Floating action button — bottom-right, link a /ask.
 * Pulsa suave para llamar la atención.
 */
export function FloatingAskBot({ label }: Props) {
  return (
    <Link
      href="/ask"
      aria-label={label}
      title={label}
      className="group fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 pl-3 pr-4 h-12 rounded-full bg-brand text-bg shadow-lg shadow-brand/30 hover:shadow-brand/50 hover:scale-[1.03] transition-all"
    >
      <span className="relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-bg/15">
        {/* sparkle icon */}
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
          <circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" />
        </svg>
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-bg ring-2 ring-brand animate-pulse-soft" />
      </span>
      <span className="font-semibold text-sm hidden sm:inline whitespace-nowrap">
        {label}
      </span>
    </Link>
  )
}
