"""Cliente de GitHub REST + GraphQL para buscar repos MCP y traer su metadata."""

import base64
from typing import Any

import httpx
from loguru import logger

from mcp_crawler.config import settings

REST_BASE = "https://api.github.com"
GQL_URL = "https://api.github.com/graphql"

# Topics que vamos a recorrer. GitHub permite buscar por topic con `topic:`
# Si añades aquí, el crawler los pilla automáticamente.
MCP_TOPICS = [
    "mcp-server",
    "mcp",
    "model-context-protocol",
    "modelcontextprotocol",
    "claude-mcp",
]


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.github_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": settings.github_user_agent,
    }


def _gh_get(url: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    with httpx.Client(timeout=30.0) as client:
        r = client.get(url, params=params or {}, headers=_headers())
    if r.status_code != 200:
        raise RuntimeError(f"GitHub {url} → {r.status_code}: {r.text[:200]}")
    return r.json()


def search_repos_by_topic(topic: str, per_page: int = 100) -> list[dict[str, Any]]:
    """Devuelve hasta 1000 repos (GitHub limita la API de search) ordenados por stars."""
    results: list[dict[str, Any]] = []
    for page in range(1, 11):  # 10 pages x 100 = 1000 max
        data = _gh_get(
            f"{REST_BASE}/search/repositories",
            params={
                "q": f"topic:{topic}",
                "sort": "stars",
                "order": "desc",
                "per_page": per_page,
                "page": page,
            },
        )
        items = data.get("items", [])
        if not items:
            break
        results.extend(items)
        if len(items) < per_page:
            break
    logger.info(f"[github] topic={topic} · {len(results)} repos found")
    return results


def search_all_mcp_repos() -> dict[str, dict[str, Any]]:
    """Deduplica entre los varios topics. Retorna {full_name: repo}."""
    seen: dict[str, dict[str, Any]] = {}
    for topic in MCP_TOPICS:
        try:
            for repo in search_repos_by_topic(topic):
                if repo.get("fork"):
                    continue
                seen[repo["full_name"]] = repo
        except Exception as e:
            logger.warning(f"[github] topic={topic} failed: {e}")
    return seen


def get_readme(full_name: str) -> str | None:
    """Trae el README del repo (utf-8). Retorna None si no existe."""
    try:
        data = _gh_get(f"{REST_BASE}/repos/{full_name}/readme")
        content_b64 = data.get("content", "")
        return base64.b64decode(content_b64).decode("utf-8", errors="replace")
    except Exception as e:
        logger.warning(f"[github] readme {full_name} failed: {e}")
        return None
