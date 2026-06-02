/**
 * MCP Studio — i18n minimal.
 *
 * Estrategia: cookie `mcps_lang` (en|es) leída server-side en cada page,
 * pasada como prop `dict` al render. El LangSwitcher (client) cambia
 * la cookie y hace router.refresh() → todo se re-renderiza en el idioma.
 *
 * Sin libs externas, sin /es prefix. Type-safe.
 */

export type Lang = 'en' | 'es'

export const LANGS: Lang[] = ['en', 'es']
export const DEFAULT_LANG: Lang = 'en'
export const LANG_COOKIE = 'mcps_lang'

export const LANG_LABEL: Record<Lang, string> = {
  en: 'EN',
  es: 'ES',
}

const en = {
  // Topbar / nav
  nav_browse: 'Browse',
  nav_ask: 'Ask',
  nav_github: 'GitHub',

  // Landing — hero
  hero_eyebrow: (n: number | string) => `updated hourly · ${n} MCP servers indexed`,
  hero_title_a: 'The',
  hero_title_b: 'App Store',
  hero_title_c: 'for your AI agents.',
  hero_desc_a: 'Discover, browse and install Model Context Protocol servers in one click. Works with',
  hero_desc_and: 'and',
  hero_ask_cta: 'or ask in plain English →',
  search_placeholder: 'Search 600+ MCP servers…',

  // KPI labels
  kpi_servers: 'servers',
  kpi_stars: 'total stars',
  kpi_categories: 'categories',
  kpi_languages: 'languages',

  // Sections
  browse_by_capability: 'Browse by capability',
  all_servers: 'all servers →',
  servers_count: (n: number) => `${n} servers`,
  featured: 'Featured',
  view_all: 'view all →',

  // How it works
  how_title: 'From discovery to install in 10 seconds',
  step1_title: 'Find',
  step1_body: 'Search by capability or browse curated categories. Each server is auto-tagged by Claude.',
  step2_title: 'Inspect',
  step2_body: 'Read the AI-generated summary, GitHub stars, license and last-commit signal.',
  step3_title: 'Install',
  step3_body: 'Copy the JSON snippet for Claude Desktop, Cursor or Cline. Paste, restart, done.',

  // Footer
  footer_about_mcp: 'About MCP',
  footer_disclaimer: 'v0.1 · not affiliated with Anthropic',

  // Browse
  browse_filter_category: 'Category',
  browse_filter_language: 'Language',
  browse_filter_all: 'All',
  browse_filter_all_languages: 'All languages',
  browse_results_for: (q: string) => `Results for "${q}"`,
  browse_all_title: 'All MCP servers',
  browse_no_results_eyebrow: 'no results',
  browse_no_results_body: 'Try a different query or category.',
  browse_pagination_range: (a: number, b: number, total: number) =>
    `${a.toLocaleString()}–${b.toLocaleString()} of ${total.toLocaleString()}`,
  browse_pagination_prev: '← prev',
  browse_pagination_next: 'next →',
  browse_pagination_page_of: (p: number, t: number) => `page ${p} of ${t}`,

  // Ask
  ask_eyebrow: 'powered by Llama 3.3 70B + our index',
  ask_title: 'Tell Studio what you need.',
  ask_desc:
    "Describe what you want to connect to Claude. We'll find the right MCP servers from our curated index of 600+ — with an explanation of why each one fits.",
  ask_disclaimer:
    'Studio is grounded on our index. It will not invent servers, follow off-topic prompts, or give general advice.',
  ask_input_placeholder: 'e.g. I need to read my Gmail with Claude',
  ask_button: 'Ask',
  ask_try: 'try',
  ask_suggestions: [
    'Read my emails from Gmail',
    'Connect Claude to my Postgres database',
    'Search the web with citations',
    'Manage my Notion workspace',
    'Run shell commands safely',
    'Read PDFs and summarise',
  ],
  ask_off_topic_default:
    "I can only help finding MCP servers. Try asking about what you'd like to connect to Claude.",
  ask_studio_says: 'studio says',
  ask_no_match_a: 'No MCP server in our index matches that. Try',
  ask_no_match_browse: 'browse',
  ask_no_match_b: 'manually.',
  ask_another: '← ask another question',
  ask_error: 'error',
  ask_off_topic_eyebrow: 'off-topic',
  ask_generic_error: 'Something went wrong.',
  ask_network_error: 'Network error',

  // FAB
  fab_ask: 'Ask Studio',
}

