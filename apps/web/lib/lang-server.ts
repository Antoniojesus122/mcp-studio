import { cookies } from 'next/headers'
import { DEFAULT_LANG, LANG_COOKIE, type Lang, normaliseLang } from './i18n'

/** Lee la cookie `mcps_lang` y devuelve un Lang válido. Default: en. */
export async function getLang(): Promise<Lang> {
  try {
    const store = await cookies()
    return normaliseLang(store.get(LANG_COOKIE)?.value)
  } catch {
    return DEFAULT_LANG
  }
}
