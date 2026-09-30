import type * as React from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { m } from '#/paraglide/messages'
import { getLocale, setLocale } from '#/paraglide/runtime'
import type { Locale } from '#/paraglide/runtime'

/**
 * As três línguas do site. `native` fica no próprio idioma, e não traduzido:
 * quem procura o espanhol procura a palavra "Español", não "Espanhol".
 */
const OPTIONS: ReadonlyArray<{ code: Locale; label: string; native: string }> =
  [
    { code: 'pt-BR', label: 'PT', native: 'Português' },
    { code: 'en', label: 'EN', native: 'English' },
    { code: 'es', label: 'ES', native: 'Español' },
  ]

/**
 * Troca o idioma do site.
 *
 * `setLocale` leva à mesma página no endereço do outro idioma (`/portfolio`
 * vira `/en/portfolio`), e o recarregamento é o ponto: o servidor responde no
 * idioma escolhido desde o primeiro byte, com `lang`, título, canônico e cartão
 * de link certos. Trocar só no cliente deixaria o `head` no idioma anterior.
 *
 * O item atual é marcado por `data-current`, e o desenho dele mora na classe
 * `data-[current=true]:`, sem condicional no `className`.
 */
export function LanguageSwitcher(): React.JSX.Element {
  const locale = getLocale()
  const current = OPTIONS.find((option) => option.code === locale) ?? OPTIONS[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-slot="language-switcher"
        aria-label={m.a11y_changeLanguage()}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium tracking-[0.18em] text-foreground/70 uppercase transition-[color,border-color] duration-500 ease-out-expo hover:border-foreground/30 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
      >
        {current.label}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="min-w-[180px] rounded-2xl border border-border bg-background/95 p-1.5 backdrop-blur-xl"
      >
        {OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.code}
            data-current={option.code === locale}
            onClick={() => setLocale(option.code)}
            className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground data-[current=true]:bg-foreground/5 data-[current=true]:text-foreground"
          >
            <span>{option.native}</span>
            <span className="text-[10px] font-medium tracking-[0.22em] uppercase">
              {option.label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
