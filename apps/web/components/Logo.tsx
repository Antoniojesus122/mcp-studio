import Link from 'next/link'

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const map = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  }
  return (
    <Link href="/" className={`font-extrabold tracking-tighter ${map[size]} inline-flex items-center gap-2 group`}>
      <span
        className="inline-block w-5 h-5 rounded-md border border-brand/60 relative"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,119,51,0.4), rgba(166,226,46,0.15))',
        }}
      >
        <span className="absolute inset-[3px] rounded-sm bg-brand/80 group-hover:bg-brand transition-colors" />
      </span>
      <span>
        <span className="text-text">mcp</span>
        <span className="text-brand">.</span>
        <span className="text-text-dim">studio</span>
      </span>
    </Link>
  )
}
