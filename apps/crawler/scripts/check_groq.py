#!/usr/bin/env python3
"""Verifica que GROQ_API_KEY funciona sin lanzar el crawler entero.

Uso (desde apps/crawler con venv activado):
    python scripts/check_groq.py
"""

import sys

import httpx

# Reutilizamos el loader del crawler (pydantic-settings lee .env por debajo)
from mcp_crawler.config import settings

key = (settings.groq_api_key or "").strip()
if not key:
    print("❌ GROQ_API_KEY no está en .env (o no se ha podido leer)")
    sys.exit(1)

# Saneo: detectar comillas pegadas
if key.startswith(('"', "'")) or key.endswith(('"', "'")):
    print(f"⚠️  Tu key empieza o termina con comillas → ({key[0]!r} … {key[-1]!r}).")
    print("   Quita las comillas del valor en .env (debe ser solo `KEY=gsk_...`).")

print(f"→ key length: {len(key)} chars · starts with: {key[:6]}…")
print("→ Llamando a Groq /models...")

try:
    r = httpx.get(
        "https://api.groq.com/openai/v1/models",
        headers={"Authorization": f"Bearer {key}"},
        timeout=10.0,
    )
    if r.status_code == 200:
        models = r.json().get("data", [])
        print(f"✅ Conectado · {len(models)} modelos disponibles")
        llama = [m["id"] for m in models if "llama-3.3-70b" in m["id"]]
        if llama:
            print(f"   modelo recomendado: {llama[0]}")
    elif r.status_code == 401:
        print(f"❌ 401 Invalid API Key")
        print(f"   body: {r.text[:300]}")
        print()
        print("Cosas a comprobar:")
        print("  · Saca una key NUEVA en: https://console.groq.com/keys")
        print("  · Verifica que empieza por `gsk_`")
        print("  · En .env debe ir SIN comillas: GROQ_API_KEY=gsk_xxx")
    else:
        print(f"❌ {r.status_code}: {r.text[:300]}")
except Exception as e:
    print(f"❌ Error de red: {e}")
