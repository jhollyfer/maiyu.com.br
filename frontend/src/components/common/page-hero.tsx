import type { ReactNode } from 'react'

import { AnimateInView } from '#/components/common/animate-in-view'
import { SkyBackdrop } from '#/components/common/sky'

/**
 * O topo centralizado das páginas internas: céu, mata, título e barra verde.
 *
 * O `padding` de baixo acompanha a altura da mata (`clamp` com o mesmo
 * intervalo do `Forest`), e é o que impede o texto de cair por cima das copas
 * em tela pequena.
 */
export function PageHero({
  title,
  lead,
  children,
}: {
  title: ReactNode
  lead?: string
  children?: ReactNode
}): React.JSX.Element {
  return (
    <section className="relative overflow-hidden pt-36 pb-[clamp(180px,19vw,280px)] md:pt-44">
      <SkyBackdrop />
      <div className="rails pointer-events-none absolute inset-0 opacity-60" />
      <AnimateInView className="relative mx-auto flex max-w-4xl flex-col items-center px-4 text-center md:px-8">
        <h1 className="text-[clamp(2.4rem,5.5vw,5.25rem)] leading-[0.98] tracking-[-0.015em] text-foreground">
          {title}
        </h1>
        <span aria-hidden="true" className="brand-bar mt-7 w-24" />
        {lead && (
          <p className="mt-7 max-w-[46ch] text-lead leading-snug text-foreground/80">
            {lead}
          </p>
        )}
        {children}
      </AnimateInView>
    </section>
  )
}
