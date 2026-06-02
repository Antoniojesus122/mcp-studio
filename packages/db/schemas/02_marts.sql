-- MCP Studio · Capa MARTS
-- Vistas listas para el frontend.

-- ============================================================================
-- marts.servers_public — los servers visibles, normalizados para el UI
-- ============================================================================
CREATE OR REPLACE VIEW marts.servers_public AS
SELECT
    s.id,
    s.full_name,
    s.owner,
    s.name,
    s.html_url,
    s.description,
    s.homepage,
    s.language,
    s.license,
    s.topics,
    s.tags,
    s.summary,
    s.category,
    c.name AS category_name,
    c.icon AS category_icon,
    s.stars,
    s.forks,
    s.open_issues,
    s.repo_created_at,
    s.repo_pushed_at,
    s.readme_excerpt,
    s.install_command,
    s.install_config,
    s.quality_score,
    s.is_featured,
    s.is_official,
    s.indexed_at,
    s.updated_at
FROM raw.servers s
LEFT JOIN raw.categories c ON c.slug = s.category
WHERE NOT s.is_hidden;

-- ============================================================================
-- marts.trending_weekly — top crecimiento de stars últimos 7 días
-- ============================================================================
CREATE OR REPLACE VIEW marts.trending_weekly AS
WITH ranges AS (
    SELECT
        sh.server_id,
        FIRST_VALUE(sh.stars) OVER (
            PARTITION BY sh.server_id ORDER BY sh.captured_at DESC
        ) AS stars_now,
        LAST_VALUE(sh.stars) OVER (
            PARTITION BY sh.server_id ORDER BY sh.captured_at
            ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) AS stars_then
    FROM raw.stars_history sh
    WHERE sh.captured_at >= CURRENT_DATE - INTERVAL '7 days'
),
diffs AS (
    SELECT DISTINCT server_id, stars_now - stars_then AS delta, stars_now
    FROM ranges
)
SELECT
    sp.*,
    d.delta AS stars_delta_7d
FROM diffs d
JOIN marts.servers_public sp ON sp.id = d.server_id
WHERE d.delta > 0
ORDER BY d.delta DESC, sp.stars DESC;

-- ============================================================================
-- marts.category_counts — número de servers por categoría
-- ============================================================================
CREATE OR REPLACE VIEW marts.category_counts AS
SELECT
    c.slug,
    c.name,
    c.icon,
    c.sort_order,
    COUNT(s.id)::int AS server_count
FROM raw.categories c
LEFT JOIN raw.servers s ON s.category = c.slug AND NOT s.is_hidden
GROUP BY c.slug, c.name, c.icon, c.sort_order
ORDER BY c.sort_order;

-- ============================================================================
-- marts.language_counts — número de servers por lenguaje
-- ============================================================================
CREATE OR REPLACE VIEW marts.language_counts AS
SELECT
    COALESCE(language, 'Other') AS language,
    COUNT(*)::int AS server_count
FROM raw.servers
WHERE NOT is_hidden
GROUP BY COALESCE(language, 'Other')
ORDER BY server_count DESC;

-- ============================================================================
-- marts.global_stats — KPIs para landing
-- ============================================================================
CREATE OR REPLACE VIEW marts.global_stats AS
SELECT
    (SELECT COUNT(*) FROM raw.servers WHERE NOT is_hidden)::int      AS total_servers,
    (SELECT SUM(stars)::int FROM raw.servers WHERE NOT is_hidden)    AS total_stars,
    (SELECT COUNT(DISTINCT category) FROM raw.servers
        WHERE NOT is_hidden AND category IS NOT NULL)::int           AS total_categories,
    (SELECT COUNT(DISTINCT language) FROM raw.servers
        WHERE NOT is_hidden AND language IS NOT NULL)::int           AS total_languages,
    (SELECT MAX(finished_at) FROM raw.crawls WHERE status = 'ok')    AS last_crawl_at;

-- ============================================================================
-- marts.search · función helper de full-text + trigram
-- Búsqueda fuzzy por name/summary/description con ranking por stars
-- ============================================================================
CREATE OR REPLACE FUNCTION marts.search_servers(
    q TEXT,
    cat TEXT DEFAULT NULL,
    lang TEXT DEFAULT NULL,
    p_limit INT DEFAULT 24,
    p_offset INT DEFAULT 0
)
RETURNS SETOF marts.servers_public AS $$
    SELECT s.*
      FROM marts.servers_public s
     WHERE (q = '' OR q IS NULL OR
            s.name % q OR
            s.description % q OR
            s.summary % q OR
            EXISTS (SELECT 1 FROM unnest(s.tags)   t WHERE t ILIKE '%' || q || '%') OR
            EXISTS (SELECT 1 FROM unnest(s.topics) t WHERE t ILIKE '%' || q || '%'))
       AND (cat IS NULL  OR s.category = cat)
       AND (lang IS NULL OR s.language = lang)
     ORDER BY
        s.is_featured DESC,
        CASE WHEN q IS NULL OR q = '' THEN 0 ELSE
            GREATEST(
                COALESCE(similarity(s.name, q), 0),
                COALESCE(similarity(s.summary, q), 0) * 0.7,
                COALESCE(similarity(s.description, q), 0) * 0.5
            )
        END DESC,
        s.stars DESC
     LIMIT p_limit OFFSET p_offset;
$$ LANGUAGE sql STABLE;
