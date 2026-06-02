"""Lógica del crawler:
1. Buscar repos MCP por topic en GitHub.
2. Para cada uno, traer README y categorizar.
3. UPSERT en raw.servers + snapshot de stars en raw.stars_history.
4. Registrar la ejecución en raw.crawls.
"""

import re
from datetime import datetime
from typing import Any

from loguru import logger
from psycopg.types.json import Jsonb
from sqlalchemy import text

from mcp_crawler.classifier import classify_server
from mcp_crawler.db import engine, fetch_all, fetch_one
from mcp_crawler.github import get_readme, search_all_mcp_repos


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _readme_excerpt(readme: str | None, max_len: int = 600) -> str | None:
    """Saca un excerpt limpio (sin badges ni HTML excesivo)."""
    if not readme:
        return None
    lines = readme.split("\n")
    cleaned: list[str] = []
    for line in lines:
        if line.strip().startswith("#"):
            continue
        # Quitar imágenes/badges
        if re.match(r"^\s*!\[", line) or "shields.io" in line:
            continue
        if re.match(r"^\s*<", line):
            continue
        if not line.strip():
            continue
        cleaned.append(line.strip())
        if sum(len(c) for c in cleaned) > max_len:
            break
    return " ".join(cleaned)[:max_len]


def _extract_install_command(readme: str | None) -> str | None:
    """Busca el primer bloque tipo `npm i ...`, `pip install ...`, `uvx ...`, etc."""
    if not readme:
        return None
    patterns = [
        r"(npm (?:install|i) [^\n`]+)",
        r"(npm install -g [^\n`]+)",
        r"(npx [^\n`]+)",
        r"(pip install [^\n`]+)",
        r"(pipx install [^\n`]+)",
        r"(uvx [^\n`]+)",
        r"(uv tool install [^\n`]+)",
        r"(docker run [^\n`]+)",
    ]
    for p in patterns:
        m = re.search(p, readme)
        if m:
            return m.group(1).strip()
    return None


def _build_install_config(server: dict[str, Any]) -> dict[str, Any] | None:
    """Construye el snippet de claude_desktop_config.json si podemos."""
    cmd = server.get("install_command") or ""
    name = server["name"]

    # npx / npm
    if cmd.startswith("npx "):
        args = cmd.removeprefix("npx ").strip().split()
        return {
            "mcpServers": {
                name: {"command": "npx", "args": args}
            }
        }
    if cmd.startswith("uvx "):
        args = cmd.removeprefix("uvx ").strip().split()
        return {
            "mcpServers": {
                name: {"command": "uvx", "args": args}
            }
        }
    return None


def _quality_score(repo: dict[str, Any], readme: str | None) -> int:
    """Heurística simple 0-100 para ordenar/featured."""
    score = 0
    if (repo.get("stargazers_count") or 0) >= 10:
        score += 20
    if (repo.get("stargazers_count") or 0) >= 100:
        score += 20
    if repo.get("license") and repo["license"].get("spdx_id"):
        score += 10
    if repo.get("description"):
        score += 10
    if readme and len(readme) > 500:
        score += 20
    if readme and "install" in (readme or "").lower():
        score += 10
    if repo.get("homepage"):
        score += 10
    return min(100, score)


