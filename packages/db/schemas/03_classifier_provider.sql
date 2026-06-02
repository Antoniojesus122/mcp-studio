-- MCP Studio · migration
-- Añadir columna para trackear qué clasificador procesó cada server.
-- Permite identificar rows que cayeron al fallback heurístico y re-clasificarlos.

ALTER TABLE raw.servers
    ADD COLUMN IF NOT EXISTS classifier_provider TEXT;

CREATE INDEX IF NOT EXISTS idx_servers_classifier
    ON raw.servers (classifier_provider)
    WHERE classifier_provider IS NULL OR classifier_provider = 'heuristic';
