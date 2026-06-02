"""Categorización de servidores MCP usando Claude (con fallback heurístico).

Devuelve un dict por server con:
  - category: slug que existe en raw.categories
  - tags: lista de strings descriptivos
  - summary: una línea explicando qué hace
  - install_command: el comando de instalación si lo detecta
"""

import json
from typing import Any

from loguru import logger

from mcp_crawler.config import settings

CATEGORY_SLUGS = [
    "filesystem", "search", "database", "devtools", "ai-tools",
    "productivity", "cloud", "comms", "finance", "media", "iot", "misc",
]

SYSTEM_PROMPT = f"""You are categorising public MCP (Model Context Protocol) servers.
Given the name, description, topics and README of a GitHub repo that implements an MCP server,
return a JSON object with these exact keys:

  - category: one of [{', '.join(CATEGORY_SLUGS)}]
  - tags: 2-5 short lowercase strings (ej. "postgres", "vector-search", "web-scraping")
  - summary: ONE sentence in English explaining what the server lets an LLM do (max 140 chars)
  - install_command: the most likely install command (npm/pip/uvx/docker), or null if you cannot tell

Examples of categories:
  - filesystem: read/write files, dropbox, gdrive
  - search: web search, scraping, fetch URLs
  - database: postgres, mysql, sqlite, mongo, redis, vector db
  - devtools: git, github, gitlab, ci/cd, linters, terminal
  - ai-tools: image generation, embeddings, rag, agents
  - productivity: notion, calendar, email, slack, todo
  - cloud: aws, gcp, azure, cloudflare, docker, k8s
  - comms: messaging, sms, voice
  - finance: stocks, crypto, banking, accounting
  - media: image, video, audio, pdf processing
  - iot: home assistant, hardware control
  - misc: anything else

Respond with ONLY the JSON object, no markdown."""


def _heuristic_classify(name: str, description: str, topics: list[str]) -> dict[str, Any]:
    """Fallback sin LLM: keyword matching simple."""
    text = " ".join([name, description or "", *topics]).lower()

    rules: list[tuple[str, list[str]]] = [
        ("filesystem", ["filesystem", "files", "dropbox", "drive", "s3 ", "storage"]),
        ("search", ["search", "google", "brave", "web", "scrape", "crawl", "fetch"]),
        ("database", ["postgres", "mysql", "sqlite", "mongo", "redis", "qdrant", "weaviate", "vector"]),
        ("devtools", ["git", "github", "gitlab", "linter", "terminal", "shell"]),
        ("ai-tools", ["dall-e", "midjourney", "embedding", "rag", "agent"]),
        ("productivity", ["notion", "calendar", "email", "slack", "todo", "linear", "jira"]),
        ("cloud", ["aws", "gcp", "azure", "cloudflare", "docker", "kubernetes", "k8s"]),
        ("comms", ["sms", "twilio", "telegram", "discord", "whatsapp"]),
        ("finance", ["stock", "crypto", "trading", "bank", "stripe", "plaid"]),
        ("media", ["image", "video", "audio", "pdf", "ffmpeg"]),
        ("iot", ["home assistant", "iot", "hardware", "raspberry"]),
    ]
    for cat, kws in rules:
        if any(kw in text for kw in kws):
            return {
                "category": cat,
                "tags": [kw for kw in kws if kw in text][:3],
                "summary": (description or name)[:140],
                "install_command": None,
            }
    return {
        "category": "misc",
        "tags": [],
        "summary": (description or name)[:140],
        "install_command": None,
    }


def classify_server(
    name: str,
    description: str | None,
    topics: list[str],
    readme: str | None,
) -> dict[str, Any]:
    """Devuelve {category, tags, summary, install_command}.

    Si Anthropic está configurado, usa Claude. Si no, fallback heurístico.
    """
    if not settings.anthropic_api_key:
        return _heuristic_classify(name, description or "", topics)

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        readme_excerpt = (readme or "")[:6000]  # limitar tokens
        user_content = (
            f"name: {name}\n"
            f"description: {description or '(none)'}\n"
            f"topics: {', '.join(topics) or '(none)'}\n\n"
            f"README:\n{readme_excerpt}"
        )

        resp = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=512,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_content}],
        )
        # Pull JSON from the text response
        raw = ""
        for block in resp.content:
            if getattr(block, "type", None) == "text":
                raw += block.text
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.strip("`").lstrip("json").strip()

        data = json.loads(raw)
        # Sanitize
        if data.get("category") not in CATEGORY_SLUGS:
            data["category"] = "misc"
        data["tags"] = [str(t).lower() for t in (data.get("tags") or [])][:5]
        data["summary"] = (data.get("summary") or "")[:200]
        return data
    except Exception as e:
        logger.warning(f"[classifier] Claude failed for {name}, falling back: {e}")
        return _heuristic_classify(name, description or "", topics)
