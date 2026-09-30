import { Link } from '@tanstack/react-router'
import { ArrowUpRightIcon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

import { cn } from '#/lib/utils'

/**
 * A pílula de ação da vitrine: o botão redondo do hero, do fim da home e das
 * páginas internas.
 *
 * Mora aqui e não em `components/ui/` porque aquele diretório é o que o
 * `shadcn` entrega, e o próximo `shadcn add button` reescreveria o arquivo
 * levando junto as variantes da marca - foi o que aconteceu no academy.
 *
 * É link e não botão: toda chamada desta peça leva a outro lugar. Endereço
 * `http` abre em aba nova; caminho interno passa pelo router.
 */
const BASE =
  'group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 py-3 font-sans text-small font-medium transition-[background-color,border-color,color,transform] duration-300 ease-out-expo active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/**
 * Quatro tons:
 *
 *   primary  navy com verde no claro, verde com navy no escuro - a ação
 *            principal, no par do logo
 *   soft     contorno - a secundária ao lado dela; verde à noite
 *   brand    verde sólido, a chamada de conversa
 *   ghost    contorno neutro, para voltar
 */
const VARIANTS = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/85',
  soft: 'border border-foreground/25 bg-transparent text-foreground hover:border-foreground/50 hover:bg-foreground/[0.04] dark:border-brand-green/60 dark:text-brand-green dark:hover:bg-brand-green/10',
  brand:
    'bg-brand-green text-navy shadow-[0_10px_28px_-12px_rgba(136,255,154,0.75)] hover:bg-brand-blue',
  ghost:
    'border border-foreground/25 text-foreground hover:border-foreground/50 hover:bg-foreground/[0.04]',
} as const

type CtaLinkProps = {
  to: string
  children: ReactNode
  variant?: keyof typeof VARIANTS
  arrow?: boolean
  className?: string
  onClick?: () => void
}

export function CtaLink({
  to,
  children,
  variant = 'primary',
  arrow = false,
  className,
  onClick,
}: CtaLinkProps): React.JSX.Element {
  const classes = cn(BASE, VARIANTS[variant], className)
  const content = (
    <>
      {children}
      {arrow && (
        <ArrowUpRightIcon
          size={15}
          className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      )}
    </>
  )

  if (to.startsWith('http'))
    return (
      <a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        onClick={onClick}
      >
        {content}
      </a>
    )

  return (
    <Link to={to} className={classes} onClick={onClick}>
      {content}
    </Link>
  )
}
