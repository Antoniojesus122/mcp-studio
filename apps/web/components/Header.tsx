import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { LangSwitcher } from '@/components/LangSwitcher'
import type { Dict, Lang } from '@/lib/i18n'
import type { ReactNode } from 'react'

interface Props {
  lang: Lang
  dict: Dict
  /** Componente extra (ej. SearchBar en /browse). Si se pasa, va entre el logo y el nav. */
  middle?: ReactNode
  /** Borde inferior (true por defecto, salvo en landing) */
  bordered?: boolean
}

/** Header compartido por todas las páginas. Mantiene consistencia + el selector EN/ES. */
export function Header({ lang, dict, middle, bordered = true }: Props) {
  return (
    <header
      className={`px-6 md:px-10 py-6 flex items-center justify-between gap-4 ${
        bordered ? 'border-b border-border' : ''
      }`}
    >
      <Logo size="md" />
      {middle ? <div className="flex-1 max-w-md hidden md:block">{middle}</div> : null}
      <nav className="flex items-center gap-4 md:gap-6 text-sm">
        <Link href="/browse" className="text-text-dim hover:text-text">
          {dict.nav_browse}
        </Link>
        <Link href="/ask" className="text-text-dim hover:text-text">
          {dict.nav_ask}
        </Link>
        <a
          href="https://github.com/Antoniojesus122/mcp-studio"
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-dim hover:text-text hidden md:flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          {dict.nav_github}
        </a>
        <LangSwitcher current={lang} />
      </nav>
    </header>
  )
}
