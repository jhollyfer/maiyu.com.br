import type * as React from 'react'

import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

import { REVEAL, STAGGER } from './reveal'

/**
 * Os três fatos que sustentam a frase. Funções e não chaves montadas por
 * texto, pelo mesmo motivo da visão: o compilador do paraglide confere a
 * função, e ninguém confere a chave montada.
 */
const FACTS = [
  {
    title: () => m.home_roots_fact1_title(),
    description: () => m.home_roots_fact1_desc(),
  },
  {
    title: () => m.home_roots_fact2_title(),
    description: () => m.home_roots_fact2_desc(),
  },
  {
    title: () => m.home_roots_fact3_title(),
    description: () => m.home_roots_fact3_desc(),
  },
] as const

/**
 * Quem somos: a frase que diz de onde a Maiyu vem, dita logo depois da prova
 * de que ela entrega.
 *
 * O diferencial da empresa (indígena, da tríplice fronteira, a primeira) não
 * cabe num card de serviço nem numa linha do rodapé: sem uma seção própria ele
 * só aparecia diluído no texto da hero, e quem lê rápido passava sem ver.
 *
 * Os fatos ficam numa lista de definição com fios entre as colunas, e não em
 * cards: são três afirmações de uma mesma frase, não três produtos.
 */
export function Roots(): React.JSX.Element {
  return (
    <section
      data-slot="home-roots"
      className="relative isolate bg-secondary py-24 md:py-32"
    >
      <div aria-hidden="true" className="trancado absolute inset-x-0 top-0" />

      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid items-end gap-12 md:grid-cols-12">
          <div className={cn(REVEAL, 'md:col-span-10')}>
            <h2 className="text-display tracking-[-0.015em] text-foreground">
              {m.home_roots_title()}
            </h2>
            <p className="mt-8 max-w-[62ch] font-serif text-lead text-foreground/80">
              {m.home_roots_desc()}
            </p>
          </div>
        </div>

        <dl className="mt-16 grid gap-10 border-t border-border pt-10 md:mt-20 md:grid-cols-3 md:gap-0 md:divide-x md:divide-border">
          {FACTS.map((fact, index) => (
            <div
              key={index}
              className={cn(REVEAL, 'md:px-8 md:first:pl-0 md:last:pr-0')}
              style={{ animationDelay: `${(index + 2) * STAGGER}ms` }}
            >
              <dt className="text-h3 font-bold text-urucum">{fact.title()}</dt>
              <dd className="mt-3 max-w-[32ch] font-serif text-body-lg text-foreground/80">
                {fact.description()}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
