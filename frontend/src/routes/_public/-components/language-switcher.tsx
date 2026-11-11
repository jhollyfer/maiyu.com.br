import type * as React from 'react'

import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { m } from '#/paraglide/messages'
import { getLocale, locales, setLocale } from '#/paraglide/runtime'
import type { Locale } from '#/paraglide/runtime'

/**
 * As três línguas do site. `native` fica no próprio idioma, e não traduzido:
 * quem procura o espanhol procura a palavra "Español", não "Espanhol".
 *
 * Lookup por `Locale`, e não lista com `find`: a chave é o idioma, então o atual
 * sai sem busca nem fallback, e um idioma novo no `project.inlang` sem rótulo
 * aqui reprova no `satisfies`. A ordem do menu é a de `locales`.
 */
const OPTIONS = {
  'pt-BR': { label: 'PT', native: 'Português' },
  en: { label: 'EN', native: 'English' },
  es: { label: 'ES', native: 'Español' },
} satisfies Record<Locale, { label: string; native: string }>

/**
 * Troca o idioma do site.
 *
 * `setLocale` leva à mesma página no endereço do outro idioma (`/pt-br/portfolio`
 * vira `/en/portfolio`), e o recarregamento é o ponto: o servidor responde no
 * idioma escolhido desde o primeiro byte, com `lang`, título, canônico e cartão
 * de link certos. Trocar só no cliente deixaria o `head` no idioma anterior.
 *
 * O item atual é marcado por `data-current`, e o desenho dele mora na classe
 * `data-[current=true]:`, sem condicional no `className`.
 */
export function LanguageSwitcher(): React.JSX.Element {
  const locale = getLocale()
  const current = OPTIONS[locale]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            data-slot="language-switcher"
            variant="outline"
            aria-label={m.a11y_changeLanguage()}
            className="min-h-9 gap-1.5 rounded-full border-border bg-transparent px-3 py-1.5 text-[11px] font-medium tracking-[0.18em] text-foreground/70 uppercase transition-[color,border-color] duration-500 ease-out-expo hover:border-foreground/30 hover:bg-transparent hover:text-foreground motion-reduce:transition-none"
          >
            {current.label}
          </Button>
        }
      />
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="min-w-[180px] rounded-2xl border border-border bg-background/95 p-1.5 backdrop-blur-xl"
      >
        {locales.map((code) => (
          <DropdownMenuItem
            key={code}
            data-current={code === locale}
            onClick={() => setLocale(code)}
            className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground data-[current=true]:bg-foreground/5 data-[current=true]:text-foreground"
          >
            <span>{OPTIONS[code].native}</span>
            <span className="text-[10px] font-medium tracking-[0.22em] uppercase">
              {OPTIONS[code].label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
