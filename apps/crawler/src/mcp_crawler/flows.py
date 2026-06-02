"""Prefect flow del crawler.

Uso manual:
    python -m mcp_crawler.flows               → crawl completo
    python -m mcp_crawler.flows --limit 10    → solo primeros 10 (dev)
    python -m mcp_crawler.flows --serve       → schedule cada 1h
"""

import argparse
import sys

from loguru import logger
from prefect import flow, task

from mcp_crawler.crawler import run_crawl


@task(retries=2, retry_delay_seconds=60, log_prints=True)
def crawl_task(limit: int | None = None) -> dict:
    return run_crawl(limit=limit)


@flow(name="mcp-studio-crawl", log_prints=True)
def crawl_flow(limit: int | None = None) -> dict:
    return crawl_task(limit)


def _main() -> int:
    parser = argparse.ArgumentParser(description="MCP Studio crawler CLI")
    parser.add_argument("--limit", type=int, default=None, help="Solo procesar N repos (dev)")
    parser.add_argument(
        "--serve",
        action="store_true",
        help="Servir flow con schedule cada 1h",
    )
    args = parser.parse_args()

    if args.serve:
        logger.info("Serving mcp-studio-crawl every 1 hour")
        crawl_flow.serve(
            name="mcp-studio-crawl-hourly",
            interval=3600,
            tags=["mcp-studio"],
        )
        return 0

    result = crawl_flow(args.limit)
    logger.info(f"Done · {result}")
    return 0


if __name__ == "__main__":
    sys.exit(_main())
