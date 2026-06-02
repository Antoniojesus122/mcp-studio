<div align="center">

# 🧩 MCP Studio

### **The best place to discover, browse and install MCP servers.**

One-click install in Claude Desktop, Cursor, Cline, Continue and Zed.
Open source. Curated. Fast.

[**mcpstudio.dev →**](https://mcpstudio.dev) &nbsp; · &nbsp; [Submit a server](#submit-a-server) &nbsp; · &nbsp; [Self-host](#self-host)

---

</div>

## What is this?

The Model Context Protocol (MCP) is Anthropic's open standard for plugging tools and data into LLMs. Since its launch in late 2024 it has exploded — there are now **600+ public MCP servers** on GitHub. But finding them sucks: you bounce between Awesome lists, Discord screenshots, blog posts and READMEs.

**MCP Studio is the single place to discover them all.** Search, filter by capability, see the GitHub stars, copy the install command, paste into your Claude config. Done.

<div align="center">

> *"It's like the App Store for your AI agents."*

</div>

## Features

- 🔍 **Real-time search** across 600+ servers — by name, capability, language or tag.
- 🏷️ **Curated categories** — Filesystem, Search, Databases, DevTools, Productivity, AI tools, Cloud, Communication and more.
- ⚡ **One-click install** — copy the exact JSON snippet for Claude Desktop, or use the `claude://` deep link to add it instantly.
- 🤖 **AI-powered categorisation** — each server is auto-tagged using its README (powered by Claude).
- 📈 **Stars trending** — see which servers are getting popular *this week*.
- 🧠 **Quality signals** — last commit, open issues, license, README quality score.
- 🌍 **Multi-client** — works with Claude Desktop, Cursor, Cline, Continue, Zed, anything that speaks MCP.
- 📡 **Auto-updated** — the crawler indexes new servers every hour.

## Why not just use mcp.so / glama / the official directory?

| | MCP Studio | mcp.so | glama.ai | modelcontextprotocol.io |
|---|---|---|---|---|
| Free & open source | ✅ | ✅ | ❌ (commercial) | ✅ |
| One-click install | ✅ | ❌ | ⚠️ partial | ❌ |
| AI categorisation | ✅ | ❌ | ❌ | ❌ |
| Multi-client configs | ✅ | ❌ | ⚠️ | ❌ |
| Updated hourly | ✅ | ⚠️ daily | ⚠️ | manual |
| Quality signals | ✅ | ❌ | ❌ | ❌ |

## Stack

- **Frontend**: Next.js 16 (App Router) · TypeScript · Tailwind v4 · Framer Motion
- **Crawler**: Python 3.11 · Prefect 2 · GitHub REST + GraphQL · Claude API for categorisation
- **DB**: PostgreSQL (Supabase) with full-text search + trigram fuzzy match
- **Hosting**: Vercel (web · ISR) + Render (crawler with hourly cron)

## Self-host

```bash
git clone https://github.com/Antoniojesus122/mcp-studio.git
cd mcp-studio

# 1. Web
cd apps/web
npm install
cp .env.example .env.local  # fill in your keys
npm run dev

# 2. DB schemas (on your Supabase project)
psql $POSTGRES_URL -f packages/db/schemas/01_raw.sql
psql $POSTGRES_URL -f packages/db/schemas/02_marts.sql

# 3. Crawler
cd apps/crawler
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
python -m mcp_crawler.flows
```

## Submit a server

The crawler picks up any public GitHub repo whose **topic** includes `mcp-server` or `model-context-protocol`.

To get featured, add to your repo:
- Topic: `mcp-server`
- A clear `README.md` with installation instructions
- A short description in your repo settings
- A license

Or open a PR adding your server to [`packages/db/seeds/featured.yaml`](packages/db/seeds/featured.yaml).

## Roadmap

- [x] Crawler + categoriser
- [x] Browse + search + detail UI
- [x] One-click install for Claude Desktop
- [ ] One-click install for Cursor, Cline, Continue, Zed
- [ ] User submissions form
- [ ] "Verified" badge after running a test harness on each server
- [ ] Server-side MCP playground (try a server in browser before installing)
- [ ] RSS feed for new servers

## License

MIT — see [LICENSE](LICENSE).

---

<div align="center">

Built by [@Antoniojesus122](https://github.com/Antoniojesus122)
&nbsp;·&nbsp;
Not affiliated with Anthropic
&nbsp;·&nbsp;
[Open an issue](https://github.com/Antoniojesus122/mcp-studio/issues) for anything

</div>
