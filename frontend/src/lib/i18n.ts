import { getLocale, locales, localizeHref } from '#/paraglide/runtime'
import type { Locale } from '#/paraglide/runtime'

import { absoluteUrl } from './site'

/**
 * Texto de conteúdo nas três línguas do site.
 *
 * As mensagens de interface moram em `messages/{locale}.json` e saem do
 * paraglide como função (`m.nav_home()`). O conteúdo que vem em registro, como
 * o resumo de um projeto ou o título de um artigo, fica junto do próprio
 * registro em `lib/`: separar a tradução do dado a que ela pertence faz as duas
 * metades envelhecerem em ritmos diferentes.
 */
export type LocalizedText = Record<Locale, string>

/** O texto no idioma da requisição. */
export function localized(text: LocalizedText): string {
  return text[getLocale()]
}

/**
 * Uma data de registro (`AAAA-MM-DD`) escrita por extenso no idioma da
 * requisição, como "8 de setembro de 2026".
 *
 * `timeZone: 'UTC'` porque a data do registro não tem hora: lida no fuso do
 * servidor ou do navegador, `2026-09-08` viraria 7 de setembro a oeste de
 * Greenwich, e o SSR e a hidratação desenhariam dias diferentes.
 */
export function localizedDate(
  iso: string,
  locale: Locale = getLocale(),
): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso))
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

/**
 * O endereço absoluto de um caminho interno, no idioma pedido (ou no da
 * requisição).
 *
 * `localizeHref` e não concatenação de prefixo: o português é o idioma base e
 * não leva prefixo (`/portfolio`), os outros levam (`/en/portfolio`), e a regra
 * mora no paraglide, que é quem a aplica no roteamento também.
 */
export function localizedUrl(path: string, locale?: Locale): string {
  return absoluteUrl(localizeHref(path, { locale }))
}

/**
 * Os `<link rel="alternate" hreflang>` de uma página, um por idioma e mais o
 * `x-default`.
 *
 * Sem eles o buscador trata `/portfolio` e `/en/portfolio` como conteúdo
 * duplicado e escolhe um sozinho, e quem busca em espanhol cai na versão em
 * português. O `x-default` aponta para o idioma base, que é o que o site serve
 * a quem não pediu nenhum.
 */
export function alternateLinks(
  path: string,
): Array<{ rel: string; hrefLang: string; href: string }> {
  const links = locales.map((locale) => ({
    rel: 'alternate',
    hrefLang: locale,
    href: localizedUrl(path, locale),
  }))

  return [
    ...links,
    {
      rel: 'alternate',
      hrefLang: 'x-default',
      href: localizedUrl(path, 'pt-BR'),
    },
  ]
}
