import type * as React from 'react'

import { REVEAL } from './reveal'
import { SkyBackdrop } from '#/components/common/sky'
import { cn } from '#/lib/utils'

type PageHeroProps = {
  /** O `h1` da página. */
  title: React.ReactNode
  /** A frase sob a barra verde. */
  lead?: string
  /** O que vem depois do texto: pílula de categoria, ações. */
  children?: React.ReactNode
}

/**
 * O topo centralizado das páginas internas: céu, mata, título e barra verde.
 *
 * O papel do `SectionTitle as="h1"` do academy, que abre as páginas internas
 * de lá. Mora aqui, na casca pública, pelo mesmo motivo: é peça da vitrine, e
 * as quatro páginas que a usam são todas desta área.
 *
 * O `padding` de baixo acompanha a altura da mata (o `clamp` tem o mesmo
 * intervalo do `Forest`), e é o que impede o texto de cair por cima das copas
 * em tela pequena.
 */
export function PageHero({
  title,
  lead,
  children,
}: PageHeroProps): React.JSX.Element {
  return (
    <section
      data-slot="page-hero"
      className="relative overflow-hidden pt-36 pb-[clamp(180px,19vw,280px)] md:pt-44"
    >
      <SkyBackdrop />
      <div className="rails pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 text-center md:px-8">
        <h1
          className={cn(
            REVEAL,
            'text-[clamp(2.4rem,5.5vw,5.25rem)] leading-[0.98] tracking-[-0.015em] text-foreground',
          )}
        >
          {title}
        </h1>
        <span
          aria-hidden="true"
          className={cn(REVEAL, 'brand-bar mt-7 w-24 delay-100')}
        />
        {lead && (
          <p
            className={cn(
              REVEAL,
              'mt-7 max-w-[46ch] text-lead leading-snug text-foreground/80 delay-100',
            )}
          >
            {lead}
          </p>
        )}
        {children}
      </div>
    </section>
  )
}
