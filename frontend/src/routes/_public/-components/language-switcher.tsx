import { getLocale, setLocale } from '#/paraglide/runtime'
import type { Locale } from '#/paraglide/runtime'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

/**
 * As três línguas do site. `native` fica no próprio idioma, e não traduzido:
 * quem procura o espanhol procura a palavra "Español", não "Espanhol".
 */
const OPTIONS: Array<{ code: Locale; label: string; native: string }> = [
  { code: 'pt-BR', label: 'PT', native: 'Português' },
  { code: 'en', label: 'EN', native: 'English' },
  { code: 'es', label: 'ES', native: 'Español' },
]

/**
 * Troca o idioma do site.
 *
 * `setLocale` grava o cookie e recarrega a página, e o recarregamento é o
 * ponto: o servidor lê o cookie na próxima requisição e responde no idioma
 * escolhido desde o primeiro byte, com `lang`, título e cartão de link
 * certos. Trocar só no cliente deixaria metade da página - os metadados do
 * `head` - no idioma anterior.
 */
export function LanguageSwitcher(): React.JSX.Element {
  const locale = getLocale()
  const current = OPTIONS.find((option) => option.code === locale) ?? OPTIONS[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={m.a11y_changeLanguage()}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium tracking-[0.18em] text-foreground/70 uppercase transition-[color,border-color] duration-500 ease-out-expo hover:border-foreground/30 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
            onClick={() => setLocale(option.code)}
            className={cn(
              'flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground',
              option.code === locale && 'bg-foreground/5 text-foreground',
            )}
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