const es: typeof en = {
  nav_browse: 'Explorar',
  nav_ask: 'Pregunta',
  nav_github: 'GitHub',

  hero_eyebrow: (n) => `actualizado cada hora · ${n} servidores MCP indexados`,
  hero_title_a: 'La',
  hero_title_b: 'App Store',
  hero_title_c: 'de tus agentes IA.',
  hero_desc_a:
    'Descubre, explora e instala servidores Model Context Protocol con un clic. Funciona con',
  hero_desc_and: 'y',
  hero_ask_cta: 'o pregunta en lenguaje natural →',
  search_placeholder: 'Busca entre 600+ servidores MCP…',

  kpi_servers: 'servidores',
  kpi_stars: 'estrellas totales',
  kpi_categories: 'categorías',
  kpi_languages: 'lenguajes',

  browse_by_capability: 'Explora por capacidad',
  all_servers: 'todos los servidores →',
  servers_count: (n) => `${n} servidores`,
  featured: 'Destacados',
  view_all: 'ver todos →',

  how_title: 'De descubrir a instalar en 10 segundos',
  step1_title: 'Encuentra',
  step1_body:
    'Busca por capacidad o navega las categorías. Cada servidor es etiquetado automáticamente por Claude.',
  step2_title: 'Inspecciona',
  step2_body:
    'Lee el resumen generado por IA, las estrellas de GitHub, la licencia y la señal de último commit.',
  step3_title: 'Instala',
  step3_body:
    'Copia el snippet JSON para Claude Desktop, Cursor o Cline. Pega, reinicia, listo.',

  footer_about_mcp: 'Sobre MCP',
  footer_disclaimer: 'v0.1 · sin afiliación con Anthropic',

  browse_filter_category: 'Categoría',
  browse_filter_language: 'Lenguaje',
  browse_filter_all: 'Todas',
  browse_filter_all_languages: 'Todos los lenguajes',
  browse_results_for: (q) => `Resultados para "${q}"`,
  browse_all_title: 'Todos los servidores MCP',
  browse_no_results_eyebrow: 'sin resultados',
  browse_no_results_body: 'Prueba con otra búsqueda o categoría.',
  browse_pagination_range: (a, b, total) =>
    `${a.toLocaleString('es-ES')}–${b.toLocaleString('es-ES')} de ${total.toLocaleString('es-ES')}`,
  browse_pagination_prev: '← anterior',
  browse_pagination_next: 'siguiente →',
  browse_pagination_page_of: (p, t) => `página ${p} de ${t}`,

  ask_eyebrow: 'con Llama 3.3 70B + nuestro índice',
  ask_title: 'Dile a Studio qué necesitas.',
  ask_desc:
    'Describe lo que quieres conectar a Claude. Encontraremos los servidores MCP adecuados de nuestro índice de 600+ — con una explicación de por qué encaja cada uno.',
  ask_disclaimer:
    'Studio se basa solo en nuestro índice. No inventa servidores, no sigue prompts off-topic ni da consejos generales.',
  ask_input_placeholder: 'ej. quiero leer mi Gmail con Claude',
  ask_button: 'Preguntar',
  ask_try: 'prueba',
  ask_suggestions: [
    'Leer mis emails de Gmail',
    'Conectar Claude a mi base Postgres',
    'Buscar en la web con citas',
    'Gestionar mi workspace de Notion',
    'Ejecutar comandos shell de forma segura',
    'Leer PDFs y resumirlos',
  ],
  ask_off_topic_default:
    'Solo puedo ayudarte a encontrar servidores MCP. Pregúntame qué quieres conectar a Claude.',
  ask_studio_says: 'studio dice',
  ask_no_match_a: 'Ningún servidor MCP de nuestro índice encaja. Prueba a',
  ask_no_match_browse: 'explorar',
  ask_no_match_b: 'manualmente.',
  ask_another: '← hacer otra pregunta',
  ask_error: 'error',
  ask_off_topic_eyebrow: 'off-topic',
  ask_generic_error: 'Algo ha ido mal.',
  ask_network_error: 'Error de red',

  fab_ask: 'Pregunta a Studio',
}

const DICTS = { en, es } as const

export type Dict = typeof en

export function getDict(lang: Lang): Dict {
  return DICTS[lang] ?? DICTS[DEFAULT_LANG]
}

export function normaliseLang(raw: string | undefined | null): Lang {
  if (raw === 'es') return 'es'
  return 'en'
}

/**
 * Sub-diccionario solo-strings que pasamos a Client Components.
 * RSC no puede serializar funciones (las del Dict principal usan plurales),
 * así que extraemos solo las claves de tipo string que el AskChat necesita.
 */
export type AskChatDict = Pick<
  Dict,
  | 'ask_suggestions'
  | 'ask_input_placeholder'
  | 'ask_button'
  | 'ask_try'
  | 'ask_error'
  | 'ask_off_topic_eyebrow'
  | 'ask_off_topic_default'
  | 'ask_studio_says'
  | 'ask_no_match_a'
  | 'ask_no_match_browse'
  | 'ask_no_match_b'
  | 'ask_another'
  | 'ask_generic_error'
  | 'ask_network_error'
>

export function askChatDictFrom(d: Dict): AskChatDict {
  return {
    ask_suggestions: d.ask_suggestions,
    ask_input_placeholder: d.ask_input_placeholder,
    ask_button: d.ask_button,
    ask_try: d.ask_try,
    ask_error: d.ask_error,
    ask_off_topic_eyebrow: d.ask_off_topic_eyebrow,
    ask_off_topic_default: d.ask_off_topic_default,
    ask_studio_says: d.ask_studio_says,
    ask_no_match_a: d.ask_no_match_a,
    ask_no_match_browse: d.ask_no_match_browse,
    ask_no_match_b: d.ask_no_match_b,
    ask_another: d.ask_another,
    ask_generic_error: d.ask_generic_error,
    ask_network_error: d.ask_network_error,
  }
}
