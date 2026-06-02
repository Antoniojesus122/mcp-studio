'use client'

import { useState } from 'react'

interface Props {
  serverName: string
  installCommand: string | null
  installConfig: Record<string, unknown> | null
  fullName: string
}

type Tab = 'claude' | 'cursor' | 'cline' | 'continue' | 'cli'

const TABS: { id: Tab; label: string; path: string }[] = [
  { id: 'claude', label: 'Claude Desktop', path: '~/Library/Application Support/Claude/claude_desktop_config.json' },
  { id: 'cursor', label: 'Cursor', path: '~/.cursor/mcp.json' },
  { id: 'cline', label: 'Cline', path: 'VS Code → Cline settings' },
  { id: 'continue', label: 'Continue', path: '~/.continue/config.json' },
  { id: 'cli', label: 'CLI', path: 'Shell' },
]

export function InstallTabs({ serverName, installCommand, installConfig, fullName }: Props) {
  const [tab, setTab] = useState<Tab>('claude')
  const [copied, setCopied] = useState(false)

  const snippet = buildSnippet(tab, serverName, installCommand, installConfig, fullName)

  function copy() {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.id
                ? 'text-text border-b-2 border-brand bg-surface-2'
                : 'text-text-mute hover:text-text-dim'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-baseline justify-between mb-3 text-[11px] font-mono">
          <span className="text-text-mute">
            {TABS.find((t) => t.id === tab)?.path}
          </span>
          <button
            onClick={copy}
            className="text-brand hover:text-text transition-colors"
          >
            {copied ? '✓ copied' : 'copy'}
          </button>
        </div>
        <pre className="bg-bg-soft border border-border rounded-lg p-4 overflow-x-auto font-mono text-[12px] leading-relaxed">
          {snippet}
        </pre>

        {tab !== 'cli' && (
          <p className="font-mono text-[11px] text-text-mute mt-3">
            Open the config file, merge under <code className="text-text">mcpServers</code>, save and restart.
          </p>
        )}
      </div>
    </div>
  )
}

function buildSnippet(
  tab: Tab,
  serverName: string,
  installCommand: string | null,
  installConfig: Record<string, unknown> | null,
  fullName: string
): string {
  if (tab === 'cli') {
    return installCommand ?? `# No install command detected.\n# See https://github.com/${fullName} for installation instructions.`
  }

  // Default: same JSON shape for Claude / Cursor / Continue
  let config = installConfig as { mcpServers?: Record<string, unknown> } | null
  if (!config || !config.mcpServers) {
    // Fallback minimal
    config = {
      mcpServers: {
        [serverName]: {
          command: 'npx',
          args: [`-y`, `<package-from-${fullName}>`],
        },
      },
    }
  }
  return JSON.stringify(config, null, 2)
}
