import * as React from 'react'
import { MoonIcon, SunIcon } from '@phosphor-icons/react'
import { useTheme } from 'next-themes'

import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'

/**
 * Alterna entre claro e escuro.
 *
 * Os dois ícones ficam **sempre montados**, empilhados, e a troca é `rotate` +
 * `scale` de um para o outro. Montar e desmontar conforme o tema daria o mesmo
 * resultado estático e nenhuma transição - e, no primeiro render do servidor,
 * ainda escolheria o ícone errado.
 *
 * Por isso também não há `if (!mounted) return null`: o tema resolvido só
 * existe no cliente, mas aqui nada depende dele para renderizar. Quem decide
 * qual ícone aparece é a classe `dark` no `<html>`, que o script do
 * `next-themes` escreve antes da hidratação.
 */
/**
 * `className` porque o alvo muda de tamanho conforme onde ele mora.
 *
 * O `size="icon"` do registry é 28px, que é a medida certa ao lado de uma
 * tabela no painel e é pequena demais no cabeçalho do celular - o botão de menu
 * ao lado dele usa 44px justamente por isso. Quem chama decide; o padrão
 * continua sendo o do registry.
 */
export function ThemeToggle({
  className,
}: {
  className?: string
}): React.JSX.Element {
  const { resolvedTheme, setTheme } = useTheme()

  function toggle(): void {
    // Sem ternário: cada estado é uma linha legível de cima para baixo.
    let next = 'dark'
    if (resolvedTheme === 'dark') next = 'light'

    setTheme(next)
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            data-slot="theme-toggle"
            data-test-id="theme-toggle"
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label={m.a11y_toggleTheme()}
            className={cn('relative overflow-hidden', className)}
          >
            <SunIcon
              weight="fill"
              className="absolute rotate-90 scale-0 transition-transform duration-300 motion-reduce:transition-none dark:rotate-0 dark:scale-100"
            />
            <MoonIcon
              weight="fill"
              className="absolute rotate-0 scale-100 transition-transform duration-300 motion-reduce:transition-none dark:-rotate-90 dark:scale-0"
            />
          </Button>
        }
      />
      <TooltipContent side="bottom">{m.a11y_toggleTheme()}</TooltipContent>
    </Tooltip>
  )
}
