import { getLocale } from '#/paraglide/runtime'
import type { Locale } from '#/paraglide/runtime'

/**
 * Texto de conteúdo nas três línguas do site.
 *
 * As mensagens de interface moram em `messages/{locale}.json` e saem do
 * paraglide como função (`m.nav_home()`). O conteúdo que vem em registro - o
 * resumo de um projeto, o título de um artigo - fica junto do próprio registro
 * em `lib/`, porque separar a tradução do dado a que ela pertence faz as duas
 * metades envelhecerem em ritmos diferentes.
 */
export type LocalizedText = Record<Locale, string>

/** O texto no idioma da requisição (servidor) ou do cookie (navegador). */
export function localized(text: LocalizedText): string {
  return text[getLocale()]
}

/**
 * O idioma em formato de `og:locale`, que usa sublinhado e não hífen.
 *
 * Lookup e não `replace('-', '_')`: `en` e `es` não têm região, e o cartão de
 * link quer uma região explícita para não adivinhar.
 */
const OG_LOCALES: Record<Locale, string> = {
  'pt-BR': 'pt_BR',
  en: 'en_US',
  es: 'es_ES',
}

export function ogLocale(): string {
  return OG_LOCALES[getLocale()]
}
