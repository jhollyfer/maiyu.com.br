import { DateTime } from 'luxon'

import { TIME_ZONE } from '#/lib/i18n'
import { getLocale } from '#/paraglide/runtime'
import type { Locale } from '#/paraglide/runtime'

/*
 * What the site writes per language that the kit does not cover: the registry date, which has no
 * time. It lives here and not in `lib/i18n.ts` because that one mirrors the kit (the sync
 * overwrites it), and its `localDateTime` reads the text in the process time zone before
 * converting, which would move a date without a time back one day (`DECISIONS.md` #384).
 */

/**
 * A registry date (`YYYY-MM-DD`) written out in full in the request's language, such as
 * "September 8, 2026".
 *
 * `fromISO` with `zone` reads the date already in the product's time zone (the kit's `TIME_ZONE`),
 * and not in the server's or the browser's: `2026-09-08` read in UTC would become September 7 west
 * of Greenwich, and SSR and hydration would draw different days. `DATE_FULL` is the predefined
 * long-date format, which follows the order of each language
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
