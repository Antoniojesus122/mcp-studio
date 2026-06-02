'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { LANGS, LANG_COOKIE, LANG_LABEL, type Lang } from '@/lib/i18n'

interface Props {
  current: Lang
}

/**
 * Selector minimalista EN/ES.
 * Setea la cookie `mcps_lang` (1 año) y refresca el árbol React.
 */
export function LangSwitcher({ current }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function setLang(lang: Lang) {
    if (lang === current) return
    document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    startTransition(() => router.refresh())
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className={`inline-flex items-center bg-surface border border-border rounded-md p-0.5 font-mono text-[11px] ${
        pending ? 'opacity-60' : ''
      }`}
    >
      {LANGS.map((l) => {
        const active = l === current
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            aria-pressed={active}
            className={`px-2 py-0.5 rounded transition-colors ${
              active
                ? 'bg-brand text-bg'
                : 'text-text-mute hover:text-text'
            }`}
          >
            {LANG_LABEL[l]}
          </button>
        )
      })}
    </div>
  )
}
