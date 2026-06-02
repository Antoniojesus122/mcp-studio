import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
})

const jetbrains = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://mcpstudio.dev'),
  title: {
    default: 'MCP Studio — Discover and install MCP servers',
    template: '%s · MCP Studio',
  },
  description:
    'The best place to discover, browse and install Model Context Protocol servers. One-click install in Claude Desktop, Cursor, Cline and Continue.',
  applicationName: 'MCP Studio',
  authors: [{ name: 'Antonio Jesús' }],
  keywords: [
    'MCP', 'Model Context Protocol', 'Claude', 'Anthropic', 'AI tools',
    'AI agents', 'Cursor', 'Cline', 'Continue', 'LLM tools',
  ],
  openGraph: {
    title: 'MCP Studio',
    description: 'Discover, browse and install MCP servers in one click.',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0c',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-text font-sans">{children}</body>
    </html>
  )
}
