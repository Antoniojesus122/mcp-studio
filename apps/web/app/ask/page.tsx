import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { AskChat } from '@/components/AskChat'
import { getLang } from '@/lib/lang-server'
import { getDict, askChatDictFrom } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'Ask Studio · Find the right MCP server',
  description:
    "Tell Studio what you want to do — it'll recommend the right MCP server. Powered by Llama 3.3 + our curated index.",
}

export default async function AskPage() {
  const lang = await getLang()
  const t = getDict(lang)

  return (
    <main className="min-h-screen">
      <Header lang={lang} dict={t} />

      <section className="px-6 md:px-10 pt-12 md:pt-20 pb-16 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="font-mono text-[11px] text-brand uppercase tracking-widest mb-4">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand mr-2 align-middle animate-pulse-soft" />
            {t.ask_eyebrow}
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tighter leading-[1.05] mb-5">
            {t.ask_title}
          </h1>
          <p className="text-text-dim text-lg max-w-xl mx-auto leading-relaxed">
            {t.ask_desc}
          </p>
        </div>

        <AskChat dict={askChatDictFrom(t)} />

        <div className="mt-12 text-center font-mono text-[11px] text-text-mute">
          {t.ask_disclaimer}
        </div>
      </section>
    </main>
  )
}
