import type * as React from 'react'

import { REVEAL } from './reveal'
import { cn } from '#/lib/utils'

type PageHeroProps = {
  /** O `h1` da página. */
  title: React.ReactNode
  /** A frase sob o título. */
  lead?: string
  /** O que vem depois do texto: pílula de categoria, ações. */
  children?: React.ReactNode
}

/**
 * A capa editorial das páginas internas: título grande à
 * esquerda, a frase de apoio e o trançado como fio de base.
 *
 * Sem ilustração: a página abre só com tipografia, e a foto de lugar entra
 * logo abaixo, na seção seguinte. O papel do `SectionTitle as="h1"` do
 * academy, que abre as páginas internas de lá, e mora aqui pelo mesmo motivo
 * de antes: é peça da vitrine.
 *
 * O trançado fica no fim da capa, e não no meio da página: ele separa o
 * capítulo de abertura do primeiro conteúdo, como o fio que fecha a página
 * de um caderno.
 */
export function PageHero({
  title,
  lead,
  children,
}: PageHeroProps): React.JSX.Element {
  return (
    <section data-slot="page-hero" className="pt-36 md:pt-44">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <h1
          className={cn(
            REVEAL,
            'max-w-5xl text-display leading-[0.98] tracking-[-0.02em] text-balance text-foreground',
          )}
        >
          {title}
        </h1>
        {lead && (
          <p
            className={cn(
              REVEAL,
              'mt-8 max-w-[56ch] text-lead leading-snug text-foreground/80 delay-100',
            )}
          >
            {lead}
          </p>
        )}
        {children && (
          <div className={cn(REVEAL, 'mt-8 delay-200')}>{children}</div>
        )}
        <span
          aria-hidden="true"
          className="trancado mt-16 block w-full md:mt-20"
        />
      </div>
    </section>
  )
}
