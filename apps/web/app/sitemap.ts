import type { MetadataRoute } from 'next'
import { query } from '@/lib/db'

const SITE = 'https://mcpstudio.dev'

/**
 * Sitemap dinámico para Google/Bing.
 *
 * - Páginas estáticas: home, browse, ask
 * - Páginas por categoría: /browse?category=<slug>
 * - Páginas por server: /server/<owner>/<name> (top 1000 por stars, los que
 *   menos stars tienen casi no traen tráfico orgánico)
 *
 * Next.js cachea el resultado y lo regenera con cada deploy.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticUrls: MetadataRoute.Sitemap = [
    { url: SITE, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE}/browse`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE}/ask`, changeFrequency: 'weekly', priority: 0.7 },
  ]

  let servers: { owner: string; name: string; updated_at: string }[] = []
  let categories: { slug: string }[] = []
  try {
    servers = await query<{ owner: string; name: string; updated_at: string }>(
      `SELECT owner, name, updated_at::text
         FROM marts.servers_public
        ORDER BY stars DESC
        LIMIT 1000`
    )
    categories = await query<{ slug: string }>(
      'SELECT slug FROM marts.category_counts WHERE server_count > 0'
    )
  } catch (e) {
    console.error('[sitemap] query failed', e)
  }

  const categoryUrls: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE}/browse?category=${c.slug}`,
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  const serverUrls: MetadataRoute.Sitemap = servers.map((s) => ({
    url: `${SITE}/server/${s.owner}/${s.name}`,
    lastModified: new Date(s.updated_at),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticUrls, ...categoryUrls, ...serverUrls]
}
