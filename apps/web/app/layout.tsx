import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { getLang } from '@/lib/lang-server'
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

const DESC =
  'Discover, browse and install Model Context Protocol (MCP) servers in one click. ' +
  '1,470+ servers indexed and AI-categorised. Works with Claude Desktop, Cursor, Cline & Continue.'

export const metadata: Metadata = {
  metadataBase: new URL('https://mcpstudio.dev'),
  title: {
    default: 'MCP Studio — The App Store for your AI agents',
    template: '%s · MCP Studio',
  },
  description: DESC,
  applicationName: 'MCP Studio',
  authors: [{ name: 'Antonio Jesús', url: 'https://github.com/Antoniojesus122' }],
  creator: 'Antonio Jesús',
  publisher: 'MCP Studio',
  category: 'technology',
  keywords: [
    'MCP', 'Model Context Protocol', 'MCP server', 'MCP servers',
    'Claude', 'Claude Desktop', 'Anthropic', 'Cursor', 'Cline', 'Continue',
    'AI tools', 'AI agents', 'LLM tools', 'developer tools',
    'agentic AI', 'tool use', 'function calling', 'MCP registry',
  ],
  alternates: {
    canonical: 'https://mcpstudio.dev',
    languages: {
      en: 'https://mcpstudio.dev',
      es: 'https://mcpstudio.dev',
    },
  },
  openGraph: {
    title: 'MCP Studio — The App Store for your AI agents',
    description: DESC,
    url: 'https://mcpstudio.dev',
    siteName: 'MCP Studio',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MCP Studio — The App Store for your AI agents',
    description: DESC,
    creator: '@Antoniojesus122',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0c',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang()
  return (
    <html lang={lang} className={`${inter.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-text font-sans">{children}</body>
    </html>
  )
}
