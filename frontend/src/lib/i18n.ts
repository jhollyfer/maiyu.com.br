import { DateTime } from 'luxon'
import type { Locale as DayPickerLocale } from 'react-day-picker'
import { enUS, es, ptBR } from 'react-day-picker/locale'

import { getLocale } from '#/paraglide/runtime'
import type { Locale, MessagePart } from '#/paraglide/runtime'
import type { LocalizedText } from '@maiyu/shared'

/**
 * The calendar locale per language, for `date-picker`. The `satisfies` demands at
 * typecheck a calendar locale here for any new language in
 * `project.inlang/settings.json`. It comes from `react-day-picker/locale`, the path
 * the `DayPicker` documents for the `locale` prop (base: adacaibs `lib/i18n.ts`).
 */
const DAY_PICKER_LOCALES = {
  'pt-BR': ptBR,
  es,
  en: enUS,
} satisfies Record<Locale, DayPickerLocale>

/** The calendar locale in the request's language. */
export function dayPickerLocale(): DayPickerLocale {
  return DAY_PICKER_LOCALES[getLocale()]
}

/**
 * What depends on the current language and is not a message (`i18n.md` §2): record
 * content in the three languages, number and currency. Interface text is `m.*()`;
 * the enum label is `lib/labels.ts`.
 */

/**
 * The product's time zone. Every dashboard and site date is shown in it, and not in the
 * browser's time zone or UTC: the page renders on SSR, and the same time in
 * two zones diverges at hydration - besides showing 1pm for a 9am match.
 */
export const TIME_ZONE = 'America/Manaus'

/** The product's currency: the `formatCurrency` of a Brazilian product. */
const CURRENCY = 'BRL'

/** The text in the current language of content that exists in all three. */
export function localized(text: LocalizedText): string {
  return text[getLocale()]
}

/**
 * A number in the current language. Built on each use because the language changes with the URL;
 * `Intl` keeps the data cache internally. Never a hand-built format.
 */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(getLocale(), options).format(value)
}

/**
 * A file size in the current language (B, KB, MB), with one fixed decimal so the
 * upload list aligns. Base: adacaibs `lib/labels.ts`; here because it is a number
 * format by language, not an enum label.
 */
export function formatBytes(bytes: number): string {
  const oneDecimal = { minimumFractionDigits: 1, maximumFractionDigits: 1 }

  if (bytes < 1024) return `${formatNumber(bytes)} B`

  const kb = bytes / 1024
  if (kb < 1024) return `${formatNumber(kb, oneDecimal)} KB`

  return `${formatNumber(kb / 1024, oneDecimal)} MB`
}

/** A value in reais in the current language. */
export function formatCurrency(value: number): string {
  return formatNumber(value, { style: 'currency', currency: CURRENCY })
}

/**
 * The API instant on the local clock and in the current language (`frontend.md` §3.5):
 * explicit `setZone` and `setLocale` of the URL's language. The browser's time zone would make
 * SSR and hydration render different strings.
 */
export function localDateTime(value: string): DateTime {
  return DateTime.fromISO(value).setZone(TIME_ZONE).setLocale(getLocale())
}

/**
 * The current year on the local clock. Read in the route's `loader`, and not in the
 * render: `new Date()` in render diverges between SSR and hydration at the turn of the
 * year (`frontend.md` §3.2).
 */
export function currentLocalYear(): number {
  return DateTime.now().setZone(TIME_ZONE).year
}

/** The API date formatted on the local clock and in the current language. */
export function formatLocalDate(
  value: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return localDateTime(value).toLocaleString(options)
}

/** `2026-12-14T08:30` on the local clock to ISO in UTC. */
export function localInputToIso(value: string): string {
  return DateTime.fromISO(value, { zone: TIME_ZONE }).toUTC().toISO() ?? ''
}

/**
 * The plain text of a stretch of `m.x.parts()` (`_doc-lib/paraglide.md#/markup`): the markup
 * parts carry no text of their own, so only the `text` parts count.
 */
export function partsText(parts: MessagePart[]): string {
  let result = ''
  for (const part of parts) {
    if (part.type === 'text') result += part.value
  }
  return result
}
