import { GlobeIcon } from '@phosphor-icons/react'
import type * as React from 'react'

import { NativeSelect, NativeSelectOption } from '#/components/ui/native-select'
import { cn } from '#/lib/cn'
import { m } from '#/paraglide/messages'
import { getLocale, isLocale, locales, setLocale } from '#/paraglide/runtime'
import type { Locale } from '#/paraglide/runtime'

/**
 * The name of each language in its own language, fixed and outside the messages: whoever does not
 * read the screen language must recognize theirs in the list, and translating the name
 * ("Spanish" on a Portuguese screen) hides exactly that clue. The
 * `satisfies` demands a name for any new language in `project.inlang/settings.json`.
 */
const LOCALE_NAMES = {
  'pt-BR': 'Português (Brasil)',
  es: 'Español',
  en: 'English',
} satisfies Record<Locale, string>

/** The short code of each language, for the compact form that has no room for the name. */
const LOCALE_CODES = {
  'pt-BR': 'PT',
  es: 'ES',
  en: 'EN',
} satisfies Record<Locale, string>

type LocaleSwitcherProps = Omit<
  React.ComponentProps<typeof NativeSelect>,
  'value' | 'onChange' | 'children'
> & {
  /**
   * Below `lg` it shows a globe and the code (PT, ES, EN) in a 44 px target instead of the
   * language's name, which the panel header has no room for; the list the select opens
   * still names each language in full.
   */
  readonly compact?: boolean
}

/**
 * The language selector.
 *
 * No state of its own: the value is the document's `getLocale()` and the switch is
 * `setLocale`, which updates the strategy and does a **document navigation**
 * to the other language's URL. The server renders the HTML in it, the `<html lang>`
 * and the `head` along with it, and the client hydrates in the same language
 * (_doc-lib/paraglide.md#/basics, https://paraglidejs.com/basics and
 * https://paraglidejs.com/tanstack-start, "Locale switching"). `reload: false`
 * would leave the URL and the shell in the old language.
 */
export function LocaleSwitcher({
  compact = false,
  className,
  ...props
}: LocaleSwitcherProps): React.JSX.Element {
  const select = (
    <NativeSelect
      data-slot="locale-switcher"
      aria-label={m.kit_locale_switcher_label()}
      value={getLocale()}
      onChange={(event) => {
        const next = event.target.value

        if (isLocale(next)) void setLocale(next)
      }}
      // `ui/native-select` takes `className` on its wrapper only: the compact form reaches the
      // `select` and the caret through it, without a prop the shadcn piece does not have.
      className={cn(
        compact &&
          'w-11 lg:w-fit [&>select]:px-0 [&>select]:text-transparent lg:[&>select]:pr-6 lg:[&>select]:pl-2 lg:[&>select]:text-foreground max-lg:[&>svg]:hidden',
        className,
      )}
      {...props}
    >
      {locales.map((locale) => (
        <NativeSelectOption key={locale} value={locale} lang={locale}>
          {LOCALE_NAMES[locale]}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )

  if (!compact) return select

  return (
    <div className="relative">
      {select}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-caption leading-none font-medium lg:hidden"
      >
        <GlobeIcon className="size-4" />
        {LOCALE_CODES[getLocale()]}
      </span>
    </div>
  )
}
