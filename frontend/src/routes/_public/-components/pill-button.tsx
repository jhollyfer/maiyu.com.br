import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import type * as React from 'react'

import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import type { Merge } from '@maiyu/shared'

/**
 * A pílula do site: o botão redondo do hero, do fim da home e das páginas
 * internas.
 *
 * A mesma peça do academy, e pelo mesmo motivo: mora fora de
 * `components/ui/button.tsx` porque aquele diretório é o que o `shadcn`
 * entrega, e `shadcn add button` reescreve o arquivo inteiro. O que é da Maiyu
 * **compõe** o botão de fábrica, que continua tratando foco, `disabled`,
 * `render` e ícone.
 *
 * Na casca pública e não em `components/common/`, que é onde o academy a
 * guarda: lá o painel também a usa, e aqui só a vitrine.
 *
 * Os nomes dos tons são os do academy; as cores são as da Maiyu:
 *
 *   ink           a ação principal: navy com verde no claro, verde com navy
 *                 no escuro, o par do logo
 *   outline       a secundária ao lado dela; verde à noite
 *   neon          verde sólido, a chamada de conversa, e a única que vive
 *                 também dentro da faixa navy
 *   neon-outline  a secundária dentro da faixa navy
 */
const pillVariants = cva(
  "rounded-full border-[1.5px] font-medium transition-[background-color,border-color,color,transform] duration-300 ease-out-expo active:scale-[0.98] motion-reduce:transition-none [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      tone: {
        ink: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/85 hover:text-primary-foreground',
        outline:
          'border-foreground/25 bg-transparent text-foreground hover:border-foreground/50 hover:bg-foreground/[0.04] hover:text-foreground dark:border-brand-green/60 dark:text-brand-green dark:hover:bg-brand-green/10 dark:hover:text-brand-green',
        neon: 'border-transparent bg-brand-green text-navy shadow-[0_10px_28px_-12px_rgba(136,255,154,0.75)] hover:bg-brand-blue hover:text-navy',
        'neon-outline':
          'border-brand-green/60 bg-transparent text-brand-green hover:bg-brand-green/10 hover:text-brand-green',
      },
      scale: {
        md: 'h-10 gap-2 px-4 text-small',
        lg: 'h-12 gap-2 px-6 text-small',
      },
    },
    defaultVariants: {
      tone: 'ink',
      scale: 'lg',
    },
  },
)

/**
 * O resto das props vai para o `Button`, e `variant`/`size` ficam de fora: quem
 * decide os dois é este componente. Sem o `Omit`, um `variant="link"`
 * esquecido passaria pelo tipo e desmontaria a pílula em silêncio.
 */
type PillButtonProps = Merge<
  Omit<React.ComponentProps<typeof Button>, 'variant' | 'size'>,
  VariantProps<typeof pillVariants>
>

function PillButton({
  className,
  tone = 'ink',
  scale = 'lg',
  render,
  nativeButton,
  ...props
}: PillButtonProps): React.JSX.Element {
  /*
    Quase toda pílula daqui é um link. O `Button` do Base UI assume
    `nativeButton` verdadeiro e avisa no console a cada render quando o
    elemento final não é `<button>`; com `render` presente o padrão passa a
    ser `false`, e quem quiser o contrário ainda diz na chamada.
  */
  let isNativeButton = nativeButton
  if (isNativeButton === undefined) isNativeButton = !render

  return (
    <Button
      {...props}
      render={render}
      nativeButton={isNativeButton}
      className={cn(pillVariants({ tone, scale }), className)}
    />
  )
}

export { PillButton, pillVariants }