# ---------------------------------------------------------------------------
# Main upsert
# ---------------------------------------------------------------------------
def _upsert_server(conn, repo: dict[str, Any], classification: dict[str, Any],
                   readme: str | None) -> tuple[str, bool]:
    """Inserta o actualiza un server. Retorna (status, was_new)."""
    full_name = repo["full_name"]
    is_official = full_name.lower().startswith("modelcontextprotocol/")

    license_id = (repo.get("license") or {}).get("spdx_id")

    server_for_config = {
        "name": repo["name"],
        "install_command": classification.get("install_command") or _extract_install_command(readme),
    }
    install_config = _build_install_config(server_for_config)

    # Detect prior existence to count "new"
    exists = fetch_one(
        "SELECT id FROM raw.servers WHERE full_name = :fn",
        {"fn": full_name},
    )
    was_new = not exists

    conn.execute(
        text(
            """INSERT INTO raw.servers (
                 full_name, owner, name, html_url, description, homepage, language,
                 license, topics, stars, forks, open_issues,
                 repo_created_at, repo_pushed_at,
                 readme_md, readme_excerpt, install_command, install_config,
                 category, tags, summary, quality_score,
                 classifier_provider,
                 is_official, indexed_at, updated_at
               )
               VALUES (
                 :full_name, :owner, :name, :html_url, :description, :homepage, :language,
                 :license, :topics, :stars, :forks, :open_issues,
                 :repo_created_at, :repo_pushed_at,
                 :readme_md, :readme_excerpt, :install_command, :install_config,
                 :category, :tags, :summary, :quality_score,
                 :classifier_provider,
                 :is_official, NOW(), NOW()
               )
               ON CONFLICT (full_name) DO UPDATE SET
                 owner               = EXCLUDED.owner,
                 name                = EXCLUDED.name,
                 html_url            = EXCLUDED.html_url,
                 description         = EXCLUDED.description,
                 homepage            = EXCLUDED.homepage,
                 language            = EXCLUDED.language,
                 license             = EXCLUDED.license,
                 topics              = EXCLUDED.topics,
                 stars               = EXCLUDED.stars,
                 forks               = EXCLUDED.forks,
                 open_issues         = EXCLUDED.open_issues,
                 repo_pushed_at      = EXCLUDED.repo_pushed_at,
                 readme_md           = COALESCE(EXCLUDED.readme_md, raw.servers.readme_md),
                 readme_excerpt      = COALESCE(EXCLUDED.readme_excerpt, raw.servers.readme_excerpt),
                 install_command     = COALESCE(EXCLUDED.install_command, raw.servers.install_command),
                 install_config      = COALESCE(EXCLUDED.install_config, raw.servers.install_config),
                 category            = EXCLUDED.category,
                 tags                = EXCLUDED.tags,
                 summary             = EXCLUDED.summary,
                 quality_score       = EXCLUDED.quality_score,
                 classifier_provider = EXCLUDED.classifier_provider,
                 is_official         = EXCLUDED.is_official,
                 updated_at          = NOW()"""
        ),
        {
            "full_name": full_name,
            "owner": repo["owner"]["login"],
            "name": repo["name"],
            "html_url": repo["html_url"],
            "description": repo.get("description"),
            "homepage": repo.get("homepage"),
            "language": repo.get("language"),
            "license": license_id,
            "topics": repo.get("topics", []),
            "stars": repo.get("stargazers_count", 0),
            "forks": repo.get("forks_count", 0),
            "open_issues": repo.get("open_issues_count", 0),
            "repo_created_at": _parse_iso(repo.get("created_at")),
            "repo_pushed_at": _parse_iso(repo.get("pushed_at")),
            "readme_md": readme,
            "readme_excerpt": _readme_excerpt(readme),
            "install_command": classification.get("install_command") or _extract_install_command(readme),
            "install_config": Jsonb(install_config) if install_config else None,
            "category": classification.get("category"),
            "tags": classification.get("tags", []),
            "summary": classification.get("summary"),
            "quality_score": _quality_score(repo, readme),
            "classifier_provider": classification.get("_provider"),
            "is_official": is_official,
        },
    )

    # Snapshot diario de stars
    conn.execute(
        text(
            """INSERT INTO raw.stars_history (server_id, captured_at, stars)
               VALUES (
                 (SELECT id FROM raw.servers WHERE full_name = :fn),
                 CURRENT_DATE,
                 :stars
               )
               ON CONFLICT (server_id, captured_at) DO UPDATE SET stars = EXCLUDED.stars"""
        ),
        {"fn": full_name, "stars": repo.get("stargazers_count", 0)},
    )

    return ("new" if was_new else "updated", was_new)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def run_crawl(limit: int | None = None) -> dict[str, Any]:
    """Ejecuta un crawl completo. Si limit, solo procesa N repos (útil para dev)."""
    logger.info("[crawl] starting")

    # Iniciar log
    with engine().begin() as conn:
        crawl_id = conn.execute(
            text(
                """INSERT INTO raw.crawls (status) VALUES ('started')
                   RETURNING id"""
            )
        ).scalar()
    assert crawl_id is not None

    new = 0
    updated = 0
    seen = 0
    try:
        repos = search_all_mcp_repos()
        items = list(repos.values())
        if limit:
            items = items[:limit]
        logger.info(f"[crawl] processing {len(items)} repos")

        for repo in items:
            seen += 1
            full_name = repo["full_name"]
            try:
                readme = get_readme(full_name)
                classification, provider = classify_server(
                    repo["name"],
                    repo.get("description"),
                    repo.get("topics", []),
                    readme,
                )
                classification["_provider"] = provider
                with engine().begin() as conn:
                    status, was_new = _upsert_server(conn, repo, classification, readme)
                if was_new:
                    new += 1
                else:
                    updated += 1
                logger.info(f"[crawl] {seen}/{len(items)} {full_name} · {status} · stars={repo.get('stargazers_count', 0)}")
            except Exception as e:
                logger.warning(f"[crawl] {full_name} failed: {e}")

        # Finalizar log
        with engine().begin() as conn:
            conn.execute(
                text(
                    """UPDATE raw.crawls
                          SET finished_at = NOW(),
                              servers_seen = :seen,
                              servers_new = :new,
                              servers_updated = :upd,
                              status = 'ok'
                        WHERE id = :id"""
                ),
                {"seen": seen, "new": new, "upd": updated, "id": crawl_id},
            )
    except Exception as e:
        logger.error(f"[crawl] failed: {e}")
        with engine().begin() as conn:
            conn.execute(
                text(
                    """UPDATE raw.crawls
                          SET finished_at = NOW(),
                              status = 'error',
                              error_message = :msg
                        WHERE id = :id"""
                ),
                {"msg": str(e)[:500], "id": crawl_id},
            )
        raise

    result = {"seen": seen, "new": new, "updated": updated, "crawl_id": int(crawl_id)}
    logger.info(f"[crawl] done · {result}")
    return result


