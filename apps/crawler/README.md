# mcp-crawler

Crawler Python que indexa servidores MCP desde GitHub a Postgres y los
categoriza con un LLM gratis (Groq Llama 3.3 70B por defecto).

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

cp .env.example .env  # rellena POSTGRES_URL, GITHUB_TOKEN, GROQ_API_KEY
```

## Uso

```bash
# Smoke test con 5 repos
python -m mcp_crawler.flows --limit 5

# Crawl completo (~600 servers, ~5-10 min)
python -m mcp_crawler.flows

# Servir el flow con schedule cada 1h
python -m mcp_crawler.flows --serve
```

## Cómo funciona

1. **Buscar** repos por topics (`mcp-server`, `mcp`, `model-context-protocol`, etc.)
2. **Fetch README** de cada repo
3. **Categorizar** con LLM (12 categorías: filesystem, database, devtools…)
   o heurística (fallback gratis)
4. **UPSERT** en `raw.servers` (idempotente vía `full_name` único)
5. **Snapshot diario** de stars en `raw.stars_history` para trending semanal
6. **Log** de cada ejecución en `raw.crawls`

## LLM providers

Definidos en `src/mcp_crawler/classifier.py` con preferencia auto:

| Provider | Env var | Free tier |
|---|---|---|
| Gemini 2.0 Flash | `GOOGLE_API_KEY` | 1500 req/día |
| Groq Llama 3.3 70B ★ | `GROQ_API_KEY` | 14.4k req/día |
| Anthropic Claude | `ANTHROPIC_API_KEY` | ~$5 todo |
| Heuristic | (ninguno) | ∞ |
