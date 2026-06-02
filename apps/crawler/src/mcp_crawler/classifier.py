"""Categorización de servidores MCP — multi-provider.

Backends soportados (orden de preferencia con LLM_PROVIDER=auto):
  1. Gemini 2.0 Flash  (Google · 1500 req/día gratis)
  2. Groq Llama 3.3   (Groq · 14400 req/día gratis)
  3. Anthropic Claude  (de pago pero muy bueno)
  4. Heuristic         (sin LLM · siempre disponible)

Todos devuelven el mismo schema:
  {category, tags, summary, install_command}
"""

import json
from typing import Any

import httpx
from loguru import logger

from mcp_crawler.config import settings

CATEGORY_SLUGS = [
    "filesystem", "search", "database", "devtools", "ai-tools",
    "productivity", "cloud", "comms", "finance", "media", "iot", "misc",
]

PROMPT = f"""You are categorising public MCP (Model Context Protocol) servers.

Given the name, description, topics and README of a GitHub repo that implements an MCP server,
return a JSON object with these exact keys:

  - category: one of [{', '.join(CATEGORY_SLUGS)}]
  - tags: 2-5 short lowercase strings (ej. "postgres", "vector-search", "web-scraping")
  - summary: ONE sentence in English explaining what the server lets an LLM do (max 140 chars)
  - install_command: the most likely install command (npm/pip/uvx/docker), or null if you cannot tell

Examples:
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

Respond with ONLY the JSON object, no markdown, no code fences."""


def _build_user_content(name: str, description: str | None, topics: list[str], readme: str | None) -> str:
    return (
        f"name: {name}\n"
        f"description: {description or '(none)'}\n"
        f"topics: {', '.join(topics) or '(none)'}\n\n"
        f"README:\n{(readme or '')[:6000]}"
    )


def _parse_json_response(raw: str) -> dict[str, Any]:
    """Quita fences ```json``` y parsea. Sanitiza al schema esperado."""
    raw = raw.strip()
    if raw.startswith("```"):
        # Quitar primera línea (```json o ```) y última (```)
        lines = raw.split("\n")
        lines = lines[1:] if lines[0].startswith("```") else lines
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        raw = "\n".join(lines).strip()

    data = json.loads(raw)
    return _sanitize(data)


def _sanitize(data: dict[str, Any]) -> dict[str, Any]:
    if data.get("category") not in CATEGORY_SLUGS:
        data["category"] = "misc"
    data["tags"] = [str(t).lower() for t in (data.get("tags") or [])][:5]
    data["summary"] = (data.get("summary") or "")[:200]
    return data


# ---------------------------------------------------------------------------
# Heuristic fallback (sin LLM)
# ---------------------------------------------------------------------------
def _heuristic(name: str, description: str, topics: list[str]) -> dict[str, Any]:
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


# ---------------------------------------------------------------------------
# Provider implementations
# ---------------------------------------------------------------------------
def _classify_gemini(name: str, description: str | None, topics: list[str], readme: str | None) -> dict[str, Any]:
    """Google Gemini 2.0 Flash via google-genai SDK."""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.google_api_key)
    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=_build_user_content(name, description, topics, readme),
        config=types.GenerateContentConfig(
            system_instruction=PROMPT,
            response_mime_type="application/json",
            temperature=0.2,
            max_output_tokens=512,
        ),
    )
    return _parse_json_response(response.text or "")


def _classify_groq(name: str, description: str | None, topics: list[str], readme: str | None) -> dict[str, Any]:
    """Groq via REST (OpenAI-compatible). 1 retry en timeout."""
    payload = {
        "model": settings.groq_model,
        "messages": [
            {"role": "system", "content": PROMPT},
            {"role": "user", "content": _build_user_content(name, description, topics, readme)},
        ],
        "temperature": 0.2,
        "max_tokens": 512,
        "response_format": {"type": "json_object"},
    }
    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Content-Type": "application/json",
    }

    last_exc: Exception | None = None
    for attempt in range(2):
        try:
            with httpx.Client(timeout=60.0) as client:
                r = client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers=headers,
                    json=payload,
                )
            if r.status_code != 200:
                raise RuntimeError(f"Groq {r.status_code}: {r.text[:200]}")
            return _parse_json_response(r.json()["choices"][0]["message"]["content"])
        except httpx.ReadTimeout as e:
            last_exc = e
            logger.debug(f"[groq] timeout for {name}, retry {attempt + 1}")
        except Exception as e:
            # 401 / parse error / etc · no reintentamos
            raise e
    raise last_exc or RuntimeError("Groq timeout after retry")


def _classify_anthropic(name: str, description: str | None, topics: list[str], readme: str | None) -> dict[str, Any]:
    import anthropic

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    resp = client.messages.create(
        model=settings.anthropic_model,
        max_tokens=512,
        system=PROMPT,
        messages=[{"role": "user", "content": _build_user_content(name, description, topics, readme)}],
    )
    raw = "".join(b.text for b in resp.content if getattr(b, "type", None) == "text")
    return _parse_json_response(raw)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def classify_server(
    name: str,
    description: str | None,
    topics: list[str],
    readme: str | None,
) -> tuple[dict[str, Any], str]:
    """Devuelve ({category, tags, summary, install_command}, provider_used).

    `provider_used` ∈ {gemini, groq, anthropic, heuristic}.
    Si el provider primario peta o no hay LLM keys, cae a heuristic.
    """
    provider = settings.resolved_provider()

    if provider == "heuristic":
        return _heuristic(name, description or "", topics), "heuristic"

    try:
        if provider == "gemini":
            return _classify_gemini(name, description, topics, readme), "gemini"
        if provider == "groq":
            return _classify_groq(name, description, topics, readme), "groq"
        if provider == "anthropic":
            return _classify_anthropic(name, description, topics, readme), "anthropic"
    except Exception as e:
        logger.warning(f"[classifier] {provider} failed for {name}: {e}. Falling back to heuristic.")
        return _heuristic(name, description or "", topics), "heuristic"

    # Unreachable
    return _heuristic(name, description or "", topics), "heuristic"