# ---------------------------------------------------------------------------
# Reclassify
# ---------------------------------------------------------------------------
def reclassify_pending(limit: int | None = None) -> dict[str, Any]:
    """Re-clasifica servers que cayeron al fallback heurístico (o NULL).

    Usa el README ya cacheado en raw.servers.readme_md (no toca GitHub).
    Llama al provider actual del settings (gemini > groq > anthropic > heuristic).
    UPDATE solo los campos clasificatorios — el resto del row no se toca.

    Si `limit` es None, procesa todos los pendientes. Útil para reanudar.
    """
    sql = (
        """SELECT id, name, description, topics, readme_md, classifier_provider
             FROM raw.servers
            WHERE classifier_provider IS NULL
               OR classifier_provider = 'heuristic'
            ORDER BY stars DESC, indexed_at DESC"""
    )
    if limit:
        sql += f" LIMIT {int(limit)}"
    rows = fetch_all(sql)

    logger.info(f"[reclassify] {len(rows)} servers pending")
    if not rows:
        return {"updated": 0, "skipped": 0, "errors": 0, "by_provider": {}}

    updated = 0
    skipped = 0
    errors = 0
    by_provider: dict[str, int] = {}

    for i, row in enumerate(rows, start=1):
        sid = row["id"]
        name = row["name"]
        try:
            classification, provider = classify_server(
                name,
                row.get("description"),
                row.get("topics") or [],
                row.get("readme_md"),
            )

            # Si seguimos en heurístico (no hay key disponible para LLM), skip
            old_provider = row.get("classifier_provider")
            if provider == "heuristic" and old_provider in ("heuristic", None):
                skipped += 1
                if i % 25 == 0:
                    logger.info(f"[reclassify] {i}/{len(rows)} no LLM available, stopping early")
                # Si NUNCA hay LLM, no tiene sentido seguir
                if not _any_llm_available():
                    logger.warning(
                        "[reclassify] no LLM provider available (no API keys). Stopping."
                    )
                    break
                continue

            new_install_cmd = classification.get("install_command")

            with engine().begin() as conn:
                conn.execute(
                    text(
                        """UPDATE raw.servers
                              SET category            = :cat,
                                  tags                = :tags,
                                  summary             = :summary,
                                  install_command     = COALESCE(:install_cmd, install_command),
                                  classifier_provider = :provider,
                                  updated_at          = NOW()
                            WHERE id = :id"""
                    ),
                    {
                        "id": sid,
                        "cat": classification.get("category"),
                        "tags": classification.get("tags", []),
                        "summary": classification.get("summary"),
                        "install_cmd": new_install_cmd,
                        "provider": provider,
                    },
                )

            updated += 1
            by_provider[provider] = by_provider.get(provider, 0) + 1
            if i % 25 == 0 or i == len(rows):
                logger.info(
                    f"[reclassify] {i}/{len(rows)} {name} → {classification.get('category')} ({provider})"
                )
        except Exception as e:
            errors += 1
            logger.warning(f"[reclassify] {name} failed: {e}")

    result = {
        "updated": updated,
        "skipped": skipped,
        "errors": errors,
        "by_provider": by_provider,
        "total_pending": len(rows),
    }
    logger.info(f"[reclassify] done · {result}")
    return result


def _any_llm_available() -> bool:
    """Indica si hay al menos una API key de LLM configurada."""
    from mcp_crawler.config import settings as s
    return bool(s.google_api_key or s.groq_api_key or s.anthropic_api_key)
