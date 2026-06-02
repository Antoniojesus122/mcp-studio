-- MCP Studio · Capa RAW
-- Datos crudos del crawler.

CREATE SCHEMA IF NOT EXISTS raw;
CREATE SCHEMA IF NOT EXISTS marts;

-- Habilitar trigram para búsqueda fuzzy
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- raw.servers — un row por repo MCP indexado
-- ============================================================================
CREATE TABLE IF NOT EXISTS raw.servers (
    id                  BIGSERIAL   PRIMARY KEY,
    -- GitHub identity
    full_name           TEXT        NOT NULL UNIQUE,    -- "user/repo"
    owner               TEXT        NOT NULL,
    name                TEXT        NOT NULL,
    html_url            TEXT        NOT NULL,
    -- Metadata
    description         TEXT,
    homepage            TEXT,
    language            TEXT,                            -- main language (TS/Py/Rust/Go/...)
    license             TEXT,                            -- spdx id ej. "MIT", "Apache-2.0"
    topics              TEXT[]      DEFAULT '{}',
    -- Stats
    stars               INTEGER     NOT NULL DEFAULT 0,
    forks               INTEGER     NOT NULL DEFAULT 0,
    open_issues         INTEGER     NOT NULL DEFAULT 0,
    -- Timestamps from GitHub
    repo_created_at     TIMESTAMPTZ,
    repo_pushed_at      TIMESTAMPTZ,                     -- "última actividad"
    -- README and derived
    readme_md           TEXT,                            -- README en raw markdown
    readme_excerpt      TEXT,                            -- primeras N chars limpias
    install_command     TEXT,                            -- "npm i -g x" / "pip install x"
    install_config      JSONB,                           -- JSON listo para Claude Desktop
    -- Categorisation (LLM)
    category            TEXT,                            -- ej. "filesystem", "search", "db"
    tags                TEXT[]      DEFAULT '{}',
    summary             TEXT,                            -- one-line LLM summary
    quality_score       INTEGER,                         -- 0-100 heurística
    -- Status flags
    is_featured         BOOLEAN     NOT NULL DEFAULT FALSE,
    is_hidden           BOOLEAN     NOT NULL DEFAULT FALSE,
    is_official         BOOLEAN     NOT NULL DEFAULT FALSE, -- repos en modelcontextprotocol org
    -- House-keeping
    indexed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_servers_stars         ON raw.servers (stars DESC) WHERE NOT is_hidden;
CREATE INDEX IF NOT EXISTS idx_servers_pushed        ON raw.servers (repo_pushed_at DESC) WHERE NOT is_hidden;
CREATE INDEX IF NOT EXISTS idx_servers_category     ON raw.servers (category) WHERE NOT is_hidden;
CREATE INDEX IF NOT EXISTS idx_servers_language     ON raw.servers (language) WHERE NOT is_hidden;
CREATE INDEX IF NOT EXISTS idx_servers_topics       ON raw.servers USING GIN (topics);
CREATE INDEX IF NOT EXISTS idx_servers_tags         ON raw.servers USING GIN (tags);
-- Trigram para búsqueda fuzzy por nombre + summary
CREATE INDEX IF NOT EXISTS idx_servers_name_trgm    ON raw.servers USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_servers_summary_trgm ON raw.servers USING GIN (summary gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_servers_desc_trgm    ON raw.servers USING GIN (description gin_trgm_ops);

-- ============================================================================
-- raw.stars_history — snapshot diario de stars por server
-- (para "trending" semanal)
-- ============================================================================
CREATE TABLE IF NOT EXISTS raw.stars_history (
    server_id     BIGINT      NOT NULL REFERENCES raw.servers(id) ON DELETE CASCADE,
    captured_at   DATE        NOT NULL DEFAULT CURRENT_DATE,
    stars         INTEGER     NOT NULL,
    PRIMARY KEY (server_id, captured_at)
);

-- ============================================================================
-- raw.crawls — log de cada ejecución del crawler
-- ============================================================================
CREATE TABLE IF NOT EXISTS raw.crawls (
    id              BIGSERIAL   PRIMARY KEY,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at     TIMESTAMPTZ,
    servers_seen    INTEGER     DEFAULT 0,
    servers_new     INTEGER     DEFAULT 0,
    servers_updated INTEGER     DEFAULT 0,
    status          TEXT        NOT NULL DEFAULT 'started', -- started/ok/error
    error_message   TEXT
);

-- ============================================================================
-- raw.categories — diccionario de categorías
-- ============================================================================
CREATE TABLE IF NOT EXISTS raw.categories (
    slug          TEXT        PRIMARY KEY,
    name          TEXT        NOT NULL,
    description   TEXT,
    icon          TEXT,                                       -- nombre del icono lucide
    sort_order    INTEGER     NOT NULL DEFAULT 100
);

-- Seed inicial de categorías
INSERT INTO raw.categories (slug, name, description, icon, sort_order) VALUES
    ('filesystem',   'Filesystem',         'Acceso a archivos, carpetas y storage local.',           'folder',      10),
    ('search',       'Search & Web',       'Búsqueda web, scraping, fetch de páginas.',              'globe',       20),
    ('database',     'Databases',          'Postgres, MySQL, SQLite, MongoDB, vector DBs.',          'database',    30),
    ('devtools',     'Developer Tools',    'Git, GitHub, GitLab, CI/CD, linters, build tools.',      'wrench',      40),
    ('ai-tools',     'AI & LLM Tools',     'Generación de imágenes, vector search, embeddings.',     'sparkles',    50),
    ('productivity', 'Productivity',       'Calendar, email, notes, tasks, Notion, Slack.',          'calendar',    60),
    ('cloud',        'Cloud & Infra',      'AWS, GCP, Azure, Cloudflare, Docker, K8s.',              'cloud',       70),
    ('comms',        'Communication',      'Slack, Discord, Telegram, email, SMS.',                  'message-circle', 80),
    ('finance',      'Finance & Data',     'Stocks, crypto, accounting, business analytics.',         'trending-up', 90),
    ('media',        'Media & Files',      'Imágenes, video, audio, PDFs.',                          'image',       100),
    ('iot',          'IoT & Hardware',     'Home Assistant, dispositivos, automatización.',          'cpu',         110),
    ('misc',         'Other',              'Lo que no encaja en lo de arriba.',                      'box',         999)
ON CONFLICT (slug) DO NOTHING;
