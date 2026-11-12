import { DateTime } from 'luxon'

import { TIME_ZONE } from '#/lib/i18n'
import { getLocale } from '#/paraglide/runtime'
import type { Locale } from '#/paraglide/runtime'

/*
 * O que o site escreve por idioma e o kit não cobre: a data de registro, que não tem hora.
 * Mora aqui e não em `lib/i18n.ts` porque aquele é espelho do kit (o sync o sobrescreve), e o
 * `localDateTime` dele lê o texto no fuso do processo antes de converter, o que recuaria um dia
 * numa data sem hora (`DECISIONS.md` #384).
 */

/**
 * Uma data de registro (`AAAA-MM-DD`) escrita por extenso no idioma da requisição, como
 * "8 de setembro de 2026".
 *
 * `fromISO` com `zone` lê a data já no fuso do produto (`TIME_ZONE` do kit), e não no do
 * servidor ou do navegador: `2026-09-08` lida em UTC viraria 7 de setembro a oeste de
 * Greenwich, e o SSR e a hidratação desenhariam dias diferentes. `DATE_FULL` é o formato
 * predefinido de data por extenso, que segue a ordem de cada idioma
 * (_doc-lib/luxon.md#zones, https://moment.github.io/luxon/docs/zones.md;
 * _doc-lib/luxon.md#formatting, https://moment.github.io/luxon/docs/formatting.md).
 */
export function localizedDate(
  iso: string,
  locale: Locale = getLocale(),
): string {
  return DateTime.fromISO(iso, { zone: TIME_ZONE })
    .setLocale(locale)
    .toLocaleString(DateTime.DATE_FULL)
}
