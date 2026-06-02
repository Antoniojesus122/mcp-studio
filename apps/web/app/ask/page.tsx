import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { AskChat } from '@/components/AskChat'

export const metadata: Metadata = {
  title: 'Ask Studio · Find the right MCP server',
  description:
    "Tell Studio what you want to do — it'll recommend the right MCP server. Powered by Llama 3.3 + our curated index.",
}

export default function AskPage() {
  return (
    <main className="min-h-screen">
      <header className="px-6 md:px-10 py-6 flex items-center justify-between border-b border-border">
        <Logo size="md" />
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/browse" className="text-text-dim hover:text-text">Browse</Link>
          <a
            href="https://github.com/Antoniojesus122/mcp-studio"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-dim hover:text-text"
          >
            GitHub
          </a>
        </nav>
      </header>

      <section className="px-6 md:px-10 pt-12 md:pt-20 pb-16 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="font-mono text-[11px] text-brand uppercase tracking-widest mb-4">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand mr-2 align-middle animate-pulse-soft" />
            powered by Llama 3.3 70B + our index
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tighter leading-[1.05] mb-5">
            Tell Studio what you need.
          </h1>
          <p className="text-text-dim text-lg max-w-xl mx-auto leading-relaxed">
            Describe what you want to connect to Claude. We&apos;ll find the right MCP servers
            from our curated index of 600+ — with an explanation of why each one fits.
          </p>
        </div>

        <AskChat />

        <div className="mt-12 text-center font-mono text-[11px] text-text-mute">
          Studio is grounded on our index. It will not invent servers, follow off-topic prompts,
          or give general advice.
        </div>
      </section>
    </main>
  )
}
