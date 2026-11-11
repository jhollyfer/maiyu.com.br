import { DateTime } from 'luxon'

import {
  baseLocale,
  getLocale,
  locales,
  localizeHref,
} from '#/paraglide/runtime'
import type { Locale } from '#/paraglide/runtime'

import { absoluteUrl } from './site'

/*
 * O que no site depende do idioma da requisição e a régua não cobre: data de
 * registro em UTC, `og:locale` e a URL absoluta com prefixo de idioma. Mora aqui
 * e não em `lib/i18n.ts` porque aquele é espelho do kit (o sync o sobrescreve), e
 * o kit não conhece o prefixo de URL nem a data sem hora deste site
 * (`DECISIONS.md` #384).
 */

/**
 * O fuso em que o site escreve data, fixo e explícito (`_standards/frontend.md`
 * §3.5). `UTC` porque a data de registro não tem hora: lida no fuso do
 * servidor ou do navegador, `2026-09-08` viraria 7 de setembro a oeste de
 * Greenwich, e o SSR e a hidratação desenhariam dias diferentes
 * (_doc-lib/luxon.md#zones, https://moment.github.io/luxon/docs/zones.md).
 */
const DISPLAY_ZONE = 'UTC'

/**
 * Uma data de registro (`AAAA-MM-DD`) escrita por extenso no idioma da
 * requisição, como "8 de setembro de 2026".
 *
 * `fromISO` com `zone` lê a data já no fuso de exibição, e `DATE_FULL` é o
 * formato predefinido de data por extenso: a doc pede os predefinidos sempre
 * que a data é para gente ler, porque eles seguem a ordem de cada idioma
 * (_doc-lib/luxon.md#formatting, https://moment.github.io/luxon/docs/formatting.md;
 * https://moment.github.io/luxon/api-docs/index.html#datetimefromiso).
 */
export function localizedDate(
  iso: string,
  locale: Locale = getLocale(),
): string {
  return DateTime.fromISO(iso, { zone: DISPLAY_ZONE })
    .setLocale(locale)
    .toLocaleString(DateTime.DATE_FULL)
}

/**
 * O ano corrente no fuso de exibição, para a assinatura do rodapé.
 *
 * `DateTime.now()` nasce na zona do sistema que roda o código
 * (https://moment.github.io/luxon/api-docs/index.html#datetimenow), e o
 * `setZone` fixa a mesma leitura no servidor e no navegador.
 */
export function currentYear(): number {
  return DateTime.now().setZone(DISPLAY_ZONE).year
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
 * `localizeHref` e não concatenação de prefixo: todo idioma leva prefixo
 * minúsculo (`/pt-br/portfolio`, `/en/portfolio`, `/es/portfolio`), e a regra
 * mora nos `urlPatterns` de `project.inlang/paraglide.config.ts`, que é o que o
 * roteamento também aplica (`DECISIONS.md` #384,
 * _doc-lib/paraglide.md#/i18n-routing, https://paraglidejs.com/i18n-routing).
 * Nenhuma URL absoluta sai sem prefixo: a raiz responde 307 para `/pt-br`, e
 * um canônico que redireciona é um canônico que o buscador descarta.
 */
export function localizedUrl(path: string, locale?: Locale): string {
  return absoluteUrl(localizeHref(path, { locale }))
}

/**
 * Os `<link rel="alternate" hreflang>` de uma página, um por idioma e mais o
 * `x-default`.
 *
 * Sem eles o buscador trata `/pt-br/portfolio` e `/en/portfolio` como conteúdo
 * duplicado e escolhe um sozinho, e quem busca em espanhol cai na versão em
 * português. O `x-default` aponta para o idioma base já prefixado
 * (`/pt-br/...`), que é o destino do 307 de quem chega sem prefixo: apontá-lo
 * para a raiz seria declarar como padrão uma URL que redireciona.
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
      href: localizedUrl(path, baseLocale),
    },
  ]
}
